import pool from "../config/db.js";

const Room = {
  async create({
    dormitory_id,
    number,
    capacity,
    floor = null,
    gender_type = "any",
    description = null,
    is_reservable = true,
  }) {
    const [result] = await pool.execute(
      `INSERT INTO rooms (dormitory_id, number, capacity, floor, gender_type, description, is_reservable, occupied_places, current_gender_occupancy)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'empty')`,
      [
        dormitory_id,
        number,
        capacity,
        floor,
        gender_type,
        description,
        is_reservable ? 1 : 0,
      ]
    );
    return result.insertId;
  },

  async findAllByDormitoryId(dormitory_id) {
    const [rows] = await pool.execute(
      `SELECT r.id, r.number, r.capacity, r.floor, r.gender_type, r.current_gender_occupancy, r.occupied_places, r.description, r.is_reservable, r.created_at, r.updated_at, d.name as dormitory_name
       FROM rooms r
       JOIN dormitories d ON r.dormitory_id = d.id
       WHERE r.dormitory_id = ?
       ORDER BY CAST(REGEXP_SUBSTR(r.number, '^[0-9]+') AS UNSIGNED), r.number ASC`,
      [dormitory_id]
    );
    return rows;
  },

  async findById(id, connection = pool) {
    const [rows] = await connection.execute(
      `SELECT r.id, r.number, r.capacity, r.floor, r.gender_type, r.current_gender_occupancy, r.occupied_places, r.description, r.is_reservable, r.created_at, r.updated_at, d.name as dormitory_name, r.dormitory_id
       FROM rooms r
       JOIN dormitories d ON r.dormitory_id = d.id
       WHERE r.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async update(id, roomData, connection = pool) {
    const {
      number,
      capacity,
      floor,
      gender_type,
      description,
      is_reservable,
      occupied_places,
      current_gender_occupancy,
    } = roomData;

    const fields = [];
    const values = [];

    if (number !== undefined) {
      fields.push("number = ?");
      values.push(number);
    }
    if (capacity !== undefined) {
      fields.push("capacity = ?");
      values.push(capacity);
    }
    if (floor !== undefined) {
      fields.push("floor = ?");
      values.push(floor);
    }
    if (gender_type !== undefined) {
      fields.push("gender_type = ?");
      values.push(gender_type);
    }
    if (description !== undefined) {
      fields.push("description = ?");
      values.push(description === "" ? null : description);
    }
    if (is_reservable !== undefined) {
      fields.push("is_reservable = ?");
      values.push(is_reservable ? 1 : 0);
    }
    if (occupied_places !== undefined) {
      fields.push("occupied_places = ?");
      values.push(occupied_places);
    }
    if (current_gender_occupancy !== undefined) {
      fields.push("current_gender_occupancy = ?");
      values.push(current_gender_occupancy);
    }

    if (fields.length === 0) return false;

    const query = `UPDATE rooms SET ${fields.join(
      ", "
    )}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    values.push(id);

    const [result] = await connection.execute(query, values);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [reservations] = await connection.query(
        "SELECT COUNT(*) as count FROM room_reservations WHERE room_id = ? AND status NOT IN ('cancelled_by_user', 'rejected_by_admin', 'checked_out', 'expired')",
        [id]
      );
      if (reservations[0].count > 0) {
        throw new Error(
          "Неможливо видалити кімнату, оскільки вона має активні бронювання."
        );
      }

      await connection.execute(`DELETE FROM room_reservations WHERE room_id = ?`, [
        id,
      ]);
      const [result] = await connection.execute(
        `DELETE FROM rooms WHERE id = ?`,
        [id]
      );

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error("[RoomModel] Error deleting room:", error);
      throw error;
    } finally {
      connection.release();
    }
  },

  async getDormitoryForRoom(roomId, connection = pool) {
    const [rows] = await connection.execute(
      `SELECT d.id, d.name
       FROM rooms r
       JOIN dormitories d ON r.dormitory_id = d.id
       WHERE r.id = ?`,
      [roomId]
    );
    return rows[0] || null;
  },
};

export default Room;