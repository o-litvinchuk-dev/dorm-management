import React, { useState, useEffect, useCallback } from "react";
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
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [newStatus, setNewStatus] = useState(application.status);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);

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

  const statusOptions = [
    { value: "pending", label: "Очікує" },
    { value: "approved", label: "Підтверджено" },
    { value: "rejected", label: "Відхилено" },
  ];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Деталі заявки #{application.id}</h2>
        <button className={styles.closeButton} onClick={onClose}>
          Закрити
        </button>
        <div className={styles.content}>
          <h3>Інформація про заявку</h3>
          <p><strong>ПІБ:</strong> {application.applicant_full_name || application.full_name}</p>
          <p><strong>Email:</strong> {application.user_email || application.email}</p>
          <p><strong>Серія паспорта:</strong> {application.passport_series}</p>
          <p><strong>Номер паспорта:</strong> {application.passport_number}</p>
          <p><strong>Ким виданий:</strong> {application.passport_issued}</p>
          <p><strong>Ідентифікаційний код:</strong> {application.tax_id}</p>
          <p><strong>Номер гуртожитку:</strong> {application.dorm_number}</p>
          <p><strong>Номер кімнати:</strong> {application.room_number}</p>
          <p><strong>Статус:</strong> {application.status}</p>
          <p><strong>Дата подачі:</strong> {formatDate(application.application_date)}</p>
          <p><strong>Створено:</strong> {formatDate(application.created_at)}</p>
          <p><strong>Оновлено:</strong> {formatDate(application.updated_at)}</p>

          <h3>Оновлення статусу</h3>
          <div className={styles.statusUpdate}>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              disabled={isUpdatingStatus}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleStatusChange}
              disabled={isUpdatingStatus || newStatus === application.status}
            >
              {isUpdatingStatus ? "Оновлення..." : "Оновити"}
            </button>
          </div>

          <h3>Коментарі</h3>
          {isLoadingComments ? (
            <p>Завантаження коментарів...</p>
          ) : comments.length === 0 ? (
            <p>Коментарі відсутні</p>
          ) : (
            <ul className={styles.commentList}>
              {comments.map((comment) => (
                <li key={comment.id} className={styles.comment}>
                  <p>
                    <strong>{comment.admin_name}</strong> ({formatDate(comment.created_at)})
                  </p>
                  <p>{comment.comment}</p>
                </li>
              ))}
            </ul>
          )}

          <h3>Додати коментар</h3>
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
          >
            {isAddingComment ? "Додавання..." : "Додати"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailModal;