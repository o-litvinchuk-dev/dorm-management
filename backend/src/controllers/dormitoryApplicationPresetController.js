import Joi from "joi";
import DormitoryApplicationPreset from "../models/DormitoryApplicationPreset.js";
import Dormitory from "../models/Dormitory.js";
import Faculties from "../models/Faculties.js";

const presetSchema = Joi.object({
    dormitory_id: Joi.number().integer().positive().required(),
    faculty_id: Joi.number().integer().positive().allow(null),
    academic_year: Joi.string().pattern(/^\d{4}-\d{4}$/).required().messages({
        'string.pattern.base': 'Академічний рік має бути у форматі РРРР-РРРР (наприклад, 2024-2025)'
    }),
    start_date: Joi.date().iso().allow(null),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).allow(null).messages({
        'date.min': 'Дата закінчення повинна бути пізніше або такою ж, як дата початку'
    }),
    // application_date: Joi.date().iso().allow(null), // Видалено
    default_comments: Joi.string().max(1000).allow(null, ''),
});

export const createPreset = async (req, res) => {
    try {
        const { error, value } = presetSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: "Невірні дані", details: error.details });
        }

        if (value.faculty_id) {
            const faculty = await Faculties.findById(value.faculty_id);
            if (!faculty) return res.status(404).json({ error: "Факультет не знайдено" });
        }
        const dormitory = await Dormitory.findById(value.dormitory_id);
        if (!dormitory) return res.status(404).json({ error: "Гуртожиток не знайдено" });

        if (req.user.role === 'faculty_dean_office' && value.faculty_id !== req.user.faculty_id) {
            return res.status(403).json({ error: "Деканат може створювати налаштування лише для свого факультету." });
        }

        if (req.user.role === 'dorm_manager') {
            if (!req.user.dormitory_id) {
                return res.status(403).json({ error: "Коменданту не призначено гуртожиток для управління." });
            }
            if (value.dormitory_id !== req.user.dormitory_id) {
                return res.status(403).json({ error: "Комендант може створювати налаштування лише для свого гуртожитку." });
            }
            if (value.faculty_id !== null && value.faculty_id !== undefined) {
                 return res.status(403).json({ error: "Комендант створює глобальні налаштування для свого гуртожитку (факультет не вказується)." });
            }
            value.faculty_id = null;
        }

        const presetId = await DormitoryApplicationPreset.create({ ...value, created_by: req.user.userId });
        const newPreset = await DormitoryApplicationPreset.findById(presetId);
        res.status(201).json({ message: "Налаштування створено", preset: newPreset });
    } catch (error) {
        console.error("[DAPresetController] Помилка створення налаштування:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Таке налаштування для гуртожитку, факультету (або без нього) та академ. року вже існує." });
        }
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
        
        let preset = await DormitoryApplicationPreset.findByDormitoryAndAcademicYear(dormitoryId, academic_year);
        
        if (!preset) {
            return res.status(200).json(null); 
        }
        res.json(preset);
    } catch (error) {
        console.error("[DAPresetController] Помилка отримання налаштування:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
};

export const getAllPresets = async (req, res) => {
    try {
        let presets;
        if (req.user.role === 'faculty_dean_office') {
            presets = await DormitoryApplicationPreset.findByFacultyOrGlobal(req.user.faculty_id);
        } else if (req.user.role === 'admin' || req.user.role === 'superadmin') {
            presets = await DormitoryApplicationPreset.findAll();
        } else if (req.user.role === 'dorm_manager' && req.user.dormitory_id) {
            presets = await DormitoryApplicationPreset.findByDormitoryAndNotFacultySpecific(req.user.dormitory_id);
        }
         else {
            return res.status(403).json({ error: "Недостатньо прав для перегляду цих налаштувань" });
        }
        res.json(presets);
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

        if (req.user.role === 'faculty_dean_office' && preset.faculty_id !== req.user.faculty_id && preset.faculty_id !== null) {
            return res.status(403).json({ error: "Доступ до цього налаштування обмежено" });
        }
        
        if (req.user.role === 'dorm_manager') {
            if (!req.user.dormitory_id) {
                return res.status(403).json({ error: "Коменданту не призначено гуртожиток." });
            }
            if (preset.dormitory_id !== req.user.dormitory_id) {
                return res.status(403).json({ error: "Доступ обмежено. Це налаштування не для вашого гуртожитку." });
            }
            if (preset.faculty_id !== null) {
                return res.status(403).json({ error: "Комендант може переглядати лише глобальні налаштування для свого гуртожитку." });
            }
        }
        
        res.json(preset);
    } catch (error) {
        console.error("[DAPresetController] Помилка отримання налаштування за ID:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
};

export const updatePreset = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = presetSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: "Невірні дані", details: error.details });
        }

        const existingPreset = await DormitoryApplicationPreset.findById(id);
        if (!existingPreset) {
            return res.status(404).json({ error: "Налаштування не знайдено" });
        }

        if (req.user.role === 'faculty_dean_office') {
            if (existingPreset.faculty_id !== req.user.faculty_id && existingPreset.faculty_id !== null) {
                return res.status(403).json({ error: "Деканат може оновлювати лише налаштування свого факультету або глобальні." });
            }
            if (existingPreset.faculty_id !== null && value.faculty_id !== existingPreset.faculty_id) {
                 return res.status(403).json({ error: "Деканат не може змінювати приналежність факультет-специфічного налаштування." });
            }
             if (existingPreset.faculty_id === null && value.faculty_id && value.faculty_id !== req.user.faculty_id) {
                return res.status(403).json({ error: "Деканат може призначити глобальне налаштування лише своєму факультету." });
            }

        } else if (req.user.role === 'dorm_manager') {
            if (!req.user.dormitory_id) {
                return res.status(403).json({ error: "Коменданту не призначено гуртожиток." });
            }
            if (existingPreset.dormitory_id !== req.user.dormitory_id) {
                return res.status(403).json({ error: "Комендант може оновлювати лише налаштування свого гуртожитку." });
            }
            if (existingPreset.faculty_id !== null) { 
                return res.status(403).json({ error: "Комендант може оновлювати лише глобальні налаштування (без факультету) для свого гуртожитку." });
            }
            if (value.dormitory_id !== req.user.dormitory_id) {
                return res.status(403).json({ error: "Комендант не може змінювати гуртожиток для налаштування." });
            }
            if (value.faculty_id !== null && value.faculty_id !== undefined) { 
                return res.status(403).json({ error: "Комендант не може призначати факультет для налаштування. Воно має залишатись глобальним для гуртожитку." });
            }
            value.faculty_id = null;
        }


        if (value.faculty_id) {
            const faculty = await Faculties.findById(value.faculty_id);
            if (!faculty) return res.status(404).json({ error: "Факультет не знайдено" });
        }
        const dormitory = await Dormitory.findById(value.dormitory_id);
        if (!dormitory) return res.status(404).json({ error: "Гуртожиток не знайдено" });

        const updated = await DormitoryApplicationPreset.update(id, { ...value, created_by: req.user.userId });
        if (!updated) {
            return res.status(404).json({ error: "Не вдалося оновити налаштування" });
        }
        const newPreset = await DormitoryApplicationPreset.findById(id);
        res.json({ message: "Налаштування оновлено", preset: newPreset });
    } catch (error) {
        console.error("[DAPresetController] Помилка оновлення налаштування:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Таке налаштування для гуртожитку, факультету (або без нього) та академ. року вже існує." });
        }
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

        if (req.user.role === 'faculty_dean_office' && existingPreset.faculty_id !== req.user.faculty_id && existingPreset.faculty_id !== null) {
            return res.status(403).json({ error: "Деканат може видаляти лише налаштування свого факультету або глобальні (якщо вони були створені без факультету)." });
        } else if (req.user.role === 'dorm_manager') {
            if (!req.user.dormitory_id) {
                return res.status(403).json({ error: "Коменданту не призначено гуртожиток." });
            }
            if (existingPreset.dormitory_id !== req.user.dormitory_id) {
                return res.status(403).json({ error: "Комендант може видаляти лише налаштування свого гуртожитку." });
            }
            if (existingPreset.faculty_id !== null) { 
                return res.status(403).json({ error: "Комендант може видаляти лише глобальні налаштування (без факультету) для свого гуртожитку." });
            }
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