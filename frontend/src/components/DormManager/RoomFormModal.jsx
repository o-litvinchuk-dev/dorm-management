import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../utils/api';
import { ToastService } from '../../utils/toastConfig';
import styles from './styles/RoomFormModal.module.css'; // Нові стилі для цього компонента
import { CheckCircleIcon, XCircleIcon, BuildingLibraryIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const RoomFormModal = ({ dormitoryId, room, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationSchema = Yup.object({
    number: Yup.string()
      .trim()
      .min(1, "Номер не може бути порожнім")
      .max(10, "Максимум 10 символів для номера")
      .required("Номер кімнати обов'язковий"),
    capacity: Yup.number()
      .integer("Місткість має бути цілим числом")
      .min(1, "Місткість має бути принаймні 1")
      .max(10, "Максимальна місткість 10 осіб")
      .required("Місткість обов'язкова")
      .when('occupied_places', (occupied_places, schema) => { // occupied_places тут для прикладу, якщо б ми його передавали
          return occupied_places && occupied_places > 0
            ? schema.min(occupied_places, `Місткість не може бути меншою за кількість зайнятих місць (${occupied_places})`)
            : schema;
      }),
    floor: Yup.number()
      .integer("Поверх має бути цілим числом")
      .min(0, "Поверх не може бути від'ємним (0 - цокольний)")
      .max(20, "Максимальний поверх - 20") // Приклад обмеження
      .nullable()
      .transform((value, originalValue) => originalValue === "" ? null : value),
    gender_type: Yup.string()
      .oneOf(['any', 'male', 'female', 'mixed'], "Невірний тип статі")
      .required("Тип статі обов'язковий"),
    description: Yup.string().trim().max(500, "Опис занадто довгий (макс. 500 символів)").nullable(),
    is_reservable: Yup.boolean().required("Вкажіть, чи доступна кімната для резервування"),
  });

  const formik = useFormik({
    initialValues: {
      number: room?.number || '',
      capacity: room?.capacity || '',
      floor: room?.floor === null || room?.floor === undefined ? '' : String(room.floor), // Перетворюємо в рядок для інпуту
      gender_type: room?.gender_type || 'any',
      description: room?.description || '',
      is_reservable: room?.is_reservable === undefined ? true : Boolean(room.is_reservable),
      occupied_places: room?.occupied_places || 0, // Додано для валідації місткості
    },
    validationSchema,
    enableReinitialize: true, // Дозволяє формі оновлюватись, якщо пропс `room` змінюється
    onSubmit: async (values) => {
      setIsSubmitting(true);
      const payload = {
        ...values,
        floor: values.floor === '' ? null : Number(values.floor),
        capacity: Number(values.capacity),
        is_reservable: Boolean(values.is_reservable), // Переконуємось, що це boolean
      };
      // Видаляємо occupied_places, якщо воно не потрібне для API створення/оновлення
      delete payload.occupied_places;

      try {
        if (room?.id) {
          await api.put(`/rooms/${room.id}`, payload);
          ToastService.success('Кімнату успішно оновлено');
        } else {
          await api.post(`/dormitories/${dormitoryId}/rooms`, payload);
          ToastService.success('Кімнату успішно створено');
        }
        onSuccess(); // Викликаємо для оновлення списку та закриття модалки
      } catch (error) {
        ToastService.handleApiError(error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Оновлення кількості зайнятих місць, якщо редагується існуюча кімната
  useEffect(() => {
    if (room && room.occupied_places !== undefined) {
      formik.setFieldValue('occupied_places', room.occupied_places);
    }
  }, [room]);


  return (
    // Використовуємо структуру, подібну до ApplicationDetailModal
    <div className={styles.modalInnerContent}>
        <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>
                <BuildingLibraryIcon className={styles.modalTitleIcon} />
                {room?.id ? `Редагувати кімнату №${room.number}` : 'Створити нову кімнату'}
            </h2>
        </div>
        <form onSubmit={formik.handleSubmit}>
            <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label htmlFor="number" className={styles.inputLabel}>Номер кімнати *</label>
                        <input
                            id="number"
                            name="number"
                            type="text"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.number}
                            className={`${styles.inputField} ${formik.touched.number && formik.errors.number ? styles.inputError : ""}`}
                            placeholder="Наприклад, 101А"
                        />
                        {formik.touched.number && formik.errors.number ? (
                            <div className={styles.errorMessage}>{formik.errors.number}</div>
                        ) : null}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="capacity" className={styles.inputLabel}>Місткість (осіб) *</label>
                        <input
                            id="capacity"
                            name="capacity"
                            type="number"
                            min="1"
                            max="10"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.capacity}
                            className={`${styles.inputField} ${formik.touched.capacity && formik.errors.capacity ? styles.inputError : ""}`}
                        />
                        {formik.touched.capacity && formik.errors.capacity ? (
                            <div className={styles.errorMessage}>{formik.errors.capacity}</div>
                        ) : null}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="floor" className={styles.inputLabel}>Поверх</label>
                        <input
                            id="floor"
                            name="floor"
                            type="number"
                            min="0"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.floor}
                            className={`${styles.inputField} ${formik.touched.floor && formik.errors.floor ? styles.inputError : ""}`}
                            placeholder="Наприклад, 3"
                        />
                        {formik.touched.floor && formik.errors.floor ? (
                            <div className={styles.errorMessage}>{formik.errors.floor}</div>
                        ) : null}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="gender_type" className={styles.inputLabel}>Тип по статі *</label>
                        <select
                            id="gender_type"
                            name="gender_type"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.gender_type}
                            className={`${styles.selectField} ${formik.touched.gender_type && formik.errors.gender_type ? styles.inputError : ""}`}
                        >
                            <option value="any">Будь-яка</option>
                            <option value="male">Чоловіча</option>
                            <option value="female">Жіноча</option>
                            <option value="mixed">Змішана</option>
                        </select>
                        {formik.touched.gender_type && formik.errors.gender_type ? (
                            <div className={styles.errorMessage}>{formik.errors.gender_type}</div>
                        ) : null}
                    </div>
                </div> {/* Кінець formGrid */}

                <div className={styles.formGroup}>
                    <label htmlFor="description" className={styles.inputLabel}>Опис кімнати</label>
                    <textarea
                        id="description"
                        name="description"
                        rows="3"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.description}
                        className={`${styles.textareaField} ${formik.touched.description && formik.errors.description ? styles.inputError : ""}`}
                        placeholder="Додаткова інформація про кімнату, особливості..."
                    />
                    {formik.touched.description && formik.errors.description ? (
                        <div className={styles.errorMessage}>{formik.errors.description}</div>
                    ) : null}
                </div>

                <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
                    <input
                        id="is_reservable"
                        name="is_reservable"
                        type="checkbox"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        checked={formik.values.is_reservable}
                        className={styles.checkboxInput}
                    />
                    <label htmlFor="is_reservable" className={styles.checkboxLabel}>
                        Кімната доступна для онлайн-бронювання студентами
                    </label>
                </div>

                {room && room.occupied_places > 0 && (
                    <div className={styles.infoMessage}>
                        <InformationCircleIcon />
                        <span>В кімнаті зараз проживає {room.occupied_places} осіб. Місткість не може бути меншою.</span>
                    </div>
                )}

            </div>
            <div className={styles.modalFooter}>
                <button type="button" onClick={onClose} className={`${styles.formButton} ${styles.cancelButton}`} disabled={isSubmitting}>
                    <XCircleIcon /> Скасувати
                </button>
                <button type="submit" className={`${styles.formButton} ${styles.submitButton}`} disabled={isSubmitting || !formik.isValid}>
                    <CheckCircleIcon /> {isSubmitting ? 'Збереження...' : (room?.id ? 'Оновити кімнату' : 'Створити кімнату')}
                </button>
            </div>
        </form>
    </div>
  );
};

export default RoomFormModal;