// backend/src/controllers/GroupController.js
import Joi from "joi";
import Group from "../models/Group.js";
import pool from "../config/db.js";

export const createGroup = async (req, res) => {
  try {
    const { facultyId: facultyIdFromParams } = req.params;
    const { name, course } = req.body;

    const numericFacultyId = parseInt(facultyIdFromParams, 10);
    if (isNaN(numericFacultyId)) {
        return res.status(400).json({ error: "Невірний ID факультету в URL." });
    }
    
    if (req.user.role === "faculty_dean_office" && req.user.faculty_id !== numericFacultyId) {
      return res.status(403).json({ error: "Доступ заборонено: ви не можете додавати групи до чужого факультету." });
    }
    
    const schema = Joi.object({
      name: Joi.string().min(2).max(100).required().messages({
        "string.empty": "Назва групи не може бути порожньою.",
        "string.min": "Назва групи повинна містити щонайменше 2 символи.",
        "string.max": "Назва групи не може перевищувати 100 символів.",
        "any.required": "Назва групи є обов'язковою.",
      }),
      course: Joi.number().integer().min(1).max(6).required().messages({
        "number.base": "Курс має бути числом.",
        "number.integer": "Курс має бути цілим числом.",
        "number.min": "Курс має бути не менше 1.",
        "number.max": "Курс має бути не більше 6.",
        "any.required": "Курс є обов'язковим.",
      }),
    });

    const { error, value } = schema.validate({ name, course });
    if (error) {
      return res.status(400).json({ error: "Невірні дані", details: error.details.map(d => d.message) });
    }

    // Перевірка на унікальність (назва + курс для даного факультету)
    const [existingGroup] = await pool.query(
      "SELECT id FROM \`groups\` WHERE faculty_id = ? AND name = ? AND course = ?",
      [numericFacultyId, value.name, value.course]
    );

    if (existingGroup.length > 0) {
      return res.status(409).json({ error: `Група "${value.name}" для ${value.course} курсу вже існує на цьому факультеті.` });
    }

    const groupId = await Group.create({ faculty_id: numericFacultyId, name: value.name, course: value.course });
    const newGroup = await Group.findById(groupId);
    res.status(201).json({ message: "Групу створено", group: newGroup });
  } catch (error) {
    console.error("[GroupController] Помилка створення групи:", error);
    // Загальна обробка помилки, якщо це не дублікат або відома помилка FK
    if (error.code !== 'ER_DUP_ENTRY' && !(error.code === 'ER_NO_REFERENCED_ROW_2' && error.sqlMessage.includes('faculty_id'))) {
        res.status(500).json({ error: "Помилка сервера" });
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2' && error.sqlMessage.includes('faculty_id')) {
        res.status(400).json({ error: "Вказаний факультет не існує." });
    }
    // Помилка ER_DUP_ENTRY вже обробляється вище явною перевіркою
  }
};

// ... (getGroups, updateGroup, deleteGroup залишаються такими ж, як у попередній відповіді)
export const getGroups = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const numericFacultyId = parseInt(facultyId, 10);

    if (isNaN(numericFacultyId)) {
      return res.status(400).json({ error: "Невірний ID факультету." });
    }
    if (req.user.role === "faculty_dean_office" && req.user.faculty_id !== numericFacultyId) {
      return res.status(403).json({ error: "Доступ обмежено: ви можете переглядати групи тільки свого факультету." });
    }

    const groups = await Group.findAllByFacultyId(numericFacultyId);
    res.json(groups);
  } catch (error) {
    console.error("[GroupController] Помилка отримання груп:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const numericGroupId = parseInt(id, 10);
    const { name, course } = req.body;

    if (isNaN(numericGroupId)) {
        return res.status(400).json({ error: "Невірний ID групи." });
    }

    const schema = Joi.object({
      name: Joi.string().min(2).max(100).required().messages({
        "string.empty": "Назва групи не може бути порожньою.",
        "string.min": "Назва групи повинна містити щонайменше 2 символи.",
        "string.max": "Назва групи не може перевищувати 100 символів.",
        "any.required": "Назва групи є обов'язковою.",
      }),
      course: Joi.number().integer().min(1).max(6).required().messages({
         "number.base": "Курс має бути числом.",
        "number.integer": "Курс має бути цілим числом.",
        "number.min": "Курс має бути не менше 1.",
        "number.max": "Курс має бути не більше 6.",
        "any.required": "Курс є обов'язковим.",
      }),
    });
    const { error, value } = schema.validate({ name, course });
    if (error) {
      return res.status(400).json({ error: "Невірні дані", details: error.details.map(d => d.message) });
    }

    const group = await Group.findById(numericGroupId);
    if (!group) {
      return res.status(404).json({ error: "Групу не знайдено" });
    }

    if (req.user.role === "faculty_dean_office" && req.user.faculty_id !== group.faculty_id) {
      return res.status(403).json({ error: "Доступ обмежено: ви можете редагувати групи тільки свого факультету." });
    }
    
    // Перевірка на унікальність при оновленні (якщо назва або курс змінилися)
    if (name !== group.name || course !== group.course) {
        const [existingGroup] = await pool.query(
          "SELECT id FROM \`groups\` WHERE faculty_id = ? AND name = ? AND course = ? AND id != ?",
          [group.faculty_id, value.name, value.course, numericGroupId]
        );
        if (existingGroup.length > 0) {
          return res.status(409).json({ error: `Група "${value.name}" для ${value.course} курсу вже існує на цьому факультеті.` });
        }
    }


    const updated = await Group.update(numericGroupId, { name: value.name, course: value.course });
    if (!updated) {
      return res.status(404).json({ error: "Групу не знайдено або не вдалося оновити" });
    }
    const updatedGroup = await Group.findById(numericGroupId);
    res.json({ message: "Групу оновлено", group: updatedGroup });
  } catch (error) {
    console.error("[GroupController] Помилка оновлення групи:", error);
    if (error.code === 'ER_DUP_ENTRY') { // Ця перевірка може бути зайвою, якщо попередня спрацює
        return res.status(409).json({ error: "Група з такою назвою та курсом вже існує на цьому факультеті."});
    }
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const numericGroupId = parseInt(id, 10);

    if (isNaN(numericGroupId)) {
        return res.status(400).json({ error: "Невірний ID групи." });
    }

    const group = await Group.findById(numericGroupId);
    if (!group) {
      return res.status(404).json({ error: "Групу не знайдено" });
    }

    if (req.user.role === "faculty_dean_office" && req.user.faculty_id !== group.faculty_id) {
      return res.status(403).json({ error: "Доступ обмежено: ви можете видаляти групи тільки свого факультету." });
    }
    
    const [studentsInGroup] = await pool.query(
        `SELECT COUNT(*) as count FROM \`user_profiles\` WHERE group_id = ?`,
        [numericGroupId]
    );
    if (studentsInGroup[0].count > 0) {
        return res.status(409).json({ error: "Неможливо видалити групу, оскільки в ній є студенти. Спочатку переведіть або видаліть студентів." });
    }

    const [applicationsWithGroup] = await pool.query(
        `SELECT COUNT(*) as count FROM \`accommodation_applications\` WHERE group_id = ?`,
        [numericGroupId]
    );
    if (applicationsWithGroup[0].count > 0) {
        return res.status(409).json({ error: "Неможливо видалити групу, оскільки вона використовується в заявках на поселення." });
    }

    const deleted = await Group.delete(numericGroupId);
    if (!deleted) {
      return res.status(404).json({ error: "Групу не знайдено або не вдалося видалити" });
    }
    res.json({ message: "Групу видалено" });
  } catch (error) {
    console.error("[GroupController] Помилка видалення групи:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};