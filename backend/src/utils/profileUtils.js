import pool from "../config/db.js";

export const isProfileComplete = async (userId, role) => {
    try {
        const [userRows] = await pool.query(
            `
            SELECT
                u.name, u.isVerified,
                u.faculty_id AS user_table_faculty_id,
                u.dormitory_id AS user_table_dormitory_id,
                up.faculty_id AS profile_faculty_id, 
                up.group_id,
                up.course,
                up.phone
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.id = ?
            `,
            [userId]
        );

        if (!userRows[0]) return false;
        const user = userRows[0];

        // Основні поля, спільні для всіх
        if (!user.name || !user.isVerified || !user.phone) return false;

        switch (role) {
            case "student":
                // Для студента факультет, група і курс беруться з user_profiles
                return !!(user.profile_faculty_id && user.group_id && user.course && user.course >= 1 && user.course <= 6);
            case "dorm_manager":
                // Для коменданта гуртожиток береться з users
                return !!user.user_table_dormitory_id;
            case "faculty_dean_office":
            case "student_council_head":
            case "student_council_member":
                // Для цих ролей факультет береться з users
                return !!user.user_table_faculty_id;
            case "admin":
            case "superadmin":
                return true; 
            default:
                console.warn(`[isProfileComplete] Невідома роль: ${role}`);
                return false;
        }
    } catch (error) {
        console.error("[ProfileUtils] Error in isProfileComplete:", error);
        return false;
    }
};