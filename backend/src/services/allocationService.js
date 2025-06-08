import pool from "../config/db.js";
import AccommodationApplication from "../models/AccommodationApplication.js";
import Room from "../models/Room.js";
import RoomReservation from "../models/RoomReservation.js";
import { DormitoryPassService } from "./dormitoryPassService.js";
import Notification from "../models/Notification.js";

class AllocationService {
  static async allocateRoomForApplication(applicationId, adminUserId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const application = await AccommodationApplication.findById(applicationId);
      // FIX: Changed status check from 'approved_by_faculty' to 'approved_by_dorm'
      // to match the correct business logic flow from the controller.
      if (!application || application.status !== 'approved_by_dorm') {
        throw new Error(`Заявка ${applicationId} не знайдена або не має статусу "Затверджено гуртожитком", необхідного для поселення.`);
      }

      const userResult = await connection.query('SELECT * FROM users WHERE id = ?', [application.user_id]);
      const user = userResult[0][0];
      const userGender = user.gender;

      if (userGender !== 'male' && userGender !== 'female') {
        throw new Error(`Стать студента (${userGender}) не визначена як "male" або "female", розподіл неможливий.`);
      }

      let assignedRoomId = null;
      let allocationMethod = '';

      // Attempt to find a previously occupied room (if applicable)
      assignedRoomId = await this.tryAllocatePreviousRoom(application, userGender, connection);
      if (assignedRoomId) allocationMethod = 'previous_room';

      // If not found, check for an existing reservation
      if (!assignedRoomId) {
        assignedRoomId = await this.tryAllocateReservedRoom(application, connection);
        if (assignedRoomId) allocationMethod = 'reservation';
      }

      // If still not found, use smart allocation logic
      if (!assignedRoomId) {
        const result = await this.findAndAllocateSmart(application, userGender, connection);
        assignedRoomId = result.roomId;
        allocationMethod = result.method;
      }

      if (!assignedRoomId) {
        throw new Error(`Не вдалося знайти підходящу кімнату для заявки ${applicationId}.`);
      }

      // Finalize the allocation process
      await this.finalizeAllocation(application, assignedRoomId, adminUserId, allocationMethod, connection);

      await connection.commit();
      console.log(`[AllocationService] Успішно розподілено кімнату ${assignedRoomId} для заявки ${applicationId} методом "${allocationMethod}".`);
      return { success: true, roomId: assignedRoomId, method: allocationMethod };
    } catch (error) {
      await connection.rollback();
      console.error(`[AllocationService] Помилка розподілу для заявки ${applicationId}:`, error);
      throw error; // Re-throw to be caught by the controller
    } finally {
      connection.release();
    }
  }

  static async tryAllocatePreviousRoom(application, userGender, connection) {
    const prevAcademicYear = `${parseInt(application.start_date.split('-')[0]) - 1}-${parseInt(application.end_date.split('-')[0]) - 1}`;
    const [history] = await connection.query(
      `SELECT room_id FROM room_history WHERE user_id = ? AND academic_year = ?`,
      [application.user_id, prevAcademicYear]
    );

    if (history.length > 0) {
      const prevRoomId = history[0].room_id;
      const room = await Room.findById(prevRoomId, connection);
      if (room && room.dormitory_id === application.dormitory_id && this.isRoomCompatible(room, userGender)) {
        return prevRoomId;
      }
    }
    return null;
  }

  static async tryAllocateReservedRoom(application, connection) {
    const academicYear = `${new Date(application.start_date).getFullYear()}-${new Date(application.end_date).getFullYear()}`;
    const [reservations] = await connection.query(
      `SELECT room_id FROM room_reservations WHERE user_id = ? AND academic_year = ? AND status = 'confirmed'`,
      [application.user_id, academicYear]
    );

    if (reservations.length > 0) {
      return reservations[0].room_id;
    }
    return null;
  }

  static async findAndAllocateSmart(application, userGender, connection) {
    const rooms = await this.getAvailableRooms(application.dormitory_id, connection);

    // Prioritize rooms with students from the same course or group
    let compatibleRoom = rooms.find(room =>
      this.isRoomCompatible(room, userGender) &&
      this.hasSimilarStudents(room.id, application.course, application.group_id, connection)
    );
    if (compatibleRoom) return { roomId: compatibleRoom.id, method: 'grouping_similar' };

    // Find any compatible room
    compatibleRoom = rooms.find(room => this.isRoomCompatible(room, userGender));
    if (compatibleRoom) return { roomId: compatibleRoom.id, method: 'grouping_compatible' };

    // Find any empty room to start a new group
    const emptyRoom = rooms.find(room => room.current_gender_occupancy === 'empty');
    if (emptyRoom) return { roomId: emptyRoom.id, method: 'new_empty_room' };

    return { roomId: null, method: 'none' };
  }

  static async getAvailableRooms(dormitoryId, connection) {
    const [rooms] = await connection.query(
      `SELECT * FROM rooms
       WHERE dormitory_id = ? AND occupied_places < capacity AND is_reservable = 1
       ORDER BY floor ASC, id ASC`,
      [dormitoryId]
    );
    return rooms;
  }

  static isRoomCompatible(room, userGender) {
    if (room.occupied_places >= room.capacity) return false;
    if (room.gender_type === 'male' && userGender !== 'male') return false;
    if (room.gender_type === 'female' && userGender !== 'female') return false;
    if (room.current_gender_occupancy === 'empty') return true;
    return room.current_gender_occupancy === userGender;
  }

  static async hasSimilarStudents(roomId, course, groupId, connection) {
    const [roommates] = await connection.query(
      `SELECT up.course, up.group_id FROM user_profiles up
       JOIN dormitory_passes dp ON up.user_id = dp.user_id
       WHERE dp.room_id = ? AND dp.status = 'active'`,
      [roomId]
    );
    return roommates.some(r => r.course === course || r.group_id === groupId);
  }

  static async finalizeAllocation(application, roomId, adminUserId, allocationMethod, connection) {
    // Update application status to 'settled'
    await connection.execute(
      `UPDATE accommodation_applications SET status = 'settled', updated_at = NOW(), comments = CONCAT(COALESCE(comments, ''), '\nРозподілено в кімнату методом: ${allocationMethod}.') WHERE id = ?`,
      [application.id]
    );

    // Update room occupancy
    const room = await Room.findById(roomId, connection);
    const updatePayload = {
      occupied_places: room.occupied_places + 1,
    };

    if (room.current_gender_occupancy === 'empty' && (room.gender_type === 'any' || room.gender_type === 'mixed')) {
        const userResult = await connection.query('SELECT gender FROM users WHERE id = ?', [application.user_id]);
        const userGender = userResult[0][0].gender;
        if (userGender === 'male' || userGender === 'female') {
            updatePayload.current_gender_occupancy = userGender;
        }
    }

    await Room.update(roomId, updatePayload, connection);

    // Add to room history
    const academicYear = `${new Date(application.start_date).getFullYear()}-${new Date(application.end_date).getFullYear()}`;
    await connection.execute(
      `INSERT INTO room_history (user_id, room_id, academic_year) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE room_id=VALUES(room_id)`,
      [application.user_id, roomId, academicYear]
    );

    // Ensure dormitory pass is created/updated
    await DormitoryPassService.ensurePassForApplication(application.id, adminUserId, roomId, connection);
    
    // Notify the student
    const roomData = await Room.findById(roomId, connection);
    await Notification.create({
        user_id: application.user_id,
        title: "Вас поселено в кімнату!",
        description: `Вітаємо! Вас було успішно поселено в кімнату №${roomData.number} гуртожитку "${roomData.dormitory_name}". Ваша перепустка активована.`
    });
  }
}

export default AllocationService;