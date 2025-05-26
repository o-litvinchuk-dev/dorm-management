import pool from "../config/db.js";
import User from "../models/User.js";

export const getDormManagerStats = async (req, res) => {
  try {
    const dormManagerId = req.user.userId;
    const user = await User.findById(dormManagerId);

    if (!user || user.role !== "dorm_manager" || !user.dormitory_id) {
      return res.status(403).json({ error: "Недостатньо прав або гуртожиток не призначено" });
    }

    const dormitoryId = user.dormitory_id;

    // Count active accommodation applications
    const [accommodationAppsResult] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM accommodation_applications 
       WHERE dormitory_id = ? AND status NOT IN (?, ?, ?, ?, ?)`,
      [dormitoryId, 'rejected', 'rejected_by_faculty', 'rejected_by_dorm', 'settled', 'cancelled_by_user'] // Assuming 'cancelled_by_user' status exists
    );
    const accommodationApplicationsCount = accommodationAppsResult[0].count;

    // Count active room reservations
    const [roomReservationsResult] = await pool.query(
      `SELECT COUNT(rr.id) as count 
       FROM room_reservations rr
       JOIN rooms r ON rr.room_id = r.id
       WHERE r.dormitory_id = ? AND rr.status IN (?, ?)`,
      [dormitoryId, 'pending_confirmation', 'confirmed']
    );
    const roomReservationsCount = roomReservationsResult[0].count;

    // Count pending settlement agreements
    const [settlementAgreementsResult] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM settlement_contracts 
       WHERE dorm_number = ? AND status = ?`, // Assuming dorm_number stores dormitory_id and status 'pending_review' exists
      [String(dormitoryId), 'pending_review']
    );
    const settlementAgreementsCount = settlementAgreementsResult[0].count;

    res.json({
      accommodationApplicationsCount,
      roomReservationsCount,
      settlementAgreementsCount,
      dormitoryName: user.dormitory_name || `Гуртожиток ID: ${dormitoryId}`,
    });
  } catch (error) {
    console.error("[DormManagerController] Помилка отримання статистики:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export default {
  getDormManagerStats,
};