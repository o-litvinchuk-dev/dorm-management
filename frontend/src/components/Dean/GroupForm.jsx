import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "./styles/GroupForm.module.css"; // Потрібно створити або адаптувати ці стилі
import { useUser } from "../../contexts/UserContext";
import { CheckCircleIcon, XCircleIcon, AcademicCapIcon } from "@heroicons/react/24/outline";


const GroupForm = ({ group, onClose, onSuccess, facultyName, isLoadingForm }) => { // Додано isLoadingForm
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
      if (!user?.faculty_id && !(user?.role === 'admin' || user?.role === 'superadmin')) { // Адмін може додавати до будь-якого факультету, якщо faculty_id передається
        ToastService.error("Помилка", "Не вдалося визначити факультет.");
        setSubmitting(false);
        return;
      }
      const facultyIdToUse = group?.faculty_id || user?.faculty_id; // Якщо редагуємо, беремо faculty_id групи, інакше - поточного юзера

      const dataToSend = {
        name: values.name.trim(),
        course: parseInt(values.course, 10),
      };

      try {
        if (group?.id) {
          await api.put(`groups/${group.id}`, dataToSend);
          ToastService.success("Групу оновлено");
        } else {
          if (!facultyIdToUse) {
            ToastService.error("Помилка", "Факультет не визначено для створення групи.");
            setSubmitting(false);
            return;
          }
          await api.post(`faculties/${facultyIdToUse}/groups`, dataToSend);
          ToastService.success("Групу створено");
        }
        onSuccess();
        // onClose викликається з onSuccess в батьківському компоненті
      } catch (error) {
        ToastService.handleApiError(error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className={styles.modalInnerContent}>
        <div className={styles.modalHeader}>
             <h2 className={styles.modalTitle}>
                <AcademicCapIcon className={styles.modalTitleIcon}/>
                {group?.id ? `Редагувати групу "${group.name}"` : `Додати групу на факультет "${facultyName}"`}
            </h2>
        </div>
        <form onSubmit={formik.handleSubmit}>
            <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.inputLabel}>Назва групи *</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.name}
                        className={`${styles.inputField} ${formik.touched.name && formik.errors.name ? styles.inputError : ""}`}
                        disabled={isLoadingForm}
                        placeholder="Наприклад, КН-21001б"
                    />
                    {formik.touched.name && formik.errors.name ? (
                        <div className={styles.errorMessage}>{formik.errors.name}</div>
                    ) : null}
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="course" className={styles.inputLabel}>Курс *</label>
                    <input
                        id="course"
                        name="course"
                        type="number"
                        min="1"
                        max="6"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.course}
                        className={`${styles.inputField} ${formik.touched.course && formik.errors.course ? styles.inputError : ""}`}
                        disabled={isLoadingForm}
                    />
                    {formik.touched.course && formik.errors.course ? (
                        <div className={styles.errorMessage}>{formik.errors.course}</div>
                    ) : null}
                </div>
            </div>
            <div className={styles.modalFooter}>
                <button type="button" onClick={onClose} className={`${styles.formButton} ${styles.cancelButton}`} disabled={isLoadingForm}>
                    <XCircleIcon/> Скасувати
                </button>
                <button
                    type="submit"
                    disabled={isLoadingForm || formik.isSubmitting || !formik.dirty || !formik.isValid}
                    className={`${styles.formButton} ${styles.submitButton}`}
                >
                    <CheckCircleIcon/> {isLoadingForm || formik.isSubmitting ? "Збереження..." : (group?.id ? "Оновити" : "Створити")}
                </button>
            </div>
        </form>
    </div>
  );
};

export default GroupForm;