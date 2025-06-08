import Joi from "joi";
import DormitoryApplicationPreset from "../models/DormitoryApplicationPreset.js";
import Dormitory from "../models/Dormitory.js";
import Faculties from "../models/Faculties.js";

const presetSchema = Joi.object({
    dormitory_id: Joi.number().integer().positive().required(),
    faculty_id: Joi.number().integer().positive().allow(null).optional(),
    academic_year: Joi.string().pattern(/^\d{4}-\d{4}$/).required().messages({
        'string.pattern.base': 'Академічний рік має бути у форматі РРРР-РРРР (наприклад, 2024-2025)'
    }),
    start_date: Joi.date().iso().allow(null).optional(),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).allow(null).optional().messages({
        'date.min': 'Дата закінчення повинна бути пізніше або такою ж, як дата початку'
    }),
    default_comments: Joi.string().max(1000).allow(null, '').optional(),
    is_active: Joi.boolean().optional().default(true)
});

// Функція для перевірки, чи має користувач право керувати пресетом
const canUserManagePreset = async (user, preset, newPresetData = null) => {
    const { role, faculty_id: userFacultyId, dormitory_id: userDormitoryId, userId } = user;

    if (role === 'admin' || role === 'superadmin') {
        return { canManage: true };
    }
    
    // Власник пресету (декан або комендант) може керувати ним з обмеженнями
    if (preset.created_by === userId) {
        // Логіка для власників (можливо, з якимись обмеженнями, які можна додати тут)
        // return { canManage: true };
    }

    if (role === 'faculty_dean_office') {
        if (!userFacultyId) return { canManage: false, message: "Деканат не прив'язаний до факультету." };
        // Може керувати пресетом свого факультету або глобальним пресетом
        if (preset.faculty_id !== userFacultyId && preset.faculty_id !== null) {
            return { canManage: false, message: "Деканат може редагувати лише налаштування свого факультету або глобальні." };
        }
    } else if (role === 'dorm_manager') {
        if (!userDormitoryId) return { canManage: false, message: "Коменданту не призначено гуртожиток." };
        // Може керувати пресетами лише свого гуртожитку
        if (preset.dormitory_id !== userDormitoryId) {
            return { canManage: false, message: "Комендант може редагувати лише налаштування свого гуртожитку." };
        }
        // ... і лише якщо вони не специфічні для факультету
        if (preset.faculty_id !== null) {
             return { canManage: false, message: "Комендант може редагувати лише глобальні налаштування для свого гуртожитку (без прив'язки до факультету)." };
        }
    } else {
        return { canManage: false, message: "Недостатньо прав." };
    }
    
    return { canManage: true };
};


export const createPreset = async (req, res) => {
    try {
        const { error, value } = presetSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: "Невірні дані для створення", details: error.details });
        }

        const { role, faculty_id: userFacultyId, dormitory_id: userDormitoryId } = req.user;

        if (role === 'faculty_dean_office') {
            if (!userFacultyId) return res.status(403).json({ error: "Деканат не прив'язаний до факультету." });
            // Декан може створювати налаштування тільки для свого факультету
            if (value.faculty_id && value.faculty_id !== userFacultyId) {
                return res.status(403).json({ error: "Деканат може створювати налаштування лише для свого факультету." });
            }
             if (!value.faculty_id) value.faculty_id = userFacultyId; // Примусово встановлюємо факультет
        }

        if (role === 'dorm_manager') {
            if (!userDormitoryId) return res.status(403).json({ error: "Коменданту не призначено гуртожиток для управління." });
            if (value.dormitory_id !== userDormitoryId) return res.status(403).json({ error: "Комендант може створювати налаштування лише для свого гуртожитку." });
            // Комендант створює лише глобальні пресети для свого гуртожитку
            value.faculty_id = null; 
        }
        
        const payloadToCreate = { ...value, created_by: req.user.userId };
        const presetId = await DormitoryApplicationPreset.create(payloadToCreate);
        const newPreset = await DormitoryApplicationPreset.findById(presetId);
        res.status(201).json({ message: "Налаштування створено", preset: newPreset });
    } catch (error) {
        console.error("[DAPresetController] Помилка створення налаштування:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Таке налаштування для гуртожитку, факультету (або без нього) та академ. року вже існує." });
        }
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};

export const updatePreset = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = presetSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: "Невірні дані для оновлення", details: error.details });
        }
        
        const existingPreset = await DormitoryApplicationPreset.findById(id);
        if (!existingPreset) return res.status(404).json({ error: "Налаштування не знайдено" });

        const { canManage, message } = await canUserManagePreset(req.user, existingPreset);
        if (!canManage) {
            return res.status(403).json({ error: message || "Недостатньо прав для оновлення цього налаштування." });
        }

        if (value.dormitory_id && !(await Dormitory.findById(value.dormitory_id))) return res.status(404).json({ error: "Гуртожиток не знайдено" });
        if (value.faculty_id && !(await Faculties.findById(value.faculty_id))) return res.status(404).json({ error: "Факультет не знайдено" });

        const updated = await DormitoryApplicationPreset.update(id, value);
        if (!updated) return res.status(500).json({ error: "Не вдалося оновити налаштування або дані не змінились" });
        
        const newPreset = await DormitoryApplicationPreset.findById(id);
        res.json({ message: "Налаштування оновлено", preset: newPreset });
    } catch (error) {
        console.error("[DAPresetController] Помилка оновлення налаштування:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Таке налаштування для гуртожитку, факультету (або без нього) та академ. року вже існує." });
        }
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};

export const getAllPresets = async (req, res) => {
    try {
        const schema = Joi.object({
            dormitory_id: Joi.string().allow('').optional(),
            faculty_id: Joi.string().allow('').optional(),
            academic_year: Joi.string().pattern(/^\d{4}-\d{4}$/).allow('').optional(),
            is_active: Joi.string().valid('true', 'false', '').allow('').optional(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            sortBy: Joi.string().valid('id', 'dormitory_name', 'faculty_name', 'academic_year', 'start_date', 'end_date', 'is_active').default('academic_year'),
            sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
        }).unknown(true);

        const { error, value: filters } = schema.validate(req.query);
        if (error) {
            return res.status(400).json({ error: "Невірні параметри фільтрації", details: error.details });
        }

        const effectiveFilters = { ...filters };
        const { role, faculty_id: userFacultyId, dormitory_id: userDormitoryId } = req.user;

        if (role === 'dorm_manager') {
            effectiveFilters.dormitory_id_for_filter = userDormitoryId;
        } else if (role === 'faculty_dean_office') {
            effectiveFilters.faculty_id_for_filter = userFacultyId;
        } else if (!['admin', 'superadmin'].includes(role)) {
            // Студенти та інші можуть бачити тільки активні пресети
             effectiveFilters.is_active = 'true';
        }
        
        const result = await DormitoryApplicationPreset.findAllWithFilters(effectiveFilters);
        res.json(result);
    } catch (error) {
        console.error("[DAPresetController] Помилка отримання налаштувань:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
};

export const getPresetById = async (req, res) => {
    try {
        const { id } = req.params;
        const preset = await DormitoryApplicationPreset.findById(id);
        if (!preset) {
            return res.status(404).json({ error: "Налаштування не знайдено" });
        }

        const { canManage, message } = await canUserManagePreset(req.user, preset);
        if (!canManage) {
            return res.status(403).json({ error: message || "Доступ до цього налаштування обмежено" });
        }

        res.json(preset);
    } catch (error) {
        console.error("[DAPresetController] Помилка отримання налаштування за ID:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
};

export const deletePreset = async (req, res) => {
    try {
        const { id } = req.params;
        const existingPreset = await DormitoryApplicationPreset.findById(id);
        if (!existingPreset) {
            return res.status(404).json({ error: "Налаштування не знайдено" });
        }
        
        const { canManage, message } = await canUserManagePreset(req.user, existingPreset);
        if (!canManage) {
            return res.status(403).json({ error: message || "Недостатньо прав для видалення цього налаштування." });
        }

        const deleted = await DormitoryApplicationPreset.delete(id);
        if (!deleted) {
            return res.status(404).json({ error: "Не вдалося видалити налаштування" });
        }
        res.json({ message: "Налаштування видалено" });
    } catch (error) {
        console.error("[DAPresetController] Помилка видалення налаштування:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
};

export const getPresetForDormitory = async (req, res) => {
    try {
        const { dormitoryId } = req.params;
        const { academic_year: academicYearQuery } = req.query;

        const academicYearSchema = Joi.string().pattern(/^\d{4}-\d{4}$/).required();
        const { error: yearError, value: academic_year } = academicYearSchema.validate(academicYearQuery);
        if (yearError) {
            return res.status(400).json({ error: "Невірний формат академічного року", details: yearError.details });
        }

        const preset = await DormitoryApplicationPreset.findByDormitoryAndAcademicYear(dormitoryId, academic_year, req.user.faculty_id);
        
        res.status(200).json(preset || null);
    } catch (error) {
        console.error("[DAPresetController] Помилка отримання налаштування для гуртожитку:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
};