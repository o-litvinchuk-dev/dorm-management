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
      preferred_room = null,
      comments = null,
    } = applicationData;
    const finalPreferredRoom = preferred_room === "" ? null : preferred_room;
    const finalComments = comments === "" ? null : comments;
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
        finalPreferredRoom,
        finalComments,
      ]);
      return result.insertId;
    } catch (error) {
      console.error("[AccommodationApplicationModel] Error in create:", {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
      });
      throw new Error(`Failed to create application: ${error.message}`);
    }
  }

  static async findById(id) {
    const applicationQuery = `
      SELECT
        aa.id, aa.user_id, aa.full_name, aa.surname, aa.course, aa.group_id,
        aa.faculty_id, aa.phone_number, aa.dormitory_id,
        DATE_FORMAT(aa.start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(aa.end_date, '%Y-%m-%d') as end_date,
        DATE_FORMAT(aa.application_date, '%Y-%m-%d') as application_date,
        aa.status,
        aa.preferred_room AS application_preferred_room,
        aa.comments,
        aa.created_at,
        aa.updated_at,
        u.name AS applicant_full_name, u.email AS user_email,
        up.room AS profile_room_number,
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
      const [appRows] = await pool.query(applicationQuery, [id]);
      if (!appRows[0]) {
        return null;
      }
      const application = appRows[0];

      // Визначення поточного академічного року для запиту бронювання
      // Це може потребувати більш складної логіки в залежності від правил вашого бізнесу
      // Наприклад, якщо заявка на 2025-2026, то шукаємо бронювання на цей рік.
      // Якщо заявка має start_date, можна спробувати вивести з нього академічний рік.
      let academicYearForReservationQuery = null;
      if (application.start_date) {
        const startYear = new Date(application.start_date).getFullYear();
        const startMonth = new Date(application.start_date).getMonth();
        // Проста логіка: якщо місяць >= липня, то навчальний рік починається в цьому році.
        // Інакше - в минулому.
        const academicStartYear = startMonth >= 6 ? startYear : startYear - 1;
        if (academicStartYear > 1900) { // Перевірка на валідний рік
            academicYearForReservationQuery = `${academicStartYear}-${academicStartYear + 1}`;
        }
      }
      // Якщо не вдалося визначити з start_date, можна спробувати використати `academic_year` з `application` якщо таке поле існує,
      // або мати якусь глобальну змінну поточного академічного року.
      // Для прикладу, якщо academicYearForReservationQuery залишився null, можна встановити поточний навчальний рік.
      // Наприклад: academicYearForReservationQuery = academicYearForReservationQuery || getCurrentAcademicYear();


      const roomReservationQuery = `
        SELECT
          rr.id,
          r.number as room_number,
          rr.status,
          rr.notes_student,
          rr.academic_year -- Вибираємо academic_year
        FROM room_reservations rr
        JOIN rooms r ON rr.room_id = r.id
        WHERE rr.user_id = ?
          AND r.dormitory_id = ?
          AND rr.status IN ('pending_confirmation', 'confirmed', 'checked_in')
          ${academicYearForReservationQuery ? 'AND rr.academic_year = ?' : ''} 
          /* 
             Якщо academic_year не визначено, ця умова не додається, 
             що може повернути старі активні бронювання. 
             Розгляньте логіку визначення academic_year для фільтрації.
             Альтернатива: видалити умову по академічному року або додати:
             AND rr.academic_year >= SUBSTRING_INDEX(CURRENT_DATE(), '-', 1)
             Для показу бронювань на поточний або майбутні роки.
          */
        ORDER BY rr.created_at DESC
        LIMIT 1
      `;
      const queryParams = [application.user_id, application.dormitory_id];
      if (academicYearForReservationQuery) {
        queryParams.push(academicYearForReservationQuery);
      }

      const [reservationRows] = await pool.query(roomReservationQuery, queryParams);
      application.activeRoomReservation = reservationRows[0] || null;

      let displayRoom = null;
      if (application.activeRoomReservation && application.activeRoomReservation.room_number) {
        displayRoom = application.activeRoomReservation.room_number;
      } else if (application.profile_room_number) {
        displayRoom = application.profile_room_number;
      } else if (application.application_preferred_room) {
        displayRoom = application.application_preferred_room;
      }
      application.display_room_info = displayRoom;
      return application;
    } catch (error) {
      console.error("[AccommodationApplicationModel] Error in findById with reservation logic:", {
        message: error.message,
        code: error.code,
      });
      throw new Error(`Failed to find application by ID ${id} or its reservation: ${error.message}`);
    }
  }

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
    faculty_id_for_filter = null,
    dormitory_id_for_filter = null,
    managedDormIds_for_filter = null,
    userId = null,
    force_no_results = false
  }) {
    if (force_no_results) {
      return { applications: [], total: 0, page: Number(page), limit: Number(limit) };
    }
    const offset = (page - 1) * limit;
    const validSortFields = [
      "id", "full_name", "surname", "course", "group_id", "faculty_id",
      "phone_number", "dormitory_id", "start_date", "end_date",
      "application_date", "status", "created_at", "updated_at",
      "applicant_full_name", "user_email", "faculty_name", "dormitory_name", "group_name"
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "aa.created_at";
    const sortDirection = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    let sortTableAlias = "aa";
    if (["applicant_full_name", "user_email"].includes(sortBy)) sortTableAlias = "u";
    else if (sortBy === "faculty_name") sortTableAlias = "f";
    else if (sortBy === "dormitory_name") sortTableAlias = "d";
    else if (sortBy === "group_name") sortTableAlias = "g";
    const finalSortField = sortBy === "dorm_number" ? "dormitory_id" : sortField;
    let query = `
      SELECT
        aa.id, aa.user_id, aa.full_name, aa.surname, aa.course, aa.group_id,
        aa.faculty_id, aa.phone_number, aa.dormitory_id,
        DATE_FORMAT(aa.start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(aa.end_date, '%Y-%m-%d') as end_date,
        DATE_FORMAT(aa.application_date, '%Y-%m-%d') as application_date,
        aa.status,
        COALESCE(up.room, aa.preferred_room) AS display_room_info,
        aa.comments,
        aa.created_at, aa.updated_at,
        u.name AS applicant_full_name, u.email AS user_email,
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
      SELECT COUNT(aa.id) as total
      FROM \`accommodation_applications\` aa
      LEFT JOIN \`users\` u ON aa.user_id = u.id
      LEFT JOIN \`faculties\` f_count ON aa.faculty_id = f_count.id
      LEFT JOIN \`dormitories\` d_count ON aa.dormitory_id = d_count.id
      LEFT JOIN \`groups\` g_count ON aa.group_id = g_count.id
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
    if (requestingUserRole === "faculty_dean_office" && faculty_id_for_filter) {
      query += ` AND aa.faculty_id = ?`;
      countQuery += ` AND aa.faculty_id = ?`;
      params.push(faculty_id_for_filter);
      countParams.push(faculty_id_for_filter);
      if (dormitory_id_for_filter) {
        query += ` AND aa.dormitory_id = ?`;
        countQuery += ` AND aa.dormitory_id = ?`;
        params.push(dormitory_id_for_filter);
        countParams.push(dormitory_id_for_filter);
      } else if (managedDormIds_for_filter && Array.isArray(managedDormIds_for_filter) && managedDormIds_for_filter.length > 0) {
        query += ` AND aa.dormitory_id IN (${managedDormIds_for_filter.map(() => "?").join(",")})`;
        countQuery += ` AND aa.dormitory_id IN (${managedDormIds_for_filter.map(() => "?").join(",")})`;
        params.push(...managedDormIds_for_filter);
        countParams.push(...managedDormIds_for_filter);
      } else if (!managedDormIds_for_filter || managedDormIds_for_filter.length === 0) {
        // Якщо деканат, але немає керованих гуртожитків (або фільтр по гуртожитку не пройшов),
        // і при цьому не фільтруємо по конкретному гуртожитку, то показуємо лише ті, що стосуються факультету
        // Ця логіка може бути вдосконалена, якщо потрібно показувати заявки факультету НА БУДЬ-ЯКИЙ гуртожиток
      }
    } else if (requestingUserRole === "dorm_manager" && dormitory_id_for_filter) {
      query += ` AND aa.dormitory_id = ?`;
      countQuery += ` AND aa.dormitory_id = ?`;
      params.push(dormitory_id_for_filter);
      countParams.push(dormitory_id_for_filter);
    } else if (["student_council_head", "student_council_member"].includes(requestingUserRole) && faculty_id_for_filter) {
      query += ` AND aa.faculty_id = ?`;
      countQuery += ` AND aa.faculty_id = ?`;
      params.push(faculty_id_for_filter);
      countParams.push(faculty_id_for_filter);
    }
    if (status) {
      query += ` AND aa.status = ?`;
      countQuery += ` AND aa.status = ?`;
      params.push(status);
      countParams.push(status);
    }
    if (dormNumber && ["admin", "superadmin"].includes(requestingUserRole)) {
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
      query += ` AND (CAST(aa.id AS CHAR) LIKE ? OR aa.full_name LIKE ? OR aa.surname LIKE ? OR u.email LIKE ? OR f.name LIKE ? OR d.name LIKE ?)`;
      countQuery += ` AND (CAST(aa.id AS CHAR) LIKE ? OR aa.full_name LIKE ? OR aa.surname LIKE ? OR u.email LIKE ? OR f_count.name LIKE ? OR d_count.name LIKE ?)`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    query += ` ORDER BY ${sortTableAlias === 'aa' && finalSortField === 'dormitory_id' ? 'd.name' : `${sortTableAlias}.${finalSortField}`} ${sortDirection}`;
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
    } catch (dbError) {
      console.error("[AccommodationApplicationModel] Error in findAll SQL execution:", {
        message: dbError.message,
        code: dbError.code,
        query: pool.format(query, params),
        countQuery: pool.format(countQuery, countParams)
      });
      throw new Error(`Failed to fetch applications: ${dbError.message}`);
    }
  }

  static async updateStatus(id, status, room_id = null) {
    const validStatuses = [
      "pending", "approved", "rejected",
      "approved_by_faculty", "rejected_by_faculty",
      "approved_by_dorm", "rejected_by_dorm", "settled",
    ];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    let updateQuery = `UPDATE \`accommodation_applications\` SET status = ?, updated_at = NOW()`;
    const queryParams = [status];
    updateQuery += ` WHERE id = ?`;
    queryParams.push(id);
    try {
      const [result] = await pool.query(updateQuery, queryParams);
      if (result.affectedRows === 0) {
        console.warn(`[AccommodationApplicationModel] Application with id ${id} not found or status not changed.`);
        return 0;
      }
      return result.affectedRows;
    } catch (error) {
      console.error("[AccommodationApplicationModel] Error in updateStatus:", {
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
      console.error("[AccommodationApplicationModel] Error in addComment:", {
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
      console.error("[AccommodationApplicationModel] Error in findCommentsByApplicationId:", {
        message: error.message,
        code: error.code,
      });
      throw new Error(`Failed to fetch comments for application ${applicationId}: ${error.message}`);
    }
  }
}

export default AccommodationApplication;