import Joi from "joi";
import DormApplication from "../models/DormApplication.js";
import AccommodationApplication from "../models/AccommodationApplication.js";

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
      res.status(500).json({ error: "Помилка при поданні заявки" });
    }
};

export const submitAccommodationApplication = async (req, res) => {
    try {
        console.log("[AccommodationApplication] Received request from user:", req.user.userId);

        // Define validation schema using Joi
        const schema = Joi.object({
            course: Joi.number().integer().min(1).max(6).required(),
            group: Joi.string().min(1).required(),
            faculty: Joi.string().min(1).required(),
            fullName: Joi.string().min(1).required(),
            surname: Joi.string().min(1).required(),
            residentPhone: Joi.string().pattern(/^\+380\d{9}$/).required(),
            dormNumber: Joi.number().integer().positive().required(),
            startDay: Joi.string().pattern(/^(0[1-9]|[12]\d|3[01])$/).required(),
            startMonth: Joi.string().pattern(/^(0[1-9]|1[0-2])$/).required(),
            startYear: Joi.string().pattern(/^\d{2}$/).required(),
            endDay: Joi.string().pattern(/^(0[1-9]|[12]\d|3[01])$/).required(),
            endMonth: Joi.string().pattern(/^(0[1-9]|1[0-2])$/).required(),
            endYear: Joi.string().pattern(/^\d{2}$/).required(),
            applicationDay: Joi.string().pattern(/^(0[1-9]|[12]\d|3[01])$/).required(),
            applicationMonth: Joi.string().pattern(/^(0[1-9]|1[0-2])$/).required(),
            applicationYear: Joi.string().pattern(/^\d{2}$/).required(),
        });

        // Validate incoming request body
        const { error, value } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errorDetails = error.details.map(detail => detail.message);
            return res.status(400).json({ error: "Validation failed", details: errorDetails });
        }

        // Combine date parts into YYYY-MM-DD format (assume 20YY for YY years)
        const startDateStr = `20${value.startYear}-${value.startMonth}-${value.startDay}`;
        const endDateStr = `20${value.endYear}-${value.endMonth}-${value.endDay}`;
        const applicationDateStr = `20${value.applicationYear}-${value.applicationMonth}-${value.applicationDay}`;

        // Validate combined dates
        const isValidDate = (dateStr) => {
            const date = new Date(dateStr);
            return !isNaN(date) && date.toISOString().startsWith(dateStr);
        };

        if (!isValidDate(startDateStr) || !isValidDate(endDateStr) || !isValidDate(applicationDateStr)) {
            return res.status(400).json({ error: "Invalid date provided" });
        }

        // Ensure startDate is before or equal to endDate
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        if (startDate > endDate) {
            return res.status(400).json({ error: "Start date must be before or equal to end date" });
        }

        // Prepare data for database insertion
        const applicationData = {
            user_id: req.user.userId,
            course: value.course,
            group_name: value.group,
            faculty: value.faculty,
            full_name: value.fullName,
            phone_number: value.residentPhone,
            dorm_number: value.dormNumber,
            start_date: startDateStr,
            end_date: endDateStr,
            application_date: applicationDateStr,
            surname: value.surname,
        };

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
        res.status(500).json({ error: "Server error" });
    }
};

export default {
    getServices,
    createDormApplication,
    submitAccommodationApplication
};