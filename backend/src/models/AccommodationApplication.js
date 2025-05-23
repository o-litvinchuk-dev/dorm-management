// backend/src/models/AccommodationApplication.js
import pool from "../config/db.js";

class AccommodationApplication {
  static async create(applicationData) {
    const {
      user_id,
      course,
      group_id,
      full_name,
      phone_number,
      dormitory_id,
      faculty_id,
      start_date,
      end_date,
      application_date,
      surname,
      status = "pending",
      preferred_room = null, // Додано значення за замовчуванням
      comments = null, // Додано значення за замовчуванням
    } = applicationData;

    const query = `
      INSERT INTO \`accommodation_applications\`
      (user_id, course, group_id, full_name, phone_number, dormitory_id, faculty_id, start_date, end_date, application_date, surname, status, preferred_room, comments, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    try {
      const [result] = await pool.query(query, [
        user_id,
        course,
        group_id,
        full_name,
        phone_number,
        dormitory_id,
        faculty_id,
        start_date,
        end_date,
        application_date,
        surname,
        status,
        preferred_room,
        comments,
      ]);
      return result.insertId;
    } catch (error) {
      console.error("[AccommodationApplication] Error in create:", {
        message: error.message,
        code: error.code,
      });
      throw new Error(`Failed to create application: ${error.message}`);
    }
  }

  static async findById(id) {
    const query = `
      SELECT
        aa.id, aa.user_id, aa.full_name, aa.surname, aa.course, aa.group_id,
        aa.faculty_id, aa.phone_number, aa.dormitory_id, aa.start_date, aa.end_date,
        aa.application_date, aa.status, aa.preferred_room, aa.comments, aa.created_at, aa.updated_at,
        u.name AS applicant_full_name, u.email AS user_email,
        up.room AS room_number,
        f.name AS faculty_name,
        d.name AS dormitory_name,
        g.name AS group_name
      FROM \`accommodation_applications\` aa
      LEFT JOIN \`users\` u ON aa.user_id = u.id
      LEFT JOIN \`user_profiles\` up ON aa.user_id = up.user_id
      LEFT JOIN \`faculties\` f ON aa.faculty_id = f.id
      LEFT JOIN \`dormitories\` d ON aa.dormitory_id = d.id
      LEFT JOIN \`groups\` g ON aa.group_id = g.id
      WHERE aa.id = ?
    `;
    try {
      const [rows] = await pool.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error("[AccommodationApplication] Error in findById:", {
        message: error.message,
        code: error.code,
      });
      throw new Error(`Failed to find application by ID ${id}: ${error.message}`);
    }
  }

  static async findAll({
    page = 1,
    limit = 10,
    search = "",
    status = "",
    dateFrom = "",
    dateTo = "",
    dormNumber = "", // Це ID гуртожитку, а не номер
    sortBy = "created_at",
    sortOrder = "desc",
    requestingUserRole = "",
    requestingUserFacultyId = null,
    userId = null,
    dormitory_id = null, // Специфічний ID гуртожитку для фільтрації (для ролі dorm_manager)
    managedDormIds = null, // Масив ID гуртожитків для faculty_dean_office
  }) {
    const offset = (page - 1) * limit;

    // Екранування імен стовпців для ORDER BY для запобігання SQL ін'єкцій
    const validSortFields = [
      "id", "full_name", "surname", "course", "group_id", "faculty_id",
      "phone_number", "dormitory_id", "start_date", "end_date",
      "application_date", "status", "created_at", "updated_at",
      "applicant_full_name", "user_email", "faculty_name", "dormitory_name", "group_name"
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "created_at";
    const sortDirection = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Визначення аліасу таблиці для поля сортування
    let sortTableAlias = "aa"; // За замовчуванням для полів з accommodation_applications
    if (["applicant_full_name", "user_email"].includes(sortField)) sortTableAlias = "u";
    else if (["faculty_name"].includes(sortField)) sortTableAlias = "f";
    else if (["dormitory_name"].includes(sortField)) sortTableAlias = "d";
    else if (["group_name"].includes(sortField)) sortTableAlias = "g";


    let query = `
      SELECT
        aa.id, aa.user_id, aa.full_name, aa.surname, aa.course, aa.group_id,
        aa.faculty_id, aa.phone_number, aa.dormitory_id, aa.start_date, aa.end_date,
        aa.application_date, aa.status, aa.preferred_room, aa.comments, aa.created_at, aa.updated_at,
        u.name AS applicant_full_name, u.email AS user_email,
        up.room AS room_number,
        f.name AS faculty_name,
        d.name AS dormitory_name,
        g.name AS group_name
      FROM \`accommodation_applications\` aa
      LEFT JOIN \`users\` u ON aa.user_id = u.id
      LEFT JOIN \`user_profiles\` up ON aa.user_id = up.user_id
      LEFT JOIN \`faculties\` f ON aa.faculty_id = f.id
      LEFT JOIN \`dormitories\` d ON aa.dormitory_id = d.id
      LEFT JOIN \`groups\` g ON aa.group_id = g.id
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as total
      FROM \`accommodation_applications\` aa
      LEFT JOIN \`users\` u ON aa.user_id = u.id
      LEFT JOIN \`faculties\` f ON aa.faculty_id = f.id 
      WHERE 1=1
    `;
    const params = [];
    const countParams = [];

    if (userId) {
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
      if (managedDormIds && Array.isArray(managedDormIds) && managedDormIds.length > 0) {
        query += ` AND aa.dormitory_id IN (${managedDormIds.map(() => "?").join(",")})`;
        countQuery += ` AND aa.dormitory_id IN (${managedDormIds.map(() => "?").join(",")})`;
        params.push(...managedDormIds);
        countParams.push(...managedDormIds);
      }
    } else if (requestingUserRole === "dorm_manager" && dormitory_id) {
      query += ` AND aa.dormitory_id = ?`;
      countQuery += ` AND aa.dormitory_id = ?`;
      params.push(dormitory_id);
      countParams.push(dormitory_id);
    } else if (["student_council_head", "student_council_member"].includes(requestingUserRole) && requestingUserFacultyId) {
      query += ` AND aa.faculty_id = ?`;
      countQuery += ` AND aa.faculty_id = ?`;
      params.push(requestingUserFacultyId);
      countParams.push(requestingUserFacultyId);
    }


    if (status) {
      query += ` AND aa.status = ?`;
      countQuery += ` AND aa.status = ?`;
      params.push(status);
      countParams.push(status);
    }

    // Фільтр по ID гуртожитку (dormNumber тут означає ID)
    if (dormNumber && !["faculty_dean_office"].includes(requestingUserRole)) { // faculty_dean_office вже фільтрує по managedDormIds
      query += ` AND aa.dormitory_id = ?`;
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
      const searchTerm = `%${search}%`;
      query += ` AND (aa.id LIKE ? OR aa.full_name LIKE ? OR aa.surname LIKE ? OR u.email LIKE ? OR f.name LIKE ?)`;
      countQuery += ` AND (aa.id LIKE ? OR aa.full_name LIKE ? OR aa.surname LIKE ? OR u.email LIKE ? OR f.name LIKE ?)`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY ${sortTableAlias}.\`${sortField}\` ${sortDirection}`;
    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    try {
      const [rows] = await pool.query(query, params);
      const [[{ total }]] = await pool.query(countQuery, countParams);
      return {
        applications: rows,
        total,
        page: Number(page),
        limit: Number(limit),
      };
    } catch (error) {
      console.error("[AccommodationApplication] Error in findAll SQL execution:", {
        message: error.message,
        code: error.code,
        query,
        params
      });
      throw new Error(`Failed to fetch applications: ${error.message}`);
    }
  }

  static async updateStatus(id, status) {
    const validStatuses = [
      "pending", "approved", "rejected",
      "approved_by_faculty", "rejected_by_faculty",
      "approved_by_dorm", "rejected_by_dorm", "settled",
    ];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    const query = `
      UPDATE \`accommodation_applications\`
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `;
    try {
      const [result] = await pool.query(query, [status, id]);
      if (result.affectedRows === 0) {
        // Не кидаємо помилку, а повертаємо false або 0, щоб контролер міг обробити це як "не знайдено"
        return 0;
      }
      return result.affectedRows;
    } catch (error) {
      console.error("[AccommodationApplication] Error in updateStatus:", {
        message: error.message,
        code: error.code,
      });
      throw new Error(`Failed to update status for application ${id}: ${error.message}`);
    }
  }

  static async addComment({ application_id, admin_id, comment }) {
    if (!application_id || !admin_id || !comment) {
      throw new Error("Missing required fields: application_id, admin_id, or comment");
    }
    const query = `
      INSERT INTO \`application_comments\` (application_id, admin_id, comment, created_at)
      VALUES (?, ?, ?, NOW())
    `;
    try {
      const [result] = await pool.query(query, [application_id, admin_id, comment]);
      return result.insertId;
    } catch (error) {
      console.error("[AccommodationApplication] Error in addComment:", {
        message: error.message,
        code: error.code,
      });
      throw new Error(`Failed to add comment: ${error.message}`);
    }
  }

  static async findCommentsByApplicationId(applicationId) {
    const query = `
      SELECT
        ac.id, ac.application_id, ac.admin_id, ac.comment, ac.created_at,
        u.name AS admin_name
      FROM \`application_comments\` ac
      LEFT JOIN \`users\` u ON ac.admin_id = u.id
      WHERE ac.application_id = ?
      ORDER BY ac.created_at DESC
    `;
    try {
      const [rows] = await pool.query(query, [applicationId]);
      return rows;
    } catch (error) {
      console.error("[AccommodationApplication] Error in findCommentsByApplicationId:", {
        message: error.message,
        code: error.code,
      });
      throw new Error(`Failed to fetch comments for application ${applicationId}: ${error.message}`);
    }
  }
}

export default AccommodationApplication;