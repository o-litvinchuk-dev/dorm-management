import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "../../pages/Dean/styles/GroupsPage.module.css"; // Використання загальних стилів модалки
import { useUser } from "../../contexts/UserContext";

const GroupForm = ({ group, onClose, onSuccess, facultyName }) => {
  const { user } = useUser();

  const validationSchema = Yup.object({
    name: Yup.string()
      .required("Назва групи обов'язкова")
      .min(2, "Назва групи занадто коротка")
      .max(100, "Назва групи занадто довга"),
    course: Yup.number()
      .integer("Курс має бути цілим числом")
      .min(1, "Курс має бути від 1 до 6")
      .max(6, "Курс має бути від 1 до 6")
      .required("Курс обов'язковий"),
  });

  const formik = useFormik({
    initialValues: {
      name: group?.name || "",
      course: group?.course || "",
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      if (!user?.faculty_id) {
        ToastService.error("Помилка", "Не вдалося визначити факультет користувача.");
        setSubmitting(false);
        return;
      }

      const dataToSend = {
        name: values.name,
        course: parseInt(values.course, 10), // Переконуємось, що курс - це число
      };

      try {
        if (group?.id) {
          // Шлях відносний до baseURL, визначеного в api.js
          await api.put(`groups/${group.id}`, dataToSend);
          ToastService.success("Групу оновлено");
        } else {
          // Шлях відносний
          await api.post(`faculties/${user.faculty_id}/groups`, dataToSend);
          ToastService.success("Групу створено");
        }
        onSuccess();
        onClose();
      } catch (error) {
        ToastService.handleApiError(error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <form onSubmit={formik.handleSubmit} className={styles.form}> {/* Додав клас .form для можливої стилізації */}
          <h2>{group?.id ? `Редагувати групу "${group.name}"` : `Додати нову групу на факультет "${facultyName}"`}</h2>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Назва групи</label>
            <input
              id="name"
              name="name"
              type="text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.name}
              className={formik.touched.name && formik.errors.name ? styles.errorInput : ""}
            />
            {formik.touched.name && formik.errors.name ? (
              <div className={styles.error}>{formik.errors.name}</div>
            ) : null}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="course">Курс</label>
            <input
              id="course"
              name="course"
              type="number"
              min="1"
              max="6"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.course}
              className={formik.touched.course && formik.errors.course ? styles.errorInput : ""}
            />
            {formik.touched.course && formik.errors.course ? (
              <div className={styles.error}>{formik.errors.course}</div>
            ) : null}
          </div>

          <div className={styles.buttons}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Скасувати
            </button>
            <button 
              type="submit" 
              disabled={formik.isSubmitting || !formik.dirty || !formik.isValid} 
              className={styles.submitButton}
            >
              {formik.isSubmitting ? "Збереження..." : (group?.id ? "Оновити" : "Створити")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupForm;