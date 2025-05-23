// frontend/src/components/Admin/FacultyForm.jsx
import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "./styles/FacultyForm.module.css";

const FacultyForm = ({ faculty, onClose, onSuccess }) => {
  const validationSchema = Yup.object({
    name: Yup.string()
      .required("Назва факультету обов'язкова")
      .min(2, "Назва занадто коротка"),
  });

  const formik = useFormik({
    initialValues: {
      name: faculty?.name || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (faculty?.id) {
          await api.put(`/api/v1/faculties/${faculty.id}`, values);
          ToastService.success("Факультет оновлено");
        } else {
          await api.post("/api/v1/faculties", values);
          ToastService.success("Факультет створено");
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
        <h2>{faculty?.id ? "Редагувати факультет" : "Додати факультет"}</h2>
        <div>
          <label>Назва</label>
          <input
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            className={formik.errors.name ? styles.errorInput : ""}
          />
          {formik.errors.name && <div className={styles.error}>{formik.errors.name}</div>}
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

export default FacultyForm;