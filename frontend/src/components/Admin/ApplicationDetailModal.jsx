import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "../../contexts/UserContext";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "./styles/ApplicationDetailModal.module.css";

const ApplicationDetailModal = ({
  category,
  application,
  onClose,
  onStatusUpdate,
  onAddComment,
}) => {
  const { user } = useUser();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [newStatus, setNewStatus] = useState(application.status);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);

  const canUpdateStatus = !["student_council_head", "student_council_member"].includes(user?.role);
  const canAddComment = !["student_council_member"].includes(user?.role);

  const formatDate = (dateString) => {
    if (!dateString) return "Н/Д";
    return new Date(dateString).toLocaleString("uk-UA", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const fetchComments = useCallback(async () => {
    setIsLoadingComments(true);
    try {
      const response = await api.get(`/admin/accommodation-applications/${application.id}/comments`);
      setComments(response.data);
    } catch (err) {
      ToastService.handleApiError(err);
    } finally {
      setIsLoadingComments(false);
    }
  }, [application.id]);

  useEffect(() => {
    if (category === "accommodation") {
      fetchComments();
    }
  }, [category, fetchComments]);

  const handleStatusChange = async () => {
    if (newStatus === application.status) return;
    setIsUpdatingStatus(true);
    try {
      await onStatusUpdate(application.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) {
      ToastService.error("Коментар не може бути порожнім");
      return;
    }
    setIsAddingComment(true);
    try {
      const newCommentData = await onAddComment(application.id, newComment);
      setComments((prev) => [newCommentData, ...prev]);
      setNewComment("");
    } finally {
      setIsAddingComment(false);
    }
  };

  const statusOptions = {
    admin: [
      { value: "pending", label: "Очікує" },
      { value: "approved", label: "Підтверджено" },
      { value: "rejected", label: "Відхилено" },
      { value: "approved_by_faculty", label: "Підтверджено факультетом" },
      { value: "rejected_by_faculty", label: "Відхилено факультетом" },
      { value: "approved_by_dorm", label: "Підтверджено гуртожитком" },
      { value: "rejected_by_dorm", label: "Відхилено гуртожитком" },
      { value: "settled", label: "Поселено" },
    ],
    superadmin: [
      { value: "pending", label: "Очікує" },
      { value: "approved", label: "Підтверджено" },
      { value: "rejected", label: "Відхилено" },
      { value: "approved_by_faculty", label: "Підтверджено факультетом" },
      { value: "rejected_by_faculty", label: "Відхилено факультетом" },
      { value: "approved_by_dorm", label: "Підтверджено гуртожитком" },
      { value: "rejected_by_dorm", label: "Відхилено гуртожитком" },
      { value: "settled", label: "Поселено" },
    ],
    faculty_dean_office: [
      { value: "approved_by_faculty", label: "Підтверджено факультетом" },
      { value: "rejected_by_faculty", label: "Відхилено факультетом" },
    ],
    dorm_manager: [
      { value: "approved_by_dorm", label: "Підтверджено гуртожитком" },
      { value: "rejected_by_dorm", label: "Відхилено гуртожитком" },
      { value: "settled", label: "Поселено" },
    ],
  };

  const availableStatusOptions = statusOptions[user?.role] || [];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>Деталі заявки #{application.id}</h2>
        <button className={styles.closeButton} onClick={onClose}>
          Закрити
        </button>
        <div className={styles.content}>
          <h3 className={styles.sectionTitle}>Інформація про заявку</h3>
          <div className={styles.details}>
            <p><strong>ID заявки:</strong> {application.id}</p>
            <p><strong>ПІБ (з заявки):</strong> {application.full_name}</p>
            <p><strong>Прізвище (з заявки):</strong> {application.surname}</p>
            <p><strong>ПІБ (зареєстрований):</strong> {application.applicant_full_name}</p>
            <p><strong>Email:</strong> {application.user_email}</p>
            <p><strong>Факультет:</strong> {application.faculty_name}</p>
            <p><strong>Курс:</strong> {application.course}</p>
            <p><strong>Група:</strong> {application.group_name}</p>
            <p><strong>Гуртожиток:</strong> {application.dormitory_name}</p>
            <p><strong>Номер кімнати:</strong> {application.room_number || "Н/Д"}</p>
            <p><strong>Телефон:</strong> {application.phone_number}</p>
            <p><strong>Дата подачі:</strong> {formatDate(application.application_date)}</p>
            <p><strong>Термін проживання:</strong> {formatDate(application.start_date)} - {formatDate(application.end_date)}</p>
            <p><strong>Статус:</strong> {application.status}</p>
            <p><strong>Створено:</strong> {formatDate(application.created_at)}</p>
            <p><strong>Оновлено:</strong> {formatDate(application.updated_at)}</p>
          </div>

          {canUpdateStatus && availableStatusOptions.length > 0 && (
            <>
              <h3 className={styles.sectionTitle}>Оновлення статусу</h3>
              <div className={styles.statusUpdate}>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  disabled={isUpdatingStatus}
                  className={styles.inputField}
                >
                  {availableStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleStatusChange}
                  disabled={isUpdatingStatus || newStatus === application.status}
                  className={styles.actionButton}
                >
                  {isUpdatingStatus ? "Оновлення..." : "Оновити"}
                </button>
              </div>
            </>
          )}

          {canAddComment && (
            <>
              <h3 className={styles.sectionTitle}>Коментарі</h3>
              {isLoadingComments ? (
                <p className={styles.loading}>Завантаження коментарів...</p>
              ) : comments.length === 0 ? (
                <p className={styles.noComments}>Коментарі відсутні</p>
              ) : (
                <ul className={styles.commentList}>
                  {comments.map((comment) => (
                    <li key={comment.id} className={styles.comment}>
                      <p className={styles.commentMeta}>
                        <strong>{comment.admin_name}</strong> ({formatDate(comment.created_at)})
                      </p>
                      <p>{comment.comment}</p>
                    </li>
                  ))}
                </ul>
              )}

              <h3 className={styles.sectionTitle}>Додати коментар</h3>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Введіть коментар..."
                disabled={isAddingComment}
                className={styles.commentInput}
              />
              <button
                onClick={handleCommentSubmit}
                disabled={isAddingComment || !newComment.trim()}
                className={styles.actionButton}
              >
                {isAddingComment ? "Додавання..." : "Додати"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailModal;