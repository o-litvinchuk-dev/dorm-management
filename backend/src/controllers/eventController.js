import Joi from "joi";
import Event from "../models/Event.js";
import User from "../models/User.js";
import pool from "../config/db.js"; // Для перевірки faculty_dormitories та group_faculty

const eventTargetSchema = Joi.object({
    target_type: Joi.string().valid('all_settled', 'dormitory', 'faculty', 'course', 'group').required(),
    target_id: Joi.number().integer().positive().allow(null, "").when('target_type', {
        is: Joi.valid('faculty', 'dormitory', 'group'),
        then: Joi.required(),
        otherwise: Joi.when('target_type', {
            is: 'course',
            then: Joi.number().integer().min(1).max(6).required(),
            otherwise: Joi.optional().allow(null, "")
        })
    })
});

const eventSchema = Joi.object({
    title: Joi.string().min(3).max(255).required().messages({
        'string.empty': "Назва події обов'язкова.",
        'string.min': "Назва події має містити щонайменше 3 символи.",
        'string.max': "Назва події не може перевищувати 255 символів."
    }),
    description: Joi.string().allow(null, "").max(5000),
    start_time: Joi.date().iso().required().messages({ 'any.required': "Дата та час початку обов'язкові."}),
    end_time: Joi.date().iso().min(Joi.ref('start_time')).allow(null, "").messages({ 'date.min': "Дата закінчення має бути після дати початку."}),
    location: Joi.string().allow(null, "").max(255),
    color_tag: Joi.string().allow(null, "").max(7).pattern(/^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/),
    category: Joi.string().allow(null, "").max(50),
    targets: Joi.array().items(eventTargetSchema).min(0).optional().default([]),
});

export const createEvent = async (req, res) => {
    try {
        const { error, value } = eventSchema.validate(req.body);
        if (error) {
            console.error("[EventCtrl] Validation error on create:", error.details);
            return res.status(400).json({ error: "Невірні дані для створення події", details: error.details });
        }

        let eventData = {
            ...value,
            created_by_user_id: req.user.userId
        };

        if (req.user.role === 'dorm_manager') {
            if (!req.user.dormitory_id) {
                return res.status(403).json({ error: "Коменданту не призначено гуртожиток." });
            }
            eventData.targets = [{ target_type: 'dormitory', target_id: req.user.dormitory_id }];
        } else if (req.user.role === 'faculty_dean_office') {
            if (!req.user.faculty_id) {
                return res.status(403).json({ error: "Деканату не призначено факультет." });
            }
            if (!value.targets || value.targets.length === 0) {
                eventData.targets = [{ target_type: 'faculty', target_id: req.user.faculty_id }];
            } else {
                const validatedTargets = [];
                for (const target of value.targets) {
                    if (target.target_type === 'faculty' && Number(target.target_id) !== req.user.faculty_id) {
                        return res.status(403).json({ error: "Деканат може створювати події лише для свого факультету." });
                    }
                    if (target.target_type === 'group') {
                        const [groupCheck] = await pool.query('SELECT faculty_id FROM `groups` WHERE id = ?', [target.target_id]);
                        if (!groupCheck[0] || groupCheck[0].faculty_id !== req.user.faculty_id) {
                            return res.status(403).json({ error: `Група ID ${target.target_id} не належить вашому факультету.` });
                        }
                    }
                    if (target.target_type === 'dormitory') {
                        const [dormCheck] = await pool.query('SELECT faculty_id FROM faculty_dormitories WHERE dormitory_id = ? AND faculty_id = ?', [target.target_id, req.user.faculty_id]);
                        if (!dormCheck[0]) {
                            return res.status(403).json({ error: `Гуртожиток ID ${target.target_id} не закріплений за вашим факультетом.`});
                        }
                    }
                     if (target.target_type === 'all_settled'){
                         return res.status(403).json({ error: "Деканат не може створювати події для 'Всіх поселених'."});
                     }
                    validatedTargets.push(target);
                }
                eventData.targets = validatedTargets;
                 if (!eventData.targets.some(t => t.target_type === 'faculty' && t.target_id === req.user.faculty_id)) {
                    eventData.targets.push({ target_type: 'faculty', target_id: req.user.faculty_id });
                }
            }
        }

        const eventId = await Event.create(eventData);
        const newEvent = await Event.findById(eventId);
        res.status(201).json({ message: "Подію успішно створено", event: newEvent });
    } catch (err) {
        console.error("[EventCtrl] Error creating event:", err);
        res.status(500).json({ error: "Помилка сервера при створенні події", details: err.message });
    }
};

export const getEventById = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: "Подію не знайдено" });
        }
        // Додаткова перевірка доступу, якщо потрібно, хоча Casbin вже мав би це зробити
        res.json(event);
    } catch (err) {
        console.error(`[EventCtrl] Error fetching event ${req.params.eventId}:`, err);
        res.status(500).json({ error: "Помилка сервера", details: err.message });
    }
};

export const getAllEventsForUser = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.userId);
        if (!currentUser) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }
        const userProfile = await pool.query('SELECT faculty_id, group_id, course FROM user_profiles WHERE user_id = ?', [currentUser.id])
            .then(([rows]) => rows[0] || {});
        
        const events = await Event.findAllForUser(
            currentUser.id,
            currentUser.role,
            currentUser.dormitory_id,
            userProfile.faculty_id || currentUser.faculty_id, 
            userProfile.group_id,
            userProfile.course,
            req.query 
        );
        res.json(events);
    } catch (err) {
        console.error("[EventCtrl] Error fetching events for user:", err);
        res.status(500).json({ error: "Помилка сервера", details: err.message });
    }
};

export const getAllEventsAdmin = async (req, res) => {
    try {
        const events = await Event.findAllAdmin(req.query);
        res.json(events);
    } catch (err) {
        console.error("[EventCtrl] Error fetching all events for admin:", err);
        res.status(500).json({ error: "Помилка сервера", details: err.message });
    }
}

export const updateEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { error, value } = eventSchema.validate(req.body);
        if (error) {
            console.error("[EventCtrl] Validation error on update:", error.details);
            return res.status(400).json({ error: "Невірні дані для оновлення події", details: error.details });
        }

        const eventToUpdate = await Event.findById(eventId);
        if (!eventToUpdate) {
            return res.status(404).json({ error: "Подію не знайдено" });
        }
        
        let eventDataForUpdate = { ...value };

        // Authorization Logic
        if (req.user.role === 'dorm_manager') {
            if (eventToUpdate.created_by_user_id !== req.user.userId || 
                !eventToUpdate.targets?.some(t => t.target_type === 'dormitory' && Number(t.target_id) === req.user.dormitory_id) ||
                eventToUpdate.targets?.length !== 1) {
                return res.status(403).json({ error: "Комендант може редагувати лише власні події, націлені виключно на його гуртожиток." });
            }
            // Force target to be only their dormitory
            eventDataForUpdate.targets = [{ target_type: 'dormitory', target_id: req.user.dormitory_id }];
        } else if (req.user.role === 'faculty_dean_office') {
            if (eventToUpdate.created_by_user_id !== req.user.userId && 
                !eventToUpdate.targets?.some(t => t.target_type === 'faculty' && Number(t.target_id) === req.user.faculty_id)) {
                 // Check if any target is related to their faculty or managed dorms/groups/courses
                let canManage = false;
                if (eventToUpdate.targets) {
                    for (const target of eventToUpdate.targets) {
                        if (target.target_type === 'faculty' && Number(target.target_id) === req.user.faculty_id) canManage = true;
                        if (target.target_type === 'group') {
                             const [groupCheck] = await pool.query('SELECT faculty_id FROM `groups` WHERE id = ? AND faculty_id = ?', [target.target_id, req.user.faculty_id]);
                             if (groupCheck[0]) canManage = true;
                        }
                        if (target.target_type === 'dormitory') {
                             const [dormCheck] = await pool.query('SELECT faculty_id FROM faculty_dormitories WHERE dormitory_id = ? AND faculty_id = ?', [target.target_id, req.user.faculty_id]);
                             if (dormCheck[0]) canManage = true;
                        }
                         if (target.target_type === 'course') canManage = true; // Dean can target courses within their faculty context
                        if (canManage) break;
                    }
                }
                if (!canManage) return res.status(403).json({ error: "Деканат може редагувати лише власні події або події, націлені на їхній факультет/підрозділи." });
            }
            
            const validatedTargets = [];
            if (value.targets && value.targets.length > 0) {
                for (const target of value.targets) {
                    if (target.target_type === 'faculty' && Number(target.target_id) !== req.user.faculty_id) {
                        return res.status(403).json({ error: "Деканат може націлювати події лише на свій факультет." });
                    }
                    if (target.target_type === 'group') {
                        const [groupCheck] = await pool.query('SELECT faculty_id FROM `groups` WHERE id = ?', [target.target_id]);
                        if (!groupCheck[0] || groupCheck[0].faculty_id !== req.user.faculty_id) {
                            return res.status(403).json({ error: `Група ID ${target.target_id} не належить вашому факультету.` });
                        }
                    }
                    if (target.target_type === 'dormitory') {
                        const [dormCheck] = await pool.query('SELECT faculty_id FROM faculty_dormitories WHERE dormitory_id = ? AND faculty_id = ?', [target.target_id, req.user.faculty_id]);
                        if (!dormCheck[0]) {
                             return res.status(403).json({ error: `Гуртожиток ID ${target.target_id} не закріплений за вашим факультетом.`});
                        }
                    }
                     if (target.target_type === 'all_settled'){
                         return res.status(403).json({ error: "Деканат не може створювати/редагувати події для 'Всіх поселених'."});
                     }
                    validatedTargets.push(target);
                }
                // Ensure the faculty itself is a target if other faculty-specific targets are present
                if (validatedTargets.length > 0 && !validatedTargets.some(t => t.target_type === 'faculty' && t.target_id === req.user.faculty_id)) {
                     if (validatedTargets.some(t => ['group', 'course', 'dormitory'].includes(t.target_type))){
                        validatedTargets.push({ target_type: 'faculty', target_id: req.user.faculty_id });
                     }
                }
            } else { // If targets are empty, default to their faculty
                 validatedTargets.push({ target_type: 'faculty', target_id: req.user.faculty_id });
            }
            eventDataForUpdate.targets = validatedTargets;

        } else if (!['admin', 'superadmin'].includes(req.user.role)) {
             // For other roles, if they are not admin/superadmin, they shouldn't be able to reach here due to Casbin,
             // but as a fallback, check if they created the event.
             if (eventToUpdate.created_by_user_id !== req.user.userId) {
                return res.status(403).json({ error: "Недостатньо прав для редагування цієї події."});
             }
        }

        const updated = await Event.update(eventId, eventDataForUpdate);
        if (!updated) {
            return res.status(500).json({ error: "Не вдалося оновити подію або дані не змінилися" });
        }
        const updatedEvent = await Event.findById(eventId);
        res.json({ message: "Подію успішно оновлено", event: updatedEvent });
    } catch (err) {
        console.error(`[EventCtrl] Error updating event ${req.params.eventId}:`, err);
        res.status(500).json({ error: "Помилка сервера", details: err.message });
    }
};

export const deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const eventToDelete = await Event.findById(eventId);
        if (!eventToDelete) {
            return res.status(404).json({ error: "Подію не знайдено" });
        }

        // Authorization Logic
        if (req.user.role === 'dorm_manager') {
            if (eventToDelete.created_by_user_id !== req.user.userId || 
                !eventToDelete.targets?.some(t => t.target_type === 'dormitory' && Number(t.target_id) === req.user.dormitory_id) ||
                eventToDelete.targets?.length !== 1) {
                return res.status(403).json({ error: "Комендант може видаляти лише власні події, націлені виключно на його гуртожиток." });
            }
        } else if (req.user.role === 'faculty_dean_office') {
             if (eventToDelete.created_by_user_id !== req.user.userId && 
                !eventToDelete.targets?.some(t => t.target_type === 'faculty' && Number(t.target_id) === req.user.faculty_id)) {
                let canManage = false;
                if (eventToDelete.targets) {
                    for (const target of eventToDelete.targets) {
                        if (target.target_type === 'faculty' && Number(target.target_id) === req.user.faculty_id) canManage = true;
                         if (target.target_type === 'group') {
                             const [groupCheck] = await pool.query('SELECT faculty_id FROM `groups` WHERE id = ? AND faculty_id = ?', [target.target_id, req.user.faculty_id]);
                             if (groupCheck[0]) canManage = true;
                        }
                        if (target.target_type === 'dormitory') {
                             const [dormCheck] = await pool.query('SELECT faculty_id FROM faculty_dormitories WHERE dormitory_id = ? AND faculty_id = ?', [target.target_id, req.user.faculty_id]);
                             if (dormCheck[0]) canManage = true;
                        }
                        if (target.target_type === 'course') canManage = true;
                        if (canManage) break;
                    }
                }
                 if (!canManage) return res.status(403).json({ error: "Деканат може видаляти лише власні події або події, націлені на їхній факультет/підрозділи." });
            }
        } else if (!['admin', 'superadmin'].includes(req.user.role)) {
             if (eventToDelete.created_by_user_id !== req.user.userId) {
                 return res.status(403).json({ error: "Недостатньо прав для видалення цієї події."});
             }
        }

        const deleted = await Event.delete(eventId);
        if (!deleted) {
            return res.status(500).json({ error: "Не вдалося видалити подію" });
        }
        res.json({ message: "Подію успішно видалено" });
    } catch (err) {
        console.error(`[EventCtrl] Error deleting event ${req.params.eventId}:`, err);
        res.status(500).json({ error: "Помилка сервера", details: err.message });
    }
};