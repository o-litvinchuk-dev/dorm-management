import pool from "../config/db.js";

class Event {
    static async create({
        title,
        description,
        start_time,
        end_time,
        location,
        color_tag,
        category,
        created_by_user_id,
        targets = []
    }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const eventQuery = `
            INSERT INTO events (title, description, start_time, end_time, location, color_tag, category, created_by_user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [eventResult] = await connection.execute(eventQuery, [
                title,
                description || null,
                start_time,
                end_time || null,
                location || null,
                color_tag || '#3b82f6',
                category || null,
                created_by_user_id || null,
            ]);
            const eventId = eventResult.insertId;

            if (targets && targets.length > 0) {
                const validTargets = targets.filter(t => t.target_type);
                if (validTargets.length > 0) {
                    const targetValues = validTargets.map(target => [
                        eventId,
                        target.target_type,
                        (target.target_type === 'all_settled' || !target.target_id || target.target_id === "") ? null : Number(target.target_id)
                    ]);
                    const targetsQuery = `
                    INSERT INTO event_targets (event_id, target_type, target_id) VALUES ?
                    `;
                    await connection.query(targetsQuery, [targetValues]);
                }
            }
            await connection.commit();
            return eventId;
        } catch (error) {
            await connection.rollback();
            console.error("[EventModel] Error creating event:", error);
            throw error;
        } finally {
            connection.release();
        }
    }

    static async findById(id) {
        const query = `
        SELECT
            e.id, e.title, e.description, e.start_time, e.end_time, e.location, e.color_tag, e.category, e.created_by_user_id, e.created_at, e.updated_at,
            u_creator.name as creator_name,
            (SELECT JSON_ARRAYAGG(JSON_OBJECT('target_type', et.target_type, 'target_id', et.target_id))
             FROM event_targets et
             WHERE et.event_id = e.id) as targets_json_array
        FROM events e
        LEFT JOIN users u_creator ON e.created_by_user_id = u_creator.id
        WHERE e.id = ?
        `;
        const [rows] = await pool.execute(query, [id]);
        if (rows[0]) {
            const row = rows[0];
            try {
                row.targets = row.targets_json_array ? JSON.parse(row.targets_json_array).filter(t => t !== null && t.target_type !== null) : [];
            } catch (e) {
                console.error("Error parsing targets_json_array for event ID " + row.id + ":", e, "JSON was:", row.targets_json_array);
                row.targets = [];
            }
            delete row.targets_json_array;
            return row;
        }
        return null;
    }

    static async findAllForUser(userId, userRole, userDormitoryId, userFacultyId, userGroupId, userCourse, filters = {}) {
        let query = `
        SELECT DISTINCT e.id, e.title, e.description, e.start_time, e.end_time, e.location, e.color_tag, e.category, e.created_by_user_id, e.created_at, e.updated_at,
            u_creator.name as creator_name,
            (SELECT JSON_ARRAYAGG(JSON_OBJECT('target_type', et_detail.target_type, 'target_id', et_detail.target_id))
             FROM event_targets et_detail
             WHERE et_detail.event_id = e.id
            ) as targets_json_array
        FROM events e
        LEFT JOIN event_targets et ON e.id = et.event_id
        LEFT JOIN users u_creator ON e.created_by_user_id = u_creator.id
        WHERE 1=1
        `;
        const params = [];
        let targetConditions = ["(et.target_type = 'all_settled')"];

        if (userDormitoryId) {
            targetConditions.push("(et.target_type = 'dormitory' AND et.target_id = ?)");
            params.push(userDormitoryId);
        }
        if (userFacultyId) {
            targetConditions.push("(et.target_type = 'faculty' AND et.target_id = ?)");
            params.push(userFacultyId);
        }
        if (userCourse) {
            targetConditions.push("(et.target_type = 'course' AND et.target_id = ?)");
            params.push(userCourse);
        }
        if (userGroupId) {
            targetConditions.push("(et.target_type = 'group' AND et.target_id = ?)");
            params.push(userGroupId);
        }
        if (userId) { // Show events created by the user
            targetConditions.push("e.created_by_user_id = ?");
            params.push(userId);
        }


        if (targetConditions.length > 0) {
            query += ` AND (${targetConditions.join(' OR ')})`;
        }

        if (filters.category) {
            query += ` AND e.category LIKE ?`;
            params.push(`%${filters.category}%`);
        }
        if (filters.dateFrom) {
            query += ` AND DATE(e.start_time) >= ?`;
            params.push(filters.dateFrom);
        }
        if (filters.dateTo) {
            query += ` AND DATE(e.start_time) <= ?`;
            params.push(filters.dateTo);
        }

        query += ` ORDER BY e.start_time DESC`;

        const [rows] = await pool.execute(query, params);
        return rows.map(row => {
            let targets = [];
            if (row.targets_json_array) {
                try {
                    targets = JSON.parse(row.targets_json_array).filter(t => t !== null && t.target_type !== null);
                } catch (e) {
                    console.error("Error parsing targets_json_array for event ID " + row.id + ":", e);
                }
            }
            return { ...row, targets, targets_json_array: undefined };
        });
    }

    static async findAllAdmin(filters = {}) {
        let querySelect = `
        SELECT
            e.id, e.title, e.description, e.start_time, e.end_time, e.location, e.color_tag, e.category, e.created_by_user_id, e.created_at, e.updated_at,
            u_creator.name as creator_name,
            (SELECT GROUP_CONCAT(DISTINCT d.name SEPARATOR ', ') FROM event_targets et_d JOIN dormitories d ON et_d.target_id = d.id WHERE et_d.event_id = e.id AND et_d.target_type = 'dormitory') as target_dormitories_names,
            (SELECT GROUP_CONCAT(DISTINCT f.name SEPARATOR ', ') FROM event_targets et_f JOIN faculties f ON et_f.target_id = f.id WHERE et_f.event_id = e.id AND et_f.target_type = 'faculty') as target_faculties_names,
            (SELECT GROUP_CONCAT(DISTINCT CAST(et_c.target_id AS CHAR) SEPARATOR ', ') FROM event_targets et_c WHERE et_c.event_id = e.id AND et_c.target_type = 'course') as target_courses,
            (SELECT GROUP_CONCAT(DISTINCT g.name SEPARATOR ', ') FROM event_targets et_g JOIN \`groups\` g ON et_g.target_id = g.id WHERE et_g.event_id = e.id AND et_g.target_type = 'group') as target_groups_names,
            (SELECT JSON_ARRAYAGG(JSON_OBJECT('target_type', et.target_type, 'target_id', et.target_id))
             FROM event_targets et
             WHERE et.event_id = e.id
            ) as targets_json_array
        `;
        let queryFrom = `
        FROM events e
        LEFT JOIN users u_creator ON e.created_by_user_id = u_creator.id
        `;
        let queryWhere = " WHERE 1=1 ";
        const paramsForWhere = []; // Parameters for the WHERE clause

        if (filters.title) {
            queryWhere += ` AND e.title LIKE ?`;
            paramsForWhere.push(`%${filters.title}%`);
        }
        if (filters.category) {
            queryWhere += ` AND e.category LIKE ?`;
            paramsForWhere.push(`%${filters.category}%`);
        }
        if (filters.dateFrom) {
            queryWhere += ` AND DATE(e.start_time) >= ?`;
            paramsForWhere.push(filters.dateFrom);
        }
        if (filters.dateTo) {
            queryWhere += ` AND DATE(e.start_time) <= ?`;
            paramsForWhere.push(filters.dateTo);
        }
        if (filters.target_type_filter) {
            if (!queryFrom.includes("et_filter_main")) { // Add join only if not already present
                queryFrom += ` JOIN event_targets et_filter_main ON et_filter_main.event_id = e.id `;
            }
            queryWhere += ` AND et_filter_main.target_type = ?`;
            paramsForWhere.push(filters.target_type_filter);
            if (filters.target_id_filter && filters.target_type_filter !== 'all_settled') {
                queryWhere += ` AND et_filter_main.target_id = ?`;
                paramsForWhere.push(filters.target_id_filter);
            }
        }

        const countTotalQuery = `SELECT COUNT(DISTINCT e.id) as total ${queryFrom} ${queryWhere}`;
        const [totalResult] = await pool.execute(countTotalQuery, paramsForWhere);
        const total = totalResult[0].total;

        let fullQuery = querySelect + queryFrom + queryWhere;
        fullQuery += ` ORDER BY e.${filters.sortBy || 'start_time'} ${filters.sortOrder || 'DESC'}`;
        
        const paramsForExecute = [...paramsForWhere];

        if (filters.page && filters.limit) {
            const numericLimit = Number(filters.limit);
            const numericOffset = (Number(filters.page) - 1) * numericLimit;
            fullQuery += ` LIMIT ${numericLimit} OFFSET ${numericOffset}`;
            // LIMIT and OFFSET are interpolated, not added to paramsForExecute
        }

        const [rows] = await pool.execute(fullQuery, paramsForExecute);

        const processedRows = rows.map(row => {
            let targets = [];
            if (row.targets_json_array) {
                try {
                    targets = JSON.parse(row.targets_json_array).filter(t => t !== null && t.target_type !== null);
                } catch (e) {
                    console.error("Error parsing targets_json_array for event ID " + row.id + ":", e);
                }
            }
            const baseEventFields = ['id', 'title', 'description', 'start_time', 'end_time', 'location', 'color_tag', 'category', 'created_by_user_id', 'created_at', 'updated_at'];
            const eventData = {};
            baseEventFields.forEach(field => {
                eventData[field] = row[field] !== undefined ? row[field] : null;
            });
            return {
                ...eventData,
                creator_name: row.creator_name,
                target_dormitories_names: row.target_dormitories_names,
                target_faculties_names: row.target_faculties_names,
                target_courses: row.target_courses,
                target_groups_names: row.target_groups_names,
                targets,
            };
        });
        return { events: processedRows, total };
    }

    static async update(id, { title, description, start_time, end_time, location, color_tag, category, targets = [] }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const eventQuery = `
            UPDATE events SET
                title = ?, description = ?, start_time = ?, end_time = ?,
                location = ?, color_tag = ?, category = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `;
            const [updateResult] = await connection.execute(eventQuery, [
                title,
                description || null,
                start_time,
                end_time || null,
                location || null,
                color_tag || '#3b82f6',
                category || null,
                id
            ]);

            // Clear existing targets
            await connection.execute('DELETE FROM event_targets WHERE event_id = ?', [id]);

            // Add new targets
            if (targets && targets.length > 0) {
                const validTargets = targets.filter(t => t.target_type);
                if (validTargets.length > 0) {
                    const targetValues = validTargets.map(target => [
                        id,
                        target.target_type,
                        (target.target_type === 'all_settled' || !target.target_id || target.target_id === "") ? null : Number(target.target_id)
                    ]);
                    const targetsQuery = `
                    INSERT INTO event_targets (event_id, target_type, target_id) VALUES ?
                    `;
                    await connection.query(targetsQuery, [targetValues]);
                }
            }
            await connection.commit();
            return updateResult.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            console.error(`[EventModel] Error updating event ${id}:`, error);
            throw error;
        } finally {
            connection.release();
        }
    }

    static async delete(id) {
        // Note: Deletion of event_targets is handled by ON DELETE CASCADE in the database schema
        const query = "DELETE FROM events WHERE id = ?";
        const [result] = await pool.execute(query, [id]);
        return result.affectedRows > 0;
    }
}

export default Event;