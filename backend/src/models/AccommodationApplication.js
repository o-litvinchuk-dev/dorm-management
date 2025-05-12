import pool from "../config/db.js";

class AccommodationApplication {
  static async create(applicationData) {
    const {
      user_id,
      course,
      group_name,
      full_name,
      phone_number,
      dormitory_id, // переконайся, що це ID, а не номер
      faculty_id,   // переконайся, що це ID
      start_date,
      end_date,
      application_date,
      surname,
      status = 'pending' // статус за замовчуванням
    } = applicationData;

    const query = `
      INSERT INTO accommodation_applications 
      (user_id, course, group_name, full_name, phone_number, dormitory_id, faculty_id, start_date, end_date, application_date, surname, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    try {
      const [result] = await pool.query(query, [
        user_id,
        course,
        group_name,
        full_name,
        phone_number,
        dormitory_id,
        faculty_id,
        start_date,
        end_date,
        application_date,
        surname,
        status
      ]);
      return result.insertId;
    } catch (error) {
      console.error("[AccommodationApplication] Error in create:", error);
      throw error;
    }
  }

  static async findAll({
    page = 1,
    limit = 10,
    search = "",
    status = "",
    dateFrom = "",
    dateTo = "",
    dormNumber = "", // Це може бути ID гуртожитку або його номер, залежно від логіки
    sortBy = "created_at",
    sortOrder = "desc",
    requestingUserRole = "",
    requestingUserFacultyId = null,
    // Додамо userId для фільтрації "моїх заявок"
    userId = null
  }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT
        aa.id, aa.user_id, aa.full_name, aa.surname, aa.course, aa.group_name,
        aa.faculty_id, aa.phone_number, aa.dormitory_id, aa.start_date, aa.end_date,
        aa.application_date, aa.status, aa.created_at, aa.updated_at,
        u.name AS applicant_full_name, u.email AS user_email,
        up.room AS room_number, /* Змінено з user_profiles.room */
        f.name AS faculty_name,
        d.name AS dormitory_name /* Змінено з dormitories.name */
      FROM accommodation_applications aa
      LEFT JOIN users u ON aa.user_id = u.id
      LEFT JOIN user_profiles up ON aa.user_id = up.user_id
      LEFT JOIN faculties f ON aa.faculty_id = f.id
      LEFT JOIN dormitories d ON aa.dormitory_id = d.id /* Додано JOIN для dormitories */
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as total
      FROM accommodation_applications aa
      LEFT JOIN users u ON aa.user_id = u.id
      LEFT JOIN user_profiles up ON aa.user_id = up.user_id
      LEFT JOIN faculties f ON aa.faculty_id = f.id /* Додано JOIN для faculties в countQuery */
      LEFT JOIN dormitories d ON aa.dormitory_id = d.id /* Додано JOIN для dormitories в countQuery */
      WHERE 1=1
    `;

    const params = [];
    const countParams = [];

    if (userId) { // Для фільтрації заявок конкретного користувача
        query += ` AND aa.user_id = ?`;
        countQuery += ` AND aa.user_id = ?`;
        params.push(userId);
        countParams.push(userId);
    }


    if (requestingUserRole === "faculty_dean_office" && requestingUserFacultyId) {
      query += ` AND aa.faculty_id = ?`;
      countQuery += ` AND aa.faculty_id = ?`;
      params.push(requestingUserFacultyId);
      countParams.push(requestingUserFacultyId);
      query += ` AND aa.dormitory_id IN (
        SELECT dormitory_id FROM faculty_dormitories WHERE faculty_id = ?
      )`;
      countQuery += ` AND aa.dormitory_id IN (
        SELECT dormitory_id FROM faculty_dormitories WHERE faculty_id = ?
      )`;
      params.push(requestingUserFacultyId);
      countParams.push(requestingUserFacultyId);
    }

    if (status) {
      query += ` AND aa.status = ?`;
      countQuery += ` AND aa.status = ?`;
      params.push(status);
      countParams.push(status);
    }

    // Якщо dormNumber передається як ID, то використовуємо його
    if (dormNumber && requestingUserRole !== "faculty_dean_office") {
        query += ` AND aa.dormitory_id = ?`; // Припускаємо, що dormNumber - це ID
        countQuery += ` AND aa.dormitory_id = ?`;
        params.push(dormNumber);
        countParams.push(dormNumber);
    }


    if (dateFrom) {
      query += ` AND aa.application_date >= ?`;
      countQuery += ` AND aa.application_date >= ?`;
      params.push(dateFrom);
      countParams.push(dateFrom);
    }
    if (dateTo) {
      query += ` AND aa.application_date <= ?`;
      countQuery += ` AND aa.application_date <= ?`;
      params.push(dateTo);
      countParams.push(dateTo);
    }

    if (search) {
      query += ` AND (aa.id LIKE ? OR aa.full_name LIKE ? OR aa.surname LIKE ? OR u.email LIKE ?)`;
      countQuery += ` AND (aa.id LIKE ? OR aa.full_name LIKE ? OR aa.surname LIKE ? OR u.email LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
      countParams.push(s, s, s, s);
    }

    const validSortFields = [
      "id", "full_name", "surname", "course", "group_name", "faculty_id",
      "phone_number", "dormitory_id", "start_date", "end_date",
      "application_date", "status", "created_at", "updated_at",
      "user_email", "room_number"
    ];
    const validSortOrders = ["asc", "desc"];

    const sortField = validSortFields.includes(sortBy) ? sortBy : "created_at";
    const sortDirection = validSortOrders.includes(sortOrder) ? sortOrder : "desc";

    query += ` ORDER BY aa.${sortField} ${sortDirection}`;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    try {
      const [rows] = await pool.query(query, params);
      const [[{ total }]] = await pool.query(countQuery, countParams);
      return {
        applications: rows,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error("[AccommodationApplication] Error in findAll:", error);
      throw error;
    }
  }

  static async findById(id) {
    const query = `
      SELECT
        aa.id, aa.user_id, aa.full_name, aa.surname, aa.course, aa.group_name,
        aa.faculty_id, aa.phone_number, aa.dormitory_id, aa.start_date, aa.end_date,
        aa.application_date, aa.status, aa.created_at, aa.updated_at,
        u.name AS applicant_full_name, u.email AS user_email,
        up.room AS room_number, /* Змінено з user_profiles.room */
        f.name AS faculty_name,
        d.name AS dormitory_name /* Змінено з dormitories.name */
      FROM accommodation_applications aa
      LEFT JOIN users u ON aa.user_id = u.id
      LEFT JOIN user_profiles up ON aa.user_id = up.user_id
      LEFT JOIN faculties f ON aa.faculty_id = f.id
      LEFT JOIN dormitories d ON aa.dormitory_id = d.id /* Додано JOIN для dormitories */
      WHERE aa.id = ?
    `;
    try {
      const [rows] = await pool.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error("[AccommodationApplication] Error in findById:", error);
      throw error;
    }
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE accommodation_applications
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `;
    try {
      const [result] = await pool.query(query, [status, id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("[AccommodationApplication] Error in updateStatus:", error);
      throw error;
    }
  }

  static async addComment({ application_id, admin_id, comment }) {
    const query = `
      INSERT INTO application_comments (application_id, admin_id, comment, created_at)
      VALUES (?, ?, ?, NOW())
    `;
    try {
      const [result] = await pool.query(query, [application_id, admin_id, comment]);
      return result.insertId;
    } catch (error) {
      console.error("[AccommodationApplication] Error in addComment:", error);
      throw error;
    }
  }

  static async findCommentsByApplicationId(applicationId) {
    const query = `
      SELECT
        ac.id, ac.application_id, ac.admin_id, ac.comment, ac.created_at,
        u.name AS admin_name
      FROM application_comments ac
      LEFT JOIN users u ON ac.admin_id = u.id
      WHERE ac.application_id = ?
      ORDER BY ac.created_at DESC
    `;
    try {
      const [rows] = await pool.query(query, [applicationId]);
      return rows;
    } catch (error) {
      console.error("[AccommodationApplication] Error in findCommentsByApplicationId:", error);
      throw error;
    }
  }
}

export default AccommodationApplication;