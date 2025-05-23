// frontend/src/components/DormManager/RoomForm.jsx
import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "./styles/RoomForm.module.css";
import { useUser } from "../../contexts/UserContext";

const RoomForm = ({ room, onClose, onSuccess }) => {
  const { user } = useUser();

  const validationSchema = Yup.object({
    number: Yup.string()
      .required("Номер кімнати обов'язковий")
      .matches(/^\d+$/, "Номер має бути числом"),
    capacity: Yup.number()
      .min(1, "Місткість має бути більше 0")
      .required("Місткість обов'язкова"),
    description: Yup.string().max(500, "Опис не може перевищувати 500 символів"),
  });

  const formik = useFormik({
    initialValues: {
      number: room?.number || "",
      capacity: room?.capacity || "",
      description: room?.description || "",
      dormitory_id: user.dormitory_id,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (room?.id) {
          await api.put(`/api/v1/dormitories/${user.dormitory_id}/rooms/${room.id}`, values);
          ToastService.success("Кімнату оновлено");
        } else {
          await api.post(`/api/v1/dormitories/${user.dormitory_id}/rooms`, values);
          ToastService.success("Кімнату створено");
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
        <h2>{room?.id ? "Редагувати кімнату" : "Додати кімнату"}</h2>
        <div>
          <label>Номер</label>
          <input
            name="number"
            value={formik.values.number}
            onChange={formik.handleChange}
            className={formik.errors.number ? styles.errorInput : ""}
          />
          {formik.errors.number && <div className={styles.error}>{formik.errors.number}</div>}
        </div>
        <div>
          <label>Місткість</label>
          <input
            type="number"
            name="capacity"
            value={formik.values.capacity}
            onChange={formik.handleChange}
            className={formik.errors.capacity ? styles.errorInput : ""}
          />
          {formik.errors.capacity && <div className={styles.error}>{formik.errors.capacity}</div>}
        </div>
        <div>
          <label>Опис</label>
          <textarea
            name="description"
            value={formik.values.description}
            onChange={formik.handleChange}
            className={formik.errors.description ? styles.errorInput : ""}
          />
          {formik.errors.description && <div className={styles.error}>{formik.errors.description}</div>}
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

export default RoomForm;