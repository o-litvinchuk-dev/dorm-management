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
    userId = null
  }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT aa.*, u.email, u.name AS full_name
      FROM accommodation_applications aa
      JOIN users u ON aa.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR aa.id = ?)`;
      params.push(`%${search}%`, `%${search}%`, search);
    }
    if (status) {
      query += ` AND aa.status = ?`;
      params.push(status);
    }
    if (dateFrom) {
      query += ` AND aa.created_at >= ?`;
      params.push(dateFrom);
    }
    if (dateTo) {
      query += ` AND aa.created_at <= ?`;
      params.push(dateTo);
    }
    if (dormNumber) {
      query += ` AND aa.dorm_number = ?`;
      params.push(dormNumber);
    }
    if (userId) {
      query += ` AND aa.user_id = ?`;
      params.push(userId);
    }

    query += ` ORDER BY aa.${sortBy} ${sortOrder.toUpperCase()}`;
    if (limit > 0) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
    }

    const [rows] = await pool.execute(query, params);
    const [totalRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM accommodation_applications aa 
       JOIN users u ON aa.user_id = u.id 
       WHERE 1=1 ${search ? 'AND (u.name LIKE ? OR u.email LIKE ? OR aa.id = ?)' : ''} 
       ${status ? 'AND aa.status = ?' : ''} 
       ${dateFrom ? 'AND aa.created_at >= ?' : ''} 
       ${dateTo ? 'AND aa.created_at <= ?' : ''} 
       ${dormNumber ? 'AND aa.dorm_number = ?' : ''} 
       ${userId ? 'AND aa.user_id = ?' : ''}`,
      params.slice(0, params.length - (limit > 0 ? 2 : 0))
    );

    return {
      applications: rows,
      total: totalRows[0].total,
      page,
      limit
    };
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT aa.*, u.email, u.name AS full_name
       FROM accommodation_applications aa
       JOIN users u ON aa.user_id = u.id
       WHERE aa.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async updateStatus(id, status) {
    const [result] = await pool.execute(
      `UPDATE accommodation_applications SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );
    return result.affectedRows > 0;
  }

  static async addComment({ application_id, admin_id, comment }) {
    const [result] = await pool.execute(
      `INSERT INTO application_comments (application_id, admin_id, comment, created_at)
       VALUES (?, ?, ?, NOW())`,
      [application_id, admin_id, comment]
    );
    return result.insertId;
  }

  static async findCommentsByApplicationId(applicationId) {
    const [rows] = await pool.execute(
      `SELECT ac.*, u.name AS admin_name
       FROM application_comments ac
       JOIN users u ON ac.admin_id = u.id
       WHERE ac.application_id = ?
       ORDER BY ac.created_at DESC`,
      [applicationId]
    );
    return rows;
  }
}

export default AccommodationApplication;