import pool from "../config/db.js";

class RoomReservation {
  static async create(
    {
      room_id,
      user_id,
      academic_year, // Додано academic_year
      status = "pending_confirmation",
      notes_student = null,
      accommodation_application_id = null,
    },
    connection = pool
  ) {
    const query = `
      INSERT INTO room_reservations
      (room_id, user_id, academic_year, status, notes_student, accommodation_application_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    try {
      const [result] = await connection.execute(query, [
        room_id,
        user_id,
        academic_year, // Використовуємо academic_year
        status,
        notes_student,
        accommodation_application_id,
      ]);
      return result.insertId;
    } catch (error) {
      console.error("[RoomReservationModel] Error in create:", error);
      throw error;
    }
  }

  static async findById(id, connection = pool) {
    const query = `
      SELECT rr.id, rr.room_id, rr.user_id, rr.academic_year, rr.status, rr.notes_student, rr.notes_admin, rr.admin_id, rr.created_at, rr.updated_at, rr.accommodation_application_id, 
             r.number as room_number, r.dormitory_id, d.name as dormitory_name,
             u.email as user_email, u.name as user_name, u.gender as user_gender
      FROM room_reservations rr
      JOIN rooms r ON rr.room_id = r.id
      JOIN dormitories d ON r.dormitory_id = d.id
      JOIN users u ON rr.user_id = u.id
      WHERE rr.id = ?
    `;
    const [rows] = await connection.execute(query, [id]);
    return rows[0] || null;
  }

  static async findByUserId(user_id, connection = pool) {
    const query = `
      SELECT rr.id, rr.room_id, rr.user_id, rr.academic_year, rr.status, rr.notes_student, rr.notes_admin, rr.admin_id, rr.created_at, rr.updated_at, rr.accommodation_application_id, 
             r.number as room_number, d.name as dormitory_name
      FROM room_reservations rr
      JOIN rooms r ON rr.room_id = r.id
      JOIN dormitories d ON r.dormitory_id = d.id
      WHERE rr.user_id = ?
      ORDER BY rr.created_at DESC
    `;
    const [rows] = await connection.execute(query, [user_id]);
    return rows;
  }

  static async findAllAdmin(
    {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      dormitory_id = null,
      sortBy = "created_at",
      sortOrder = "desc",
    },
    connection = pool
  ) {
    const offset = (page - 1) * limit;
    let baseQuery = `
      SELECT rr.id, rr.room_id, rr.user_id, rr.academic_year, rr.status, rr.notes_student, rr.notes_admin, rr.admin_id, rr.created_at, rr.updated_at, rr.accommodation_application_id,
             r.number as room_number, d.name as dormitory_name, r.dormitory_id as room_dormitory_id,
             u.email as user_email, u.name as user_name
      FROM room_reservations rr
      JOIN rooms r ON rr.room_id = r.id
      JOIN dormitories d ON r.dormitory_id = d.id
      JOIN users u ON rr.user_id = u.id
    `;
    let countBaseQuery = `
      SELECT COUNT(rr.id) as total
      FROM room_reservations rr
      JOIN rooms r ON rr.room_id = r.id
      JOIN dormitories d ON r.dormitory_id = d.id
      JOIN users u ON rr.user_id = u.id
    `;
    const whereClauses = [];
    const params = [];
    if (search) {
      whereClauses.push(
        `(u.name LIKE ? OR u.email LIKE ? OR r.number LIKE ? OR CAST(rr.id AS CHAR) LIKE ? OR rr.academic_year LIKE ?)`
      );
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    if (status) {
      whereClauses.push(`rr.status = ?`);
      params.push(status);
    }
    if (dormitory_id) {
      whereClauses.push(`d.id = ?`);
      params.push(dormitory_id);
    }
    if (whereClauses.length > 0) {
      const whereString = ` WHERE ${whereClauses.join(" AND ")}`;
      baseQuery += whereString;
      countBaseQuery += whereString;
    }
    const validSortFields = {
      id: "rr.id",
      user_name: "u.name",
      room_number: "r.number",
      academic_year: "rr.academic_year", // Оновлено поле для сортування
      status: "rr.status",
      created_at: "rr.created_at",
    };
    let safeSortBy = validSortFields[sortBy] || "rr.created_at";
    baseQuery += ` ORDER BY ${safeSortBy} ${
      sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC"
    } LIMIT ? OFFSET ?`;
    const queryParams = [...params, Number(limit), Number(offset)];
    const [rows] = await connection.query(baseQuery, queryParams);
    const [[{ total }]] = await connection.query(countBaseQuery, params);
    return {
      reservations: rows,
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  static async updateStatus(
    id,
    status,
    connection = pool,
    admin_id = null,
    notes_admin = null
  ) {
    const validStatuses = [
      "pending_confirmation",
      "confirmed",
      "cancelled_by_user",
      "rejected_by_admin",
      "checked_in",
      "checked_out",
      "expired",
    ];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid reservation status: ${status}`);
    }
    let query = `UPDATE room_reservations SET status = ?, updated_at = NOW()`;
    const params = [status];
    if (admin_id !== null) {
      query += `, admin_id = ?`;
      params.push(admin_id);
    }
    if (notes_admin !== null) {
      query += `, notes_admin = ?`;
      params.push(notes_admin === "" ? null : notes_admin);
    }
    query += ` WHERE id = ?`;
    params.push(id);
    const [result] = await connection.execute(query, params);
    return result.affectedRows > 0;
  }
}

export default RoomReservation;