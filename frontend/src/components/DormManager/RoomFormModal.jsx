import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../utils/api';
import { ToastService } from '../../utils/toastConfig';
import styles from './styles/RoomFormModal.module.css';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const RoomFormModal = ({ dormitoryId, room, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationSchema = Yup.object({
    number: Yup.string()
      .trim()
      .min(1, "Номер не може бути порожнім")
      .max(10, "Максимум 10 символів")
      .required("Номер кімнати обов'язковий"),
    capacity: Yup.number()
      .integer("Місткість має бути цілим числом")
      .min(1, "Місткість має бути принаймні 1")
      .max(10, "Максимальна місткість 10")
      .required("Місткість обов'язкова"),
    floor: Yup.number()
      .integer("Поверх має бути цілим числом")
      .min(0, "Поверх не може бути від'ємним")
      .nullable(),
    gender_type: Yup.string()
      .oneOf(['any', 'male', 'female', 'mixed'], "Невірний тип статі")
      .required("Тип статі обов'язковий"),
    description: Yup.string().trim().max(500, "Опис занадто довгий (макс 500 символів)").nullable(),
    is_reservable: Yup.boolean().required(),
  });

  const formik = useFormik({
    initialValues: {
      number: room?.number || '',
      capacity: room?.capacity || '',
      floor: room?.floor === null || room?.floor === undefined ? '' : room.floor,
      gender_type: room?.gender_type || 'any',
      description: room?.description || '',
      is_reservable: room?.is_reservable === undefined ? true : Boolean(room.is_reservable),
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      const payload = {
        ...values,
        floor: values.floor === '' ? null : Number(values.floor),
        capacity: Number(values.capacity),
      };
      // Remove price_per_night if it exists in values due to old state
      delete payload.price_per_night;


      try {
        if (room?.id) {
          await api.put(`/rooms/${room.id}`, payload);
          ToastService.success('Кімнату успішно оновлено');
        } else {
          await api.post(`/dormitories/${dormitoryId}/rooms`, payload);
          ToastService.success('Кімнату успішно створено');
        }
        onSuccess();
      } catch (error) {
        ToastService.handleApiError(error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{room?.id ? `Редагувати кімнату №${room.number}` : 'Створити нову кімнату'}</h2>
        <form onSubmit={formik.handleSubmit} className={styles.roomForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="number">Номер кімнати</label>
              <input
                id="number"
                name="number"
                type="text"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.number}
                className={formik.touched.number && formik.errors.number ? styles.inputError : ""}
              />
              {formik.touched.number && formik.errors.number ? (
                <div className={styles.errorMessage}>{formik.errors.number}</div>
              ) : null}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="capacity">Місткість</label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                max="10"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.capacity}
                className={formik.touched.capacity && formik.errors.capacity ? styles.inputError : ""}
              />
              {formik.touched.capacity && formik.errors.capacity ? (
                <div className={styles.errorMessage}>{formik.errors.capacity}</div>
              ) : null}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="floor">Поверх</label>
              <input
                id="floor"
                name="floor"
                type="number"
                min="0"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.floor}
                className={formik.touched.floor && formik.errors.floor ? styles.inputError : ""}
              />
              {formik.touched.floor && formik.errors.floor ? (
                <div className={styles.errorMessage}>{formik.errors.floor}</div>
              ) : null}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="gender_type">Тип статі</label>
              <select
                id="gender_type"
                name="gender_type"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.gender_type}
                className={formik.touched.gender_type && formik.errors.gender_type ? styles.inputError : ""}
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
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="description">Опис</label>
            <textarea
              id="description"
              name="description"
              rows="3"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.description}
              className={formik.touched.description && formik.errors.description ? styles.inputError : ""}
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
            />
            <label htmlFor="is_reservable">Доступна для бронювання</label>
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isSubmitting}>
              <XCircleIcon /> Скасувати
            </button>
            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              <CheckCircleIcon /> {isSubmitting ? 'Збереження...' : (room?.id ? 'Оновити кімнату' : 'Створити кімнату')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomFormModal;