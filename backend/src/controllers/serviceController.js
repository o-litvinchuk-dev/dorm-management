import Joi from "joi";
import DormApplication from "../models/DormApplication.js";
import AccommodationApplication from "../models/AccommodationApplication.js"; // Переконайся, що імпорт правильний

// Існуюча функція
export const getServices = (req, res) => {
    const services = [
        {
            id: 1,
            name: "Поселення в гуртожиток",
            description: "Подайте заявку на поселення в гуртожиток.",
            route: "/services/settlement",
        },
        {
            id: 2,
            name: "Створення контракту на поселення",
            description: "Створіть контракт для поселення в гуртожиток.",
            route: "/services/contract",
        },
    ];
    res.json(services);
};

// Існуюча функція
export const createDormApplication = async (req, res) => {
    try {
      const { name, surname, faculty, course } = req.body;
      const user_id = req.user.userId;

      if (!name || !surname || !faculty || !course) {
        return res.status(400).json({ error: "Усі поля обов’язкові" });
      }

      const applicationId = await DormApplication.create({
        user_id,
        name,
        surname,
        faculty,
        course,
      });
      res.status(201).json({ message: "Заявка успішно подана", applicationId });
    } catch (error) {
      console.error("[createDormApplication] Error:", error); // Додано логування помилки
      res.status(500).json({ error: "Помилка при поданні заявки" });
    }
};

// Оновлена функція
export const submitAccommodationApplication = async (req, res) => {
    try {
        console.log("[AccommodationApplication] Received request from user:", req.user.userId);
        
        // Перевіряємо, чи є faculty_id у користувача
        if (!req.user.faculty_id) {
            console.error("[AccommodationApplication] User faculty_id is missing for user:", req.user.userId);
            return res.status(400).json({ error: "Faculty ID is missing for the user. Please complete your profile." });
        }

        // Define validation schema using Joi
        const schema = Joi.object({
            course: Joi.number().integer().min(1).max(6).required(),
            group: Joi.string().min(1).required(), // Це буде group_name
            // faculty: Joi.string().min(1).required(), // Видалено, faculty_id береться з req.user
            fullName: Joi.string().min(1).required(),
            surname: Joi.string().min(1).required(),
            residentPhone: Joi.string().pattern(/^\+380\d{9}$/).required(), // Це буде phone_number
            dormNumber: Joi.number().integer().positive().required(), // Це буде dormitory_id
            startDay: Joi.string().pattern(/^(0[1-9]|[12]\d|3[01])$/).required(),
            startMonth: Joi.string().pattern(/^(0[1-9]|1[0-2])$/).required(),
            startYear: Joi.string().pattern(/^\d{2}$/).required(), // Припускаємо YY формат (наприклад, 24 для 2024)
            endDay: Joi.string().pattern(/^(0[1-9]|[12]\d|3[01])$/).required(),
            endMonth: Joi.string().pattern(/^(0[1-9]|1[0-2])$/).required(),
            endYear: Joi.string().pattern(/^\d{2}$/).required(), // Припускаємо YY формат
            applicationDay: Joi.string().pattern(/^(0[1-9]|[12]\d|3[01])$/).required(),
            applicationMonth: Joi.string().pattern(/^(0[1-9]|1[0-2])$/).required(),
            applicationYear: Joi.string().pattern(/^\d{2}$/).required(), // Припускаємо YY формат
        });

        // Validate incoming request body
        // Видаляємо faculty з req.body перед валідацією, якщо воно там є, оскільки ми беремо faculty_id з req.user
        const { faculty, ...validationData } = req.body;
        const { error, value } = schema.validate(validationData, { abortEarly: false });

        if (error) {
            const errorDetails = error.details.map(detail => detail.message);
            console.error("[AccommodationApplication] Validation error:", errorDetails);
            return res.status(400).json({ error: "Validation failed", details: errorDetails });
        }
        
        // Combine date parts into YYYY-MM-DD format (assume 20YY for YY years)
        const startDateStr = `20${value.startYear}-${value.startMonth}-${value.startDay}`;
        const endDateStr = `20${value.endYear}-${value.endMonth}-${value.endDay}`;
        const applicationDateStr = `20${value.applicationYear}-${value.applicationMonth}-${value.applicationDay}`;

        // Validate combined dates
        const isValidDate = (dateStr) => {
            const date = new Date(dateStr);
            // Перевіряємо, чи дата валідна і чи відповідає рядок формату YYYY-MM-DD
            return !isNaN(date) && date.toISOString().startsWith(dateStr.substring(0,10));
        };

        if (!isValidDate(startDateStr) || !isValidDate(endDateStr) || !isValidDate(applicationDateStr)) {
            console.error("[AccommodationApplication] Invalid date format after construction:", {startDateStr, endDateStr, applicationDateStr});
            return res.status(400).json({ error: "Invalid date provided" });
        }

        // Ensure startDate is before or equal to endDate
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        if (startDate > endDate) {
            console.error("[AccommodationApplication] Start date is after end date");
            return res.status(400).json({ error: "Start date must be before or equal to end date" });
        }

        // Prepare data for database insertion
        const applicationData = {
            user_id: req.user.userId,
            course: value.course,
            group_name: value.group, // Поле в БД group_name
            faculty_id: req.user.faculty_id, // Беремо faculty_id з аутентифікованого користувача
            full_name: value.fullName,
            phone_number: value.residentPhone, // Поле в БД phone_number
            dormitory_id: value.dormNumber, // Це ID гуртожитку
            start_date: startDateStr,
            end_date: endDateStr,
            application_date: applicationDateStr,
            surname: value.surname,
            status: 'pending' // Додаємо статус за замовчуванням
        };
        
        console.log("[AccommodationApplication] Data to be created:", applicationData);

        // Insert into database and get the new application ID
        const applicationId = await AccommodationApplication.create(applicationData);

        // Return success response
        res.status(201).json({
            success: true,
            message: "Application submitted successfully",
            applicationId,
        });
    } catch (error) {
        console.error("[AccommodationApplication] Error:", error);
        // Додамо більш детальне логування помилки, якщо вона не від Joi
        if (!error.details) {
            console.error("Error stack:", error.stack);
        }
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

export default {
    getServices,
    createDormApplication,
    submitAccommodationApplication
};