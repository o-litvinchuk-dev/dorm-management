import Joi from "joi";
import SettlementScheduleEntry from "../models/SettlementScheduleEntry.js";
import pool from "../config/db.js";

const scheduleEntrySchema = Joi.object({
    title: Joi.string().min(3).max(255).required().messages({
        'string.empty': "Назва обов'язкова",
        'string.min': "Назва має бути не менше 3 символів",
        'string.max': "Назва не може перевищувати 255 символів"
    }),
    description: Joi.string().allow(null, "").max(2000).messages({
        'string.max': "Опис не може перевищувати 2000 символів"
    }),
    start_date: Joi.date().iso().required().messages({ 
        'any.required': "Дата та час початку обов'язкові.", 
        'date.format': "Невірний формат дати початку (YYYY-MM-DDTHH:mm)"
    }),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).allow(null, "").messages({ 
        'date.min': "Дата закінчення має бути після або рівна даті початку.",
        'date.format': "Невірний формат дати закінчення (YYYY-MM-DDTHH:mm)"
    }),
    target_group_type: Joi.string().valid('all', 'faculty', 'dormitory', 'course', 'group').allow(null, "").default('all'),
    target_group_id: Joi.number().integer().positive().allow(null, "").when('target_group_type', {
        is: Joi.valid('faculty', 'dormitory', 'group'),
        then: Joi.required().messages({'any.required': "ID цілі обов'язковий для цього типу"}),
        otherwise: Joi.when('target_group_type', {
            is: 'course',
            then: Joi.number().integer().min(1).max(6).required().messages({'any.required': "Курс (1-6) обов'язковий", 'number.min':'Курс від 1', 'number.max':'Макс. 6'}),
            otherwise: Joi.optional().allow(null, "") 
        })
    }),
    location: Joi.string().allow(null, "").max(255),
    color_tag: Joi.string().allow(null, "").max(7).pattern(/^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/).messages({ // Updated regex for more hex color formats
        'string.pattern.base': "Колір має бути HEX (напр. #3b82f6 або #fff)"
    }),
});

export const getScheduleEntries = async (req, res) => {
    try {
        const { role, faculty_id: userFacultyId, dormitory_id: userDormitoryId, userId: currentUserId } = req.user || {};
        
        const filters = {
            dateFrom: req.query.dateFrom || null,
            dateTo: req.query.dateTo || null,
        };

        // Визначаємо, чи запит йде з адмін-панелі чи публічної сторінки
        const isAdminRoute = req.path.includes('/admin/settlement-schedule');

        if (isAdminRoute) {
            // Логіка для адмін-панелі
            if (role && !['admin', 'superadmin'].includes(role)) {
                if (role === 'faculty_dean_office' && userFacultyId) {
                    filters.restrict_to_faculty_id = userFacultyId;
                } else if (role === 'dorm_manager' && userDormitoryId) {
                    filters.restrict_to_dormitory_id = userDormitoryId;
                } else {
                    // Якщо роль не адмін/суперадмін і не декан/комендант з ID, повертаємо порожній масив
                    console.warn(`[SettlementScheduleCtrl] Scoped role ${role} without required ID for admin route access, or role not permitted.`);
                    return res.json([]);
                }
            }
        } else {
            // Логіка для публічного календаря (/settlement)
            if (currentUserId && role === 'student') {
                 const [userProfileRows] = await pool.query('SELECT faculty_id, group_id, course FROM user_profiles WHERE user_id = ?', [currentUserId]);
                 const userProfile = userProfileRows[0] || {};
                filters.user_context = {
                    user_id: currentUserId, // Передаємо ID користувача для можливої фільтрації по гуртожитку в моделі
                    faculty_id: userProfile.faculty_id || userFacultyId, // Пріоритет профілю, потім з таблиці users
                    course: userProfile.course,
                    group_id: userProfile.group_id,
                    dormitory_id: userDormitoryId // З таблиці users (якщо студент поселений)
                };
            } else if (!currentUserId) {
                // Для неавторизованих користувачів на /settlement, user_context не буде,
                // модель має повернути тільки 'all' записи.
            }
        }
        
        const entries = await SettlementScheduleEntry.findAll(filters);
        res.json(entries);
    } catch (error) {
        console.error("[SettlementScheduleCtrl] Error fetching schedule entries:", { path: req.path, error: error.message, stack: error.stack });
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};

export const createScheduleEntry = async (req, res) => {
    try {
        const { error, value } = scheduleEntrySchema.validate(req.body);
        if (error) {
            console.error("[SettlementScheduleCtrl] Validation error on create:", error.details);
            return res.status(400).json({ error: "Невірні дані", details: error.details.map(d => d.message) });
        }

        const { role, faculty_id: userFacultyId, dormitory_id: userDormitoryId, userId } = req.user || {};
        const { target_group_type, target_group_id } = value;

        // Перевірка прав на створення
        if (role === 'faculty_dean_office') {
            if (!userFacultyId) return res.status(403).json({ error: "Деканат не прив'язаний до факультету." });
            
            if (target_group_type === 'faculty' && Number(target_group_id) !== userFacultyId) {
                return res.status(403).json({ error: "Деканат може створювати записи лише для свого факультету." });
            }
            if (target_group_type === 'group') {
                const [groupFacultyRows] = await pool.query('SELECT faculty_id FROM `groups` WHERE id = ?', [target_group_id]);
                if (!groupFacultyRows[0] || groupFacultyRows[0].faculty_id !== userFacultyId) {
                    return res.status(403).json({ error: "Обрана група не належить до вашого факультету." });
                }
            }
            if (!['faculty', 'course', 'group'].includes(target_group_type) && target_group_type !== 'all') { // Dean can also make 'all'
                 return res.status(403).json({ error: "Деканат може створювати записи для факультету, курсу, групи свого факультету або для всіх." });
            }
        } else if (role === 'dorm_manager') {
            if (!userDormitoryId) return res.status(403).json({ error: "Комендант не прив'язаний до гуртожитку." });
            if (target_group_type !== 'dormitory' || Number(target_group_id) !== userDormitoryId) {
                 if (target_group_type !== 'all') { // Dorm manager can also make 'all'
                    return res.status(403).json({ error: "Комендант може створювати записи лише для свого гуртожитку або для всіх." });
                 }
            }
        } else if (!['admin', 'superadmin'].includes(role)) {
            return res.status(403).json({error: "Недостатньо прав для створення запису."});
        }

        const created_by = userId; // Зберігаємо ID користувача, що створив запис
        const entryId = await SettlementScheduleEntry.create({ ...value, created_by });
        const newEntry = await SettlementScheduleEntry.findById(entryId);
        res.status(201).json({ message: "Запис у розкладі створено", entry: newEntry });
    } catch (error) {
        console.error("[SettlementScheduleCtrl] Error creating schedule entry:", error);
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};

export const updateScheduleEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = scheduleEntrySchema.validate(req.body);
        if (error) {
            console.error("[SettlementScheduleCtrl] Validation error on update:", error.details);
            return res.status(400).json({ error: "Невірні дані", details: error.details.map(d => d.message) });
        }

        const entryToUpdate = await SettlementScheduleEntry.findById(id);
        if (!entryToUpdate) {
            return res.status(404).json({ error: "Запис не знайдено" });
        }

        const { role, userId, faculty_id: userFacultyId, dormitory_id: userDormitoryId } = req.user || {};
        const { target_group_type: newTargetType, target_group_id: newTargetId } = value;

        let canManage = false;
        if (role === 'admin' || role === 'superadmin') {
            canManage = true;
        } else if (entryToUpdate.created_by === userId) { // Автор може редагувати
             canManage = true;
        } else { // Додаткові перевірки для деканату/коменданта, якщо вони НЕ автори
            if (role === 'faculty_dean_office' && userFacultyId) {
                if (entryToUpdate.target_group_type === 'faculty' && entryToUpdate.target_group_id === userFacultyId) canManage = true;
                else if (entryToUpdate.target_group_type === 'course') canManage = true; 
                else if (entryToUpdate.target_group_type === 'group' && entryToUpdate.group_faculty_id === userFacultyId) canManage = true;
            } else if (role === 'dorm_manager' && userDormitoryId) {
                if (entryToUpdate.target_group_type === 'dormitory' && entryToUpdate.target_group_id === userDormitoryId) canManage = true;
            }
        }
        
        if (!canManage) {
             return res.status(403).json({ error: "Недостатньо прав для редагування цього запису." });
        }
        
        // Додаткові обмеження на зміну цільової групи для ролей, якщо вони НЕ автори
        if (entryToUpdate.created_by !== userId) {
            if (role === 'faculty_dean_office') {
                if (newTargetType === 'faculty' && Number(newTargetId) !== userFacultyId) {
                    return res.status(403).json({ error: "Деканат може оновлювати записи лише для свого факультету." });
                }
                if (newTargetType === 'group') {
                    const [groupFacultyRows] = await pool.query('SELECT faculty_id FROM `groups` WHERE id = ?', [newTargetId]);
                    if (!groupFacultyRows[0] || groupFacultyRows[0].faculty_id !== userFacultyId) {
                        return res.status(403).json({ error: "Обрана група для оновлення не належить до вашого факультету." });
                    }
                }
                 if (newTargetType === 'all' || newTargetType === 'dormitory') { 
                      // Allow dean to edit 'all' if it was originally 'all' or their faculty/course/group
                     if(entryToUpdate.target_group_type !== 'all' && 
                        !(entryToUpdate.target_group_type === 'faculty' && entryToUpdate.target_group_id === userFacultyId) &&
                        !(entryToUpdate.target_group_type === 'course') &&
                        !(entryToUpdate.target_group_type === 'group' && entryToUpdate.group_faculty_id === userFacultyId)
                     ) {
                        return res.status(403).json({ error: "Деканат не може змінювати тип на 'всіх' або на конкретні гуртожитки для чужих записів." });
                     }
                 }
            } else if (role === 'dorm_manager') {
                 if (newTargetType !== 'dormitory' || Number(newTargetId) !== userDormitoryId) {
                     if(newTargetType !== 'all' || (newTargetType === 'all' && entryToUpdate.target_group_type !== 'all' && entryToUpdate.target_group_type !== 'dormitory' && entryToUpdate.target_group_id !== userDormitoryId)) {
                        return res.status(403).json({ error: "Комендант може оновлювати записи лише для свого гуртожитку або змінювати на 'всіх'." });
                     }
                 }
            }
        }


        const updated = await SettlementScheduleEntry.update(id, value);
        if (!updated) {
            return res.status(500).json({ error: "Не вдалося оновити запис або дані не змінилися" });
        }
        const updatedEntry = await SettlementScheduleEntry.findById(id);
        res.json({ message: "Запис у розкладі оновлено", entry: updatedEntry });
    } catch (error) {
        console.error("[SettlementScheduleCtrl] Error updating schedule entry:", error);
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};

export const deleteScheduleEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const entryToDelete = await SettlementScheduleEntry.findById(id); 
        if (!entryToDelete) {
            return res.status(404).json({ error: "Запис не знайдено" });
        }

        const { role, userId, faculty_id: userFacultyId, dormitory_id: userDormitoryId } = req.user || {};
        
        let canManage = false;
        if (role === 'admin' || role === 'superadmin') {
            canManage = true;
        } else if (entryToDelete.created_by === userId) { 
             canManage = true;
        } else {
            if (role === 'faculty_dean_office' && userFacultyId) {
                if (entryToDelete.target_group_type === 'faculty' && entryToDelete.target_group_id === userFacultyId) canManage = true;
                else if (entryToDelete.target_group_type === 'course') canManage = true;
                else if (entryToDelete.target_group_type === 'group' && entryToDelete.group_faculty_id === userFacultyId) canManage = true;
            } else if (role === 'dorm_manager' && userDormitoryId) {
                if (entryToDelete.target_group_type === 'dormitory' && entryToDelete.target_group_id === userDormitoryId) canManage = true;
            }
        }
        
        if (!canManage) {
            return res.status(403).json({ error: "Недостатньо прав для видалення цього запису." });
        }

        const deleted = await SettlementScheduleEntry.delete(id);
        if (!deleted) {
            return res.status(500).json({ error: "Не вдалося видалити запис" });
        }
        res.json({ message: "Запис у розкладі видалено" });
    } catch (error) {
        console.error("[SettlementScheduleCtrl] Error deleting schedule entry:", error);
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};