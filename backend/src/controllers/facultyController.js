import pool from "../config/db.js";
import Faculties from "../models/Faculties.js";
import Joi from "joi";

export const createFaculty = async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().min(3).max(100).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Невірні дані", details: error.details });
    }

    const facultyId = await Faculties.create(value);
    const newFaculty = await Faculties.findById(facultyId);
    res.status(201).json({ message: "Факультет створено", faculty: newFaculty });
  } catch (error) {
    console.error("[FacultyController] Помилка створення факультету:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const getFaculties = async (req, res) => {
  try {
    const faculties = await Faculties.findAll();
    res.json(faculties);
  } catch (error) {
    console.error("[FacultyController] Помилка отримання факультетів:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const getFacultyById = async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await Faculties.findById(id);
    if (!faculty) {
      return res.status(404).json({ error: "Факультет не знайдено" });
    }
    res.json(faculty);
  } catch (error) {
    console.error("[FacultyController] Помилка отримання факультету:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.object({
      name: Joi.string().max(255).required(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Невірні дані", details: error.details });
    }

    const updated = await Faculties.update(id, value);
    if (!updated) {
      return res.status(404).json({ error: "Факультет не знайдено" });
    }
    res.json({ message: "Факультет оновлено" });
  } catch (error) {
    console.error("[FacultyController] Помилка оновлення факультету:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.number().integer().positive().required();
    const { error } = schema.validate(id);
    if (error) {
      return res.status(400).json({ error: "Невірний ID факультету", details: error.details });
    }

    const faculty = await Faculties.findById(id);
    if (!faculty) {
      return res.status(404).json({ error: "Факультет не знайдено" });
    }

    const deleted = await Faculties.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Факультет не знайдено" });
    }

    res.json({ message: "Факультет успішно видалено" });
  } catch (error) {
    console.error("[FacultyController] Помилка видалення факультету:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};