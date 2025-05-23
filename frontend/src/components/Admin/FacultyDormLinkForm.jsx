// frontend/src/components/Admin/FacultyDormLinkForm.jsx
import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "./styles/FacultyDormLinkForm.module.css";

const FacultyDormLinkForm = ({ link, onClose, onSuccess }) => {
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
    faculty_id: Yup.number().required("Факультет обов'язковий"),
    dormitory_id: Yup.number().required("Гуртожиток обов'язковий"),
    quota: Yup.number().min(1, "Квота має бути більше 0").required("Квота обов'язкова"),
  });

  const formik = useFormik({
    initialValues: {
      faculty_id: link?.faculty_id || "",
      dormitory_id: link?.dormitory_id || "",
      quota: link?.quota || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (link) {
          await api.put(`/api/v1/faculty-dormitories/${link.faculty_id}/${link.dormitory_id}`, values);
          ToastService.success("Зв'язок оновлено");
        } else {
          await api.post("/api/v1/faculty-dormitories", values);
          ToastService.success("Зв'язок створено");
        }
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
        <h2>{link ? "Редагувати зв'язок" : "Додати зв'язок"}</h2>
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
        <div>
          <label>Квота</label>
          <input
            type="number"
            name="quota"
            value={formik.values.quota}
            onChange={formik.handleChange}
            className={formik.errors.quota ? styles.errorInput : ""}
          />
          {formik.errors.quota && <div className={styles.error}>{formik.errors.quota}</div>}
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

export default FacultyDormLinkForm;