import pool from "../config/db.js";

// Helper function to fetch public profile data
const getPublicProfileInternal = async (userId) => {
    const [userRows] = await pool.query(
        `
        SELECT
            u.id, u.name, u.avatar, u.role, u.gender,
            up.about_me, up.interests, up.room,
            up.dormitory, up.instagram, up.telegram,
            f.name AS faculty_name,
            g.name AS group_name,
            up.course
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN faculties f ON up.faculty_id = f.id
        LEFT JOIN \`groups\` g ON up.group_id = g.id
        WHERE u.id = ? AND u.is_profile_complete = 1
        `,
        [userId]
    );

    if (!userRows[0]) {
        return null; // User not found or profile not complete
    }

    const user = userRows[0];

    // Filter out sensitive data explicitly
    const publicProfile = {
        id: user.id,
        name: user.name || "Користувач",
        avatar: user.avatar || null,
        role: user.role, // Display role, but might simplify for public view (e.g., "Студент", "Адміністратор")
        gender: user.gender, // Publicly visible (can be "male", "female", "not_specified")
        about_me: user.about_me || null,
        interests: user.interests || null,
        room: user.room || null, // Display current room if filled
        dormitory: user.dormitory || null, // Display dormitory if filled
        instagram: user.instagram || null, // Social links are public by nature
        telegram: user.telegram || null,
        faculty_name: user.faculty_name || null,
        group_name: user.group_name || null,
        course: user.course || null,
        // No email, phone, birthday, internal IDs, etc.
    };

    return publicProfile;
};

export const getPublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        // Basic validation for userId
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ error: "Невірний ID користувача" });
        }

        const profileData = await getPublicProfileInternal(parseInt(userId));

        if (!profileData) {
            return res.status(404).json({ error: "Профіль не знайдено або він не є публічним (не заповнений)." });
        }

        res.json(profileData);
    } catch (error) {
        console.error("[PublicProfileController] Error getting public profile:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
};