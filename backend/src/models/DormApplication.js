import pool from "../config/db.js";

const DormApplication = {
  async create(data) {
    const { user_id, name, surname, faculty, course } = data;
    // Use execute for INSERT as it's safer against SQL injection for data values
    const [result] = await pool.execute(
      `INSERT INTO dorm_applications (user_id, name, surname, faculty, course) VALUES (?, ?, ?, ?, ?)`,
      [user_id, name, surname, faculty, course]
    );
    return result.insertId;
  },

  async findAll({
    page = 1,
    limit = 10,
    search = "",
    faculty = "",
    course = "",
    dateFrom = "",
    dateTo = "",
    sortBy = "created_at",
    sortOrder = "desc",
  }) {
    // Ensure page and limit are numbers
    const numericPage = Number(page);
    const numericLimit = Number(limit);
    const offset = (numericPage - 1) * numericLimit;

    let query = `
      SELECT da.*, u.email
      FROM dorm_applications da
      JOIN users u ON da.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Фільтрація за пошуком (name, surname, email)
    if (search) {
      query += ` AND (da.name LIKE ? OR da.surname LIKE ? OR u.email LIKE ? OR da.id = ?)`;
      // Use pool.escape to safely handle user input for LIKE clauses when using pool.query
      params.push(`%${pool.escape(search).slice(1, -1)}%`, `%${pool.escape(search).slice(1, -1)}%`, `%${pool.escape(search).slice(1, -1)}%`, search);
    }

    // Фільтрація за факультетом
    if (faculty) {
      query += ` AND da.faculty LIKE ?`;
      params.push(`%${pool.escape(faculty).slice(1, -1)}%`);
    }

    // Фільтрація за курсом
    if (course) {
      query += ` AND da.course = ?`;
      params.push(course); // Course is validated as a number by Joi, should be safe
    }

    // Фільтрація за датою створення
    if (dateFrom) {
      query += ` AND da.created_at >= ?`;
      params.push(dateFrom); // Date is validated by Joi, should be safe
    }
    if (dateTo) {
      query += ` AND da.created_at <= ?`;
      params.push(dateTo); // Date is validated by Joi, should be safe
    }

    // Сортування - Whitelist sortBy and sortOrder to prevent injection
    const allowedSortBy = ['id', 'name', 'surname', 'faculty', 'course', 'created_at'];
    const allowedSortOrder = ['asc', 'desc'];
    const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = allowedSortOrder.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';
    query += ` ORDER BY da.${safeSortBy} ${safeSortOrder}`;

    // Пагінація - Directly inject numbers as they are validated
    if (numericLimit > 0) {
      // Directly inject validated numbers into the query string for LIMIT/OFFSET
      query += ` LIMIT ${numericLimit} OFFSET ${offset}`;
      // Do NOT add limit/offset to params array for pool.query
    }

    let rows;
    try {
        console.log("[DormApplication.findAll] Executing main query with pool.query:", query);
        console.log("[DormApplication.findAll] Main params for pool.query (filters only):", params);
        // Use pool.query instead of pool.execute
        [rows] = await pool.query(query, params);
    } catch (dbError) {
        console.error("[DormApplication.findAll] Error executing main query:", dbError);
        throw new Error("Помилка бази даних при отриманні заявок");
    }

    // Запит для підрахунку загальної кількості записів
    const countQueryBase = `
      SELECT COUNT(*) as total
      FROM dorm_applications da
      JOIN users u ON da.user_id = u.id
      WHERE 1=1`;
    let countQueryWhere = "";
    const countParams = []; // Initialize empty array for count parameters

    if (search) {
        countQueryWhere += ` AND (da.name LIKE ? OR da.surname LIKE ? OR u.email LIKE ? OR da.id = ?)`;
        countParams.push(`%${pool.escape(search).slice(1, -1)}%`, `%${pool.escape(search).slice(1, -1)}%`, `%${pool.escape(search).slice(1, -1)}%`, search);
    }
    if (faculty) {
        countQueryWhere += ` AND da.faculty LIKE ?`;
        countParams.push(`%${pool.escape(faculty).slice(1, -1)}%`);
    }
    if (course) {
        countQueryWhere += ` AND da.course = ?`;
        countParams.push(course);
    }
    if (dateFrom) {
        countQueryWhere += ` AND da.created_at >= ?`;
        countParams.push(dateFrom);
    }
    if (dateTo) {
        countQueryWhere += ` AND da.created_at <= ?`;
        countParams.push(dateTo);
    }

    const countQuery = countQueryBase + countQueryWhere;
    let totalRows;
    try {
        console.log("[DormApplication.findAll] Executing count query with pool.query:", countQuery);
        console.log("[DormApplication.findAll] Count params for pool.query:", countParams);
        // Use pool.query instead of pool.execute
        [totalRows] = await pool.query(countQuery, countParams);
    } catch (dbError) {
        console.error("[DormApplication.findAll] Error executing count query:", dbError);
        throw new Error("Помилка бази даних при підрахунку заявок");
    }

    return {
      applications: rows,
      total: totalRows[0].total,
      page: numericPage, // Return the validated page number
      limit: numericLimit // Return the validated limit number
    };
  }
};

export default DormApplication;