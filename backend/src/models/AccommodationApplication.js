import pool from "../config/db.js";

class AccommodationApplication {
  static async findAll({
    page = 1,
    limit = 10,
    search = "",
    status = "",
    dateFrom = "",
    dateTo = "",
    dormNumber = "",
    sortBy = "created_at",
    sortOrder = "desc",
    requestingUserRole = "",
    requestingUserDormNumber = null,
  }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        aa.id, aa.user_id, aa.full_name, aa.surname, aa.course, aa.group_name, 
        aa.faculty, aa.phone_number, aa.dorm_number, aa.start_date, aa.end_date, 
        aa.application_date, aa.status, aa.created_at, aa.updated_at,
        u.name AS applicant_full_name, u.email AS user_email,
        up.room AS room_number
      FROM accommodation_applications aa
      LEFT JOIN users u ON aa.user_id = u.id
      LEFT JOIN user_profiles up ON aa.user_id = up.user_id
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as total
      FROM accommodation_applications aa
      LEFT JOIN users u ON aa.user_id = u.id
      LEFT JOIN user_profiles up ON aa.user_id = up.user_id
      WHERE 1=1
    `;
    const params = [];
    const countParams = [];

    // RBAC: Restrict dorm_admin to their dormitory
    if (requestingUserRole === "dorm_admin" && requestingUserDormNumber) {
      query += ` AND aa.dorm_number = ?`;
      countQuery += ` AND aa.dorm_number = ?`;
      params.push(requestingUserDormNumber);
      countParams.push(requestingUserDormNumber);
    }

    // Filters
    if (status) {
      query += ` AND aa.status = ?`;
      countQuery += ` AND aa.status = ?`;
      params.push(status);
      countParams.push(status);
    }
    if (dormNumber && requestingUserRole !== "dorm_admin") {
      query += ` AND aa.dorm_number = ?`;
      countQuery += ` AND aa.dorm_number = ?`;
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
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Sorting
    const validSortFields = [
      "id",
      "full_name",
      "surname",
      "course",
      "group_name",
      "faculty",
      "phone_number",
      "dorm_number",
      "start_date",
      "end_date",
      "application_date",
      "status",
      "created_at",
      "updated_at",
      "user_email",
      "room_number",
    ];
    const validSortOrders = ["asc", "desc"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "created_at";
    const sortDirection = validSortOrders.includes(sortOrder) ? sortOrder : "desc";
    query += ` ORDER BY aa.${sortField} ${sortDirection}`;

    // Pagination
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
        aa.faculty, aa.phone_number, aa.dorm_number, aa.start_date, aa.end_date, 
        aa.application_date, aa.status, aa.created_at, aa.updated_at,
        u.name AS applicant_full_name, u.email AS user_email,
        up.room AS room_number
      FROM accommodation_applications aa
      LEFT JOIN users u ON aa.user_id = u.id
      LEFT JOIN user_profiles up ON aa.user_id = up.user_id
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