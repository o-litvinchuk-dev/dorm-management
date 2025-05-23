// frontend/src/components/Dean/StudentCouncilForm.jsx
import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "./styles/StudentCouncilForm.module.css";
import { useUser } from "../../contexts/UserContext";

const StudentCouncilForm = ({ onClose, onSuccess }) => {
  const { user } = useUser();
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.get(`/api/v1/faculties/${user.faculty_id}/students`);
        setStudents(response.data);
      } catch (error) {
        ToastService.handleApiError(error);
      }
    };
    fetchStudents();
  }, [user.faculty_id]);

  const validationSchema = Yup.object({
    user_id: Yup.number().required("Студент обов'язковий"),
    role: Yup.string()
      .oneOf(["student_council_head", "student_council_member"])
      .required("Роль обов'язкова"),
  });

  const formik = useFormik({
    initialValues: {
      user_id: "",
      role: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await api.put(`/api/v1/users/${values.user_id}/role`, {
          role: values.role,
          faculty_id: user.faculty_id,
        });
        ToastService.success("Роль призначено");
        onSuccess();
        onClose();
      } catch (error) {
        ToastService.handleApiError(error);
      }
    },
  });

  return (
    <div className={styles.modal}>
      <form onSubmit={formik.handleSubmit} className={styles.form}>
        <h2>Призначити студраду</h2>
        <div>
          <label>Студент</label>
          <select name="user_id" value={formik.values.user_id} onChange={formik.handleChange}>
            <option value="">Виберіть студента</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
          {formik.errors.user_id && <div className={styles.error}>{formik.errors.user_id}</div>}
        </div>
        <div>
          <label>Роль</label>
          <select name="role" value={formik.values.role} onChange={formik.handleChange}>
            <option value="">Виберіть роль</option>
            <option value="student_council_head">Голова студради</option>
            <option value="student_council_member">Член студради</option>
          </select>
          {formik.errors.role && <div className={styles.error}>{formik.errors.role}</div>}
        </div>
        <div className={styles.buttons}>
          <button type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? "Збереження..." : "Зберегти"}
          </button>
          <button type="button" onClick={onClose}>
            Скасувати
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentCouncilForm;