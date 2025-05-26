import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "./styles/BatchGroupForm.module.css"; // Потрібно створити або адаптувати ці стилі
import { CheckCircleIcon, XCircleIcon, ListBulletIcon } from "@heroicons/react/24/outline";

const BatchGroupForm = ({ onClose, onSuccess, facultyName, facultyId }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState([]);

  const formik = useFormik({
    initialValues: {
      groupsText: "",
    },
    validationSchema: Yup.object({
      groupsText: Yup.string().required("Список груп не може бути порожнім."),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      if (!facultyId) {
        ToastService.error("Помилка", "Не вдалося визначити факультет для додавання груп.");
        setIsProcessing(false);
        setSubmitting(false);
        return;
      }
      setIsProcessing(true);
      setResults([]);
      const lines = values.groupsText.split('\n').map(line => line.trim()).filter(line => line !== "");
      const newResults = [];
      let allSuccessful = true;
      let anyProcessed = false;

      for (const line of lines) {
        anyProcessed = true;
        const parts = line.split(',').map(part => part.trim());
        if (parts.length !== 2) {
          newResults.push({ line, success: false, message: "Невірний формат (очікується 'Назва групи, Курс')." });
          allSuccessful = false;
          continue;
        }
        const [name, courseStr] = parts;
        const course = parseInt(courseStr, 10);
        if (!name || name.length < 2 || name.length > 100 || isNaN(course) || course < 1 || course > 6) {
          newResults.push({ line, success: false, message: "Невірні дані групи (назва: 2-100 симв., курс: 1-6)." });
          allSuccessful = false;
          continue;
        }
        try {
          await api.post(`faculties/${facultyId}/groups`, { name, course });
          newResults.push({ line, success: true, message: `Групу "${name}" (курс ${course}) успішно додано.` });
        } catch (error) {
          allSuccessful = false;
          let errorMessage = "Помилка сервера.";
          if (error.response?.data?.code === 'ER_DUP_ENTRY' || (error.response?.data?.error && error.response.data.error.includes('вже існує'))) {
            errorMessage = `Група "${name}" (курс ${course}) вже існує.`;
          } else if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
            errorMessage = error.response.data.details.map(d => d.message || d).join(', ');
          } else if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error.message) {
            errorMessage = error.message;
          }
          newResults.push({ line, success: false, message: errorMessage });
        }
      }
      setResults(newResults);
      setIsProcessing(false);
      setSubmitting(false);

      if (anyProcessed) {
        onSuccess(); // Оновлюємо список груп у батьківському компоненті
        if (allSuccessful) {
          ToastService.success("Успіх", "Усі вказані групи успішно оброблені.");
          resetForm(); // Очищаємо форму, якщо все успішно
        } else {
          ToastService.warning("Увага", "Деякі групи не вдалося додати. Перевірте результати.");
        }
      } else {
        ToastService.info("Інформація", "Не було введено жодної групи для додавання.");
      }
    },
  });

  return (
    <div className={styles.modalInnerContent}>
        <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>
                <ListBulletIcon className={styles.modalTitleIcon}/>
                Пакетне додавання груп на факультет "{facultyName}"
            </h2>
        </div>
      <form onSubmit={formik.handleSubmit}>
        <div className={styles.modalBody}>
            <p className={styles.instructions}>
            Введіть кожну групу з нового рядка у форматі: <strong>Назва групи, Курс</strong>
            <br />
            Наприклад:
            <br />
            КН-24001б, 1<br />
            ІПЗ-23001б, 2
            </p>
            <div className={styles.formGroup}>
                <label htmlFor="groupsText" className={styles.inputLabel}>Список груп:</label>
                <textarea
                    id="groupsText"
                    name="groupsText"
                    rows="8" // Зменшено для кращого вигляду
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.groupsText}
                    className={`${styles.textareaField} ${formik.touched.groupsText && formik.errors.groupsText ? styles.inputError : ""}`}
                    placeholder="КН-24001б, 1
КН-24002б, 1
ІПЗ-23001б, 2..."
                    disabled={isProcessing}
                />
                {formik.touched.groupsText && formik.errors.groupsText ? (
                    <div className={styles.errorMessage}>{formik.errors.groupsText}</div>
                ) : null}
            </div>
            {results.length > 0 && (
                <div className={styles.resultsContainer}>
                    <h4>Результати обробки:</h4>
                    <ul>
                    {results.map((result, index) => (
                        <li key={index} className={result.success ? styles.resultSuccess : styles.resultError}>
                        <strong>{result.line}:</strong> {result.message}
                        </li>
                    ))}
                    </ul>
                </div>
            )}
        </div>
        <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={`${styles.formButton} ${styles.cancelButton}`} disabled={isProcessing}>
                <XCircleIcon/> Закрити
            </button>
            <button
                type="submit"
                disabled={isProcessing || !formik.isValid || !formik.dirty || (formik.dirty && !formik.values.groupsText.trim())}
                className={`${styles.formButton} ${styles.submitButton}`}
            >
                 <CheckCircleIcon/> {isProcessing ? "Обробка..." : "Додати групи"}
            </button>
        </div>
      </form>
    </div>
  );
};

export default BatchGroupForm;