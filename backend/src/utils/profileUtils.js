import pool from "../config/db.js";

export const isProfileComplete = async (userId, role) => {
  try {
    const [userRows] = await pool.query(
      `
      SELECT 
        u.name, u.isVerified, u.gender,
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

    // Common checks for all roles (except maybe superadmin/admin if they have different rules)
    if (!user.name || !user.isVerified || !user.phone) return false;
    if (user.gender === 'not_specified' || user.gender === 'other' || !user.gender) {
        // For students, gender is crucial for room assignment. For others, it might be less critical but still part of a "complete" profile.
        if (role === 'student') return false;
    }


    switch (role) {
      case "student":
        return !!(
          user.profile_faculty_id &&
          user.group_id &&
          user.course &&
          user.course >= 1 &&
          user.course <= 6 &&
          user.gender && user.gender !== 'not_specified' && user.gender !== 'other'
        );
      case "dorm_manager":
        return !!user.user_table_dormitory_id;
      case "faculty_dean_office":
      case "student_council_head":
      case "student_council_member":
        return !!user.user_table_faculty_id;
      case "admin":
      case "superadmin":
        return true; // Admins/Superadmins might not need faculty/dormitory assigned to their user record
      default:
        console.warn(`[isProfileComplete] Невідома роль: ${role}`);
        return false;
    }
  } catch (error) {
    console.error("[ProfileUtils] Error in isProfileComplete:", error);
    return false;
  }
};