// frontend/src/components/Admin/AssignRoleModal.jsx
import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "./styles/AssignRoleModal.module.css";

const AssignRoleModal = ({ user, onClose, onSuccess }) => {
  const [faculties, setFaculties] = useState([]);
  const [dormitories, setDormitories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facultiesRes, dormitoriesRes] = await Promise.all([
          api.get("/api/v1/faculties"),
          api.get("/api/v1/admin/dormitories"),
        ]);
        setFaculties(facultiesRes.data);
        setDormitories(dormitoriesRes.data);
      } catch (error) {
        ToastService.handleApiError(error);
      }
    };
    fetchData();
  }, []);

  const validationSchema = Yup.object({
    role: Yup.string().required("Роль обов'язкова"),
    faculty_id: Yup.number().when("role", {
      is: (role) => ["faculty_dean_office", "student_council_head", "student_council_member"].includes(role),
      then: Yup.number().required("Факультет обов'язковий"),
    }),
    dormitory_id: Yup.number().when("role", {
      is: "dorm_manager",
      then: Yup.number().required("Гуртожиток обов'язковий"),
    }),
  });

  const formik = useFormik({
    initialValues: {
      role: user?.role || "",
      faculty_id: user?.faculty_id || "",
      dormitory_id: user?.dormitory_id || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await api.put(`/api/v1/users/${user.id}/role`, values);
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
        <h2>Призначити роль для {user.name}</h2>
        <div>
          <label>Роль</label>
          <select name="role" value={formik.values.role} onChange={formik.handleChange}>
            <option value="">Виберіть роль</option>
            {["student", "admin", "superadmin", "faculty_dean_office", "dorm_manager", "student_council_head", "student_council_member"].map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          {formik.errors.role && <div className={styles.error}>{formik.errors.role}</div>}
        </div>
        {["faculty_dean_office", "student_council_head", "student_council_member"].includes(formik.values.role) && (
          <div>
            <label>Факультет</label>
            <select name="faculty_id" value={formik.values.faculty_id} onChange={formik.handleChange}>
              <option value="">Виберіть факультет</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            {formik.errors.faculty_id && <div className={styles.error}>{formik.errors.faculty_id}</div>}
          </div>
        )}
        {formik.values.role === "dorm_manager" && (
          <div>
            <label>Гуртожиток</label>
            <select name="dormitory_id" value={formik.values.dormitory_id} onChange={formik.handleChange}>
              <option value="">Виберіть гуртожиток</option>
              {dormitories.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {formik.errors.dormitory_id && <div className={styles.error}>{formik.errors.dormitory_id}</div>}
          </div>
        )}
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

export default AssignRoleModal;