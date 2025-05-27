import DormitoryPass from "../models/DormitoryPass.js";
import AccommodationApplication from "../models/AccommodationApplication.js"; // Потрібен для перевірки
import RoomReservation from "../models/RoomReservation.js";
import Room from "../models/Room.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Dormitory from "../models/Dormitory.js";
import pool from "../config/db.js";

export const DormitoryPassService = {
    // Цей метод може бути спрощений або використовуватися лише для оновлення,
    // якщо перепустка вже існує і її потрібно оновити через зміну заявки (що малоймовірно, якщо основна логіка на договорі)
    // Для чистоти, приберемо пряму генерацію звідси, покладаючись на логіку договору.
    async updatePassDetailsFromApplication(applicationId, adminUserId, assignedRoomIdFromController = null) {
        const application = await AccommodationApplication.findById(applicationId);
        if (!application) {
            console.warn(`[PassService-UpdateFromApp] Application ${applicationId} not found.`);
            return null;
        }

        // Шукаємо активну перепустку, пов'язану з цією заявкою або для цього користувача/періоду
        // Це більш складна логіка, якщо перепустка генерується лише по договору.
        // Можливо, цей метод взагалі не потрібен, якщо договір - єдиний тригер.
        // Припустимо, нам потрібно знайти існуючу перепустку за source_id (applicationId)
        const [existingPasses] = await pool.query(
            `SELECT * FROM dormitory_passes WHERE source_type = 'application' AND source_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
            [applicationId]
        );

        if (!existingPasses || existingPasses.length === 0) {
             // Або шукаємо перепустку, згенеровану за договором, якщо логіка змінилася
            const [contractPasses] = await pool.query(
                `SELECT dp.* FROM dormitory_passes dp
                 JOIN settlement_contracts sc ON dp.source_id = sc.id AND dp.source_type = 'contract'
                 WHERE sc.user_id = ? AND sc.dorm_number = ? AND sc.settlement_end_date = ? AND dp.status = 'active'
                 ORDER BY dp.created_at DESC LIMIT 1`,
                [application.user_id, application.dormitory_id, application.end_date]
            );
            if (!contractPasses || contractPasses.length === 0) {
                console.log(`[PassService-UpdateFromApp] No active pass found for application ${applicationId} or related contract to update.`);
                return null;
            }
            existingPass = contractPasses[0];
        } else {
            existingPass = existingPasses[0];
        }


        let finalRoomId = assignedRoomIdFromController || application.current_room_id_from_settlement || application.room_id || existingPass.room_id;
        let finalRoomNumberText = existingPass.room_number_text;

        if (finalRoomId) {
            const roomData = await Room.findById(finalRoomId);
            if (roomData) finalRoomNumberText = roomData.number;
        } else if (application.display_room_info && application.display_room_info !== 'Не вказано') {
            finalRoomNumberText = application.display_room_info;
        }

        const passPayload = {
            room_id: finalRoomId,
            room_number_text: finalRoomNumberText,
            valid_from: application.start_date,
            valid_until: application.end_date,
            // Статус не змінюємо тут, якщо він вже активний
            issued_by: adminUserId, // Оновлюємо, хто останній раз торкався
        };
        
        await DormitoryPass.updatePass(existingPass.id, passPayload);
        console.log(`[PassService-UpdateFromApp] Pass ${existingPass.id} details updated based on application ${applicationId}.`);
        return existingPass.id;
    },

    async ensurePassForContractDetails({
        contractId,
        userId,
        dormitoryId,
        roomNumberText, // Номер кімнати з контракту
        validFrom,      // Дата початку проживання з контракту
        validUntil,     // Дата кінця проживання з контракту
        issuedBy,
    }) {
        if (!contractId || !userId || !dormitoryId || !validFrom || !validUntil || !issuedBy) {
            console.warn(`[PassService][Contract] Missing required data for pass generation from contract ${contractId}.`);
            return null;
        }

        // КРОК 1: Перевірка наявності затвердженої заявки на поселення
        const approvedApplicationStatuses = ['approved', 'approved_by_faculty', 'approved_by_dorm', 'settled'];
        const [applications] = await pool.query(
            `SELECT id, status, preferred_room, start_date, end_date
             FROM accommodation_applications
             WHERE user_id = ? AND dormitory_id = ?
               AND status IN (?)
               AND (? BETWEEN start_date AND end_date OR ? BETWEEN start_date AND end_date OR (start_date >= ? AND end_date <= ?))
             ORDER BY created_at DESC`,
            [userId, dormitoryId, approvedApplicationStatuses, validFrom, validUntil, validFrom, validUntil]
        );

        if (!applications || applications.length === 0) {
            console.warn(`[PassService][Contract] No approved accommodation application found for user ${userId}, dorm ${dormitoryId} matching contract period ${validFrom} - ${validUntil}. Pass will NOT be generated.`);
            // Можна створити сповіщення адміну або користувачу про проблему
            await Notification.create({
                user_id: userId,
                title: "Проблема з генерацією перепустки",
                description: `Не знайдено відповідної затвердженої заявки на поселення для вашого договору №${contractId}. Зверніться до адміністрації.`,
            });
            return null;
        }
        const relevantApplication = applications[0]; // Беремо найсвіжішу відповідну заявку
        console.log(`[PassService][Contract] Found relevant approved application ID: ${relevantApplication.id} with status: ${relevantApplication.status}`);


        // КРОК 2: Визначення кімнати
        let finalRoomId = null;
        let finalRoomNumberForPass = roomNumberText || relevantApplication.preferred_room || 'N/A';

        if (roomNumberText && roomNumberText !== 'N/A') { // Якщо кімната вказана в контракті
            const roomByContractText = await pool.query(
                'SELECT id FROM rooms WHERE number = ? AND dormitory_id = ?',
                [String(roomNumberText), Number(dormitoryId)]
            );
            if (roomByContractText[0] && roomByContractText[0].length > 0) {
                finalRoomId = roomByContractText[0][0].id;
            } else {
                 console.warn(`[PassService][Contract] Room by contract number "${roomNumberText}" in dorm ${dormitoryId} not found. Using text.`);
            }
        } else if (relevantApplication.preferred_room) { // Якщо в контракті не було, беремо з заявки
            finalRoomNumberForPass = relevantApplication.preferred_room;
            const roomByAppPreferred = await pool.query(
                'SELECT id FROM rooms WHERE number = ? AND dormitory_id = ?',
                [String(relevantApplication.preferred_room), Number(dormitoryId)]
            );
            if (roomByAppPreferred[0] && roomByAppPreferred[0].length > 0) {
                finalRoomId = roomByAppPreferred[0][0].id;
            }
        }
        
        console.log(`[PassService][Contract] For Contract ${contractId}: finalRoomId=${finalRoomId}, finalRoomNumberForPass=${finalRoomNumberForPass}`);


        // КРОК 3: Перевірка існуючої перепустки та створення/оновлення
        const existingPass = await DormitoryPass.findExistingPass(
            userId,
            dormitoryId,
            validUntil, // Кінець дії перепустки = кінець дії контракту
            finalRoomId,
            finalRoomNumberForPass
        );

        const passPayload = {
            room_id: finalRoomId,
            room_number_text: finalRoomNumberForPass,
            valid_from: validFrom, // Початок дії перепустки = початок дії контракту
            valid_until: validUntil,
            status: 'active',
            source_id: contractId, // Тепер джерело - контракт
            source_type: 'contract',
            issued_by: issuedBy,
        };

        let passIdToReturn;
        if (existingPass) {
            console.log(`[PassService][Contract] Updating existing pass ${existingPass.id} for contract ${contractId}.`);
            await DormitoryPass.updatePass(existingPass.id, passPayload);
            passIdToReturn = existingPass.id;
        } else {
            // Додатково деактивуємо інші активні перепустки для цього користувача, якщо вони є
            const [activeUserPasses] = await pool.query(
                `SELECT id FROM dormitory_passes WHERE user_id = ? AND status = 'active'`,
                [userId]
            );
            for (const oldPass of activeUserPasses) {
                await DormitoryPass.revokePass(oldPass.id, issuedBy); // Або інший статус, наприклад 'superseded'
                console.log(`[PassService][Contract] Revoked previous active pass ${oldPass.id} for user ${userId}.`);
            }

            const passDataForCreate = {
                user_id: userId,
                dormitory_id: dormitoryId,
                ...passPayload,
            };
            const newPassId = await DormitoryPass.create(passDataForCreate);
            passIdToReturn = newPassId;
            console.log(`[PassService][Contract] Pass ${newPassId} created for contract ${contractId}.`);
        }

        let dormitoryNameForNotification = `гуртожитку ID ${dormitoryId}`;
        try {
            const dorm = await Dormitory.findById(dormitoryId);
            if(dorm && dorm.name) dormitoryNameForNotification = `гуртожитку "${dorm.name}"`;
        } catch (e) { console.error("Could not fetch dormitory name for notification:", e); }
        
        await Notification.create({
            user_id: userId,
            title: "Перепустку в гуртожиток видано/оновлено",
            description: `Вашу перепустку для ${dormitoryNameForNotification} (кімната ${finalRoomNumberForPass}) ${existingPass ? 'оновлено' : 'згенеровано'} на підставі договору №${contractId}. Дійсна з ${validFrom} до ${validUntil}.`,
        });
        
        return passIdToReturn;
    },

    // Метод ensurePassForReservation залишається без змін, оскільки він обслуговує інший сценарій
    async ensurePassForReservation(reservationId, adminUserId) {
        const reservation = await RoomReservation.findById(reservationId);
        if (!reservation || reservation.status !== 'checked_in') {
            console.warn(`[PassService] Reservation ${reservationId} not found or not 'checked_in'.`);
            return null;
        }
        const academicYearParts = reservation.academic_year.split('-');
        const startYear = parseInt(academicYearParts[0]);
        const endYear = parseInt(academicYearParts[1]);
        const valid_from = `${startYear}-09-01`;
        const valid_until = `${endYear}-06-30`;
        const existingPass = await DormitoryPass.findExistingPass(
            reservation.user_id,
            reservation.dormitory_id,
            valid_until,
            reservation.room_id,
            reservation.room_number
        );
        const passPayload = {
            room_id: reservation.room_id,
            room_number_text: reservation.room_number || 'N/A',
            valid_from: valid_from,
            valid_until: valid_until,
            status: 'active',
            source_id: reservationId,
            source_type: 'reservation',
            issued_by: adminUserId,
        };
        if (existingPass) {
            console.log(`[PassService] Updating existing pass ${existingPass.id} for reservation ${reservationId}.`);
            await DormitoryPass.updatePass(existingPass.id, passPayload);
            return existingPass.id;
        }
        const passDataForCreate = {
            user_id: reservation.user_id,
            dormitory_id: reservation.dormitory_id,
            ...passPayload,
        };
        const passId = await DormitoryPass.create(passDataForCreate);
        let dormitoryNameForNotification = reservation.dormitory_name;
        if (!dormitoryNameForNotification && reservation.dormitory_id) {
            const dorm = await Dormitory.findById(reservation.dormitory_id);
            dormitoryNameForNotification = dorm?.name || `ID: ${reservation.dormitory_id}`;
        }
        await Notification.create({
            user_id: reservation.user_id,
            title: "Перепустку в гуртожиток видано (за бронюванням)",
            description: `Вашу перепустку для гуртожитку "${dormitoryNameForNotification}" (кімната ${reservation.room_number || 'N/A'}) згенеровано. Дійсна до ${valid_until}.`,
        });
        console.log(`[PassService] Pass ${passId} created for reservation ${reservationId}.`);
        return passId;
    },
};