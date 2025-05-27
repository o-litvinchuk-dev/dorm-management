import DormitoryPass from "../models/DormitoryPass.js";
// No need for User, Faculties, Dormitory, Room models here as pass model denormalizes for display

export const getMyPass = async (req, res) => {
    try {
        const userId = req.user.userId;
        const pass = await DormitoryPass.findActiveByUserId(userId);
        if (!pass) {
            return res.status(404).json({ message: "Активну перепустку не знайдено. Вона генерується після підтвердження поселення." });
        }
        res.json(pass);
    } catch (error) {
        console.error("[DormPassCtrl][getMyPass] Error:", error);
        res.status(500).json({ error: "Помилка сервера при отриманні перепустки." });
    }
};

export const verifyPassPublic = async (req, res) => {
    try {
        const { passIdentifier } = req.params;
        const passDetails = await DormitoryPass.findByIdentifierPublic(passIdentifier);

        if (!passDetails) {
            return res.status(404).json({ isValid: false, message: "Перепустку не знайдено." });
        }

        if (passDetails.status !== 'active') {
            return res.status(403).json({ isValid: false, message: `Статус перепустки: ${passDetails.status === 'revoked' ? 'анульовано' : 'прострочено'}.` });
        }

        const validUntil = new Date(passDetails.valid_until);
        const today = new Date();
        today.setHours(0,0,0,0); 

        if (validUntil < today) {
             // Optionally update status in DB here if not handled by a cron job
            // await DormitoryPass.updatePass(passDetails.id, { status: 'expired' }); // Assuming findByIdentifierPublic returns id
            return res.status(403).json({ isValid: false, message: "Термін дії перепустки закінчився." });
        }
        
        res.json({
            isValid: true,
            studentName: passDetails.student_name,
            studentAvatar: passDetails.student_avatar,
            facultyName: passDetails.faculty_name,
            dormitoryName: passDetails.dormitory_name,
            roomDisplayNumber: passDetails.room_display_number,
            validUntil: passDetails.valid_until,
            message: "Перепустка дійсна."
        });
    } catch (error) {
        console.error("[DormPassCtrl][verifyPassPublic] Error:", error);
        res.status(500).json({ isValid: false, message: "Помилка сервера при перевірці перепустки." });
    }
};

// Admin Pass Management - placeholder for now
export const revokePassAdmin = async (req, res) => {
    try {
        const { passId } = req.params;
        // Add permission checks: only superadmin, admin, or relevant dorm_manager/dean
        const revoked = await DormitoryPass.revokePass(passId, req.user.userId);
        if (!revoked) {
            return res.status(404).json({ error: "Перепустку не знайдено або вже анульовано." });
        }
        // TODO: Notify student if pass is revoked
        res.json({ message: "Перепустку успішно анульовано." });
    } catch (error) {
        console.error("[DormPassCtrl][revokePassAdmin] Error:", error);
        res.status(500).json({ error: "Помилка сервера при анулюванні перепустки." });
    }
};