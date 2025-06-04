import pool from "../config/db.js";

const User = {
    async create({
        email,
        password,
        role = "student",
        isVerified = false,
        name = null, // Will be null for initial local registration
        avatar = null,
        provider = "local",
        google_id = null,
        token_version = 0,
        faculty_id = null,
        dormitory_id = null,
        gender = "not_specified", // Default gender for initial local registration
    }) {
        const validRoles = [
            "student",
            "admin",
            "superadmin",
            "faculty_dean_office",
            "dorm_manager",
            "student_council_head",
            "student_council_member",
        ];
        if (!validRoles.includes(role)) {
            throw new Error(`Invalid role: ${role}`);
        }

        // Profile is incomplete for new local users, complete for Google sign-ups initially
        const isProfileCompleteValue = provider === 'local' ? 0 : 1;

        const [result] = await pool.execute(
            `INSERT INTO users (email, password, role, isVerified, name, avatar, provider, google_id, token_version, faculty_id, dormitory_id, gender, is_profile_complete)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                email,
                password,
                role,
                isVerified,
                name, // Will be null if not provided (e.g. local registration)
                avatar,
                provider,
                google_id,
                token_version,
                faculty_id,
                dormitory_id,
                gender, // Will be 'not_specified' if not provided
                isProfileCompleteValue,
            ]
        );
        const userId = result.insertId;
        // If name was null (local registration), ensure it's set to null or a placeholder
        // The current logic sets it to userId.toString(), which might not be desired.
        // For a two-step process, it's better to leave it null until profile completion.
        // If User.create is only called from authController.register, and register doesn't pass `name`,
        // then `name` will be null here. The `if (!name)` block below is from original code.
        // For current logic, it should stay null.
        // if (!name) {
        // await pool.execute(`UPDATE users SET name = ? WHERE id = ?`, [
        // userId.toString(), // This would set name to ID if it was null.
        // userId,
        // ]);
        // }
        return await this.findById(userId);
    },

    async updateFacultyId(id, faculty_id) {
        const [result] = await pool.execute(
            `UPDATE users SET faculty_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [faculty_id || null, id]
        );
        return result.affectedRows > 0;
    },

    async updateDormitoryId(id, dormitory_id) {
        const [result] = await pool.execute(
            `UPDATE users SET dormitory_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [dormitory_id || null, id]
        );
        return result.affectedRows > 0;
    },

    async findByFacultyId(faculty_id) {
        const [rows] = await pool.execute(
            `SELECT id, email, role, name, avatar, token_version, faculty_id, dormitory_id, gender, is_profile_complete
            FROM users WHERE faculty_id = ?`,
            [faculty_id]
        );
        return rows;
    },

    async findByEmail(email) {
        try {
            const [rows] = await pool.execute(
                `SELECT id, email, password, role, isVerified, name, avatar, provider, google_id, token_version, faculty_id, dormitory_id, gender, is_profile_complete
                FROM users WHERE email = ?`,
                [email]
            );
            console.log(`[User.findByEmail] Found user for email ${email}:`, rows[0] ? { ...rows[0], password: '***' } : null);
            return rows[0] || null;
        } catch (error) {
            console.error("Помилка пошуку користувача за email:", error);
            throw error;
        }
    },

    async findById(id, connection = pool) {
        const [rows] = await connection.execute(
            `SELECT id, email, password, role, isVerified, name, avatar, provider, google_id, token_version, faculty_id, dormitory_id, gender, is_profile_complete
            FROM users WHERE id = ?`,
            [id]
        );
        console.log(`[User.findById] Found user for ID ${id}:`, rows[0] ? { ...rows[0], password: '***' } : null);
        return rows[0] || null;
    },

    async findByGoogleId(google_id) {
        try {
            const [rows] = await pool.execute(
                `SELECT id, email, role, isVerified, name, avatar, provider, google_id, faculty_id, dormitory_id, gender, is_profile_complete
                FROM users WHERE google_id = ?`,
                [google_id]
            );
            console.log(`[User.findByGoogleId] Found user for Google ID ${google_id}:`, rows[0]);
            return rows[0];
        } catch (error) {
            console.error("Помилка пошуку користувача через Google ID:", error);
            throw error;
        }
    },

    async verifyUser(id) {
        try {
            await pool.execute(
                `UPDATE users SET isVerified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [id]
            );
            return true;
        } catch (error) {
            console.error("Помилка верифікації:", error);
            throw error;
        }
    },

    async updatePassword(id, newPassword) {
        const connection = await pool.getConnection();
        console.log(`[User Model] Початок оновлення пароля для ID: ${id}`);
        try {
            await connection.beginTransaction();
            console.log("[User Model] Транзакція розпочата");
            const [user] = await connection.execute(
                `SELECT id FROM users WHERE id = ?`,
                [id]
            );
            if (user.length === 0) {
                console.error(`[User Model] Користувач ${id} не знайдений`);
                throw new Error("Користувача не знайдено");
            }
            const [result] = await connection.execute(
                `UPDATE users
                SET password = ?, token_version = token_version + 1, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [newPassword, id]
            );
            await connection.commit();
            return result;
        } catch (error) {
            console.error("[User Model] Помилка при оновленні пароля:", error);
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },
    async updateProfileCompletionStatus(id, isComplete) {
        try {
            const [result] = await pool.execute(
                `UPDATE users SET is_profile_complete = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [isComplete ? 1 : 0, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error("[User Model] Помилка оновлення is_profile_complete:", error);
            throw error;
        }
    },

    async incrementTokenVersion(id) {
        await pool.execute(
            `UPDATE users
            SET token_version = token_version + 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [id]
        );
        const [rows] = await pool.execute(
            `SELECT token_version FROM users WHERE id = ?`,
            [id]
        );
        return rows[0].token_version;
    },
};

export default User;