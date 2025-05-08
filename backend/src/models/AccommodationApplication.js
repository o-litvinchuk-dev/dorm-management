import pool from "../config/db.js";

const AccommodationApplication = {
    async create(data) {
        const {
            user_id,
            course,
            group_name,
            faculty,
            full_name,
            phone_number,
            dorm_number,
            start_date,
            end_date,
            application_date,
            surname,
        } = data;

        const [result] = await pool.execute(
            `INSERT INTO accommodation_applications 
            (user_id, course, group_name, faculty, full_name, phone_number, dorm_number, start_date, end_date, application_date, surname) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user_id,
                course,
                group_name,
                faculty,
                full_name,
                phone_number,
                dorm_number,
                start_date,
                end_date,
                application_date,
                surname,
            ]
        );
        return result.insertId;
    },
};

export default AccommodationApplication;