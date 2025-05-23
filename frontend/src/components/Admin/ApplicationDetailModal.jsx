import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "../../contexts/UserContext";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "./styles/ApplicationDetailModal.module.css"; // Використовуємо новий CSS модуль
import {
  UserCircleIcon,
  AcademicCapIcon,
  HomeModernIcon,
  CalendarDaysIcon,
  ChatBubbleLeftEllipsisIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  PlusCircleIcon,
  ExclamationTriangleIcon,
  NoSymbolIcon,
  InformationCircleIcon, // Додано для додаткової інформації
  ClockIcon // Для міток часу
} from "@heroicons/react/24/outline";

const ApplicationDetailModal = ({ application, onClose, onStatusUpdate, onAddComment, isModalLoading }) => {
  const { user } = useUser();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [newStatus, setNewStatus] = useState(application.status);
  const [selectedRoomId, setSelectedRoomId] = useState(application.room_id || "");
  const [rooms, setRooms] = useState([]);

  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);

  const modalContentRef = useRef(null);

  const canUpdateStatus = onStatusUpdate && !["student_council_head", "student_council_member"].includes(user?.role);
  const canAddComment = onAddComment && !["student_council_member"].includes(user?.role);

  useEffect(() => {
    setNewStatus(application.status);
    setSelectedRoomId(application.room_id || "");
  }, [application]);

  useEffect(() => {
    if (user?.role === "dorm_manager" && newStatus === "settled" && application?.dormitory_id) {
      const fetchRooms = async () => {
        setIsUpdatingStatus(true);
        try {
          const response = await api.get(`/dormitories/${application.dormitory_id}/rooms`);
          setRooms(response.data || []);
        } catch (error) {
          ToastService.handleApiError(error);
          setRooms([]);
        } finally {
            setIsUpdatingStatus(false);
        }
      };
      fetchRooms();
    } else {
      setRooms([]);
    }
  }, [user?.role, application?.dormitory_id, newStatus]);

  const formatDate = (dateString) => {
    if (!dateString) return <span className={styles.notAvailableData}><NoSymbolIcon className={styles.inlineIconXs} />Н/Д</span>;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return <span className={styles.notAvailableData}><NoSymbolIcon className={styles.inlineIconXs} />Некор. дата</span>;
      return date.toLocaleString("uk-UA", {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return <span className={styles.notAvailableData}><NoSymbolIcon className={styles.inlineIconXs} />Помилка</span>;
    }
  };

  const fetchComments = useCallback(async () => {
    if (!application?.id) return;
    setIsLoadingComments(true);
    try {
      const response = await api.get(`/admin/accommodation-applications/${application.id}/comments`);
      setComments(response.data || []);
    } catch (err) {
      ToastService.handleApiError(err);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  }, [application?.id]);

  useEffect(() => {
    if (application?.id) {
      fetchComments();
    }
  }, [application?.id, fetchComments]);

  const handleStatusChange = async () => {
    if (newStatus === application.status && (newStatus !== 'settled' || selectedRoomId === application.room_id)) return;
    if (newStatus === "settled" && user?.role === "dorm_manager" && !selectedRoomId) {
      ToastService.error("Для статусу 'Поселено' необхідно обрати кімнату.");
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const updatePayload = {
        status: newStatus,
        ...(newStatus === "settled" && selectedRoomId && { room_id: parseInt(selectedRoomId) })
      };
      await onStatusUpdate(application.id, updatePayload.status, updatePayload.room_id ? { room_id: updatePayload.room_id } : {});
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) {
      ToastService.error("Коментар не може бути порожнім.");
      return;
    }
    setIsAddingComment(true);
    try {
      const addedComment = await onAddComment(application.id, newComment);
      if (addedComment) {
        setComments((prevComments) => [addedComment, ...prevComments]);
        setNewComment("");
        if (modalContentRef.current) {
            setTimeout(() => {
                const commentListElement = modalContentRef.current.querySelector(`.${styles.commentListWrapper} ul li:first-child`);
                if (commentListElement) {
                    commentListElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 100);
        }
      }
    } finally {
      setIsAddingComment(false);
    }
  };

  const statusLabels = {
    pending: "Очікує", approved: "Затверджено", rejected: "Відхилено",
    approved_by_faculty: "Затв. деканатом", rejected_by_faculty: "Відх. деканатом",
    approved_by_dorm: "Затв. гуртожитком", rejected_by_dorm: "Відх. гуртожитком",
    settled: "Поселено",
  };
  const getStatusDisplayName = (statusKey) => statusLabels[statusKey] || statusKey;

  const statusOptionsConfig = {
    admin: [
      { value: "pending", label: "Очікує" }, { value: "approved", label: "Затверджено" },
      { value: "rejected", label: "Відхилено" }, { value: "approved_by_faculty", label: "Затв. деканатом" },
      { value: "rejected_by_faculty", label: "Відх. деканатом" }, { value: "approved_by_dorm", label: "Затв. гуртожитком" },
      { value: "rejected_by_dorm", label: "Відх. гуртожитком" }, { value: "settled", label: "Поселено" },
    ],
    superadmin: [],
    faculty_dean_office: [
      { value: "approved_by_faculty", label: "Затвердити від деканату" },
      { value: "rejected_by_faculty", label: "Відхилити від деканату" },
    ],
    dorm_manager: [
      { value: "approved_by_dorm", label: "Затвердити від гуртожитку" },
      { value: "rejected_by_dorm", label: "Відхилити від гуртожитку" },
      { value: "settled", label: "Поселено" },
    ],
  };
  statusOptionsConfig.superadmin = [...statusOptionsConfig.admin];
  const availableStatusOptions = statusOptionsConfig[user?.role] || [];

  if (!application) return null;

  const applicantNameRegistered = application.applicant_full_name || "Н/Д";
  const applicantNameFromForm = application.full_name || "Н/Д";
  const isNameMismatch = application.applicant_full_name && application.full_name && application.applicant_full_name !== application.full_name;

  const getStatusClass = (status) => {
    if (!status) return styles.statusDefault;
    const baseClass = styles.statusBadge;
    switch (status.toLowerCase()) {
        case 'pending': return `${baseClass} ${styles.statusPending}`;
        case 'approved':
        case 'approved_by_faculty':
        case 'approved_by_dorm':
             return `${baseClass} ${styles.statusApproved}`;
        case 'rejected':
        case 'rejected_by_faculty':
        case 'rejected_by_dorm':
            return `${baseClass} ${styles.statusRejected}`;
        case 'settled': return `${baseClass} ${styles.statusSettled}`;
        default: return `${baseClass} ${styles.statusDefault}`;
    }
};


  return (
    <div className={styles.modalInnerContent} ref={modalContentRef}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>
            Заявка №{application.id}
            <span className={styles.titleApplicantName}>від {applicantNameRegistered}</span>
        </h2>
      </div>

      <div className={styles.modalBody}>
        <div className={styles.contentGrid}>
          {/* Block: Applicant Info */}
          <div className={styles.infoBlock}>
            <div className={styles.blockHeader}>
              <UserCircleIcon className={styles.blockIcon} />
              <h3 className={styles.blockTitle}>Інформація про заявника</h3>
            </div>
            <div className={styles.blockContent}>
              <p><strong>ПІБ (реєстр.):</strong> {applicantNameRegistered}</p>
              {isNameMismatch && (
                  <p className={styles.warningText}><ExclamationTriangleIcon className={styles.inlineIcon}/><strong>ПІБ (у заявці):</strong> {applicantNameFromForm}</p>
              )}
              <p><strong>Email:</strong> {application.user_email || <span className={styles.notAvailableData}><NoSymbolIcon className={styles.inlineIconXs} />Н/Д</span>}</p>
              <p><strong>Телефон:</strong> {application.phone_number || <span className={styles.notAvailableData}><NoSymbolIcon className={styles.inlineIconXs} />Н/Д</span>}</p>
            </div>
          </div>

          {/* Block: Academic Info */}
          <div className={styles.infoBlock}>
            <div className={styles.blockHeader}>
              <AcademicCapIcon className={styles.blockIcon} />
              <h3 className={styles.blockTitle}>Навчальна інформація</h3>
            </div>
            <div className={styles.blockContent}>
              <p><strong>Факультет:</strong> {application.faculty_name || <span className={styles.notAvailableData}><NoSymbolIcon className={styles.inlineIconXs} />Н/Д</span>}</p>
              <p><strong>Курс:</strong> {application.course || <span className={styles.notAvailableData}><NoSymbolIcon className={styles.inlineIconSmall} />Н/Д</span>}</p>
              <p><strong>Група:</strong> {application.group_name || <span className={styles.notAvailableData}><NoSymbolIcon className={styles.inlineIconSmall} />Н/Д</span>}</p>
            </div>
          </div>

          {/* Block: Accommodation Details */}
          <div className={styles.infoBlock}>
            <div className={styles.blockHeader}>
              <HomeModernIcon className={styles.blockIcon} />
              <h3 className={styles.blockTitle}>Деталі поселення</h3>
            </div>
            <div className={styles.blockContent}>
              <p><strong>Гуртожиток:</strong> {application.dormitory_name || <span className={styles.notAvailableData}><NoSymbolIcon className={styles.inlineIconSmall} />Н/Д</span>}</p>
              <p><strong>Бажана кімната:</strong> {application.preferred_room || <span className={styles.notAvailableData}>Не вказано</span>}</p>
              <p><strong>Кімната (профіль):</strong> {application.room_number || <span className={styles.notAvailableData}>Не вказано</span>}</p>
            </div>
          </div>

          {/* Block: Dates and Status */}
          <div className={styles.infoBlock}>
            <div className={styles.blockHeader}>
              <CalendarDaysIcon className={styles.blockIcon} />
              <h3 className={styles.blockTitle}>Терміни та статус</h3>
            </div>
            <div className={styles.blockContent}>
              <p><strong>Дата подачі:</strong> {formatDate(application.application_date)}</p>
              <p><strong>Термін проживання:</strong> {formatDate(application.start_date)} - {formatDate(application.end_date)}</p>
              <p><strong>Статус:</strong> <span className={getStatusClass(application.status)}>{getStatusDisplayName(application.status)}</span></p>
              <div className={styles.timestamps}>
                  <p><ClockIcon className={styles.inlineIconXs}/><strong>Створено:</strong> {formatDate(application.created_at)}</p>
                  <p><ClockIcon className={styles.inlineIconXs}/><strong>Оновлено:</strong> {formatDate(application.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Student Comment Section */}
        {application.comments && (
            <div className={styles.infoBlock}>
                <div className={styles.blockHeader}>
                    <InformationCircleIcon className={styles.blockIcon} />
                    <h3 className={styles.blockTitle}>Коментар студента до заявки</h3>
                </div>
                <div className={styles.blockContent}>
                    <p className={styles.studentCommentText}>{application.comments}</p>
                </div>
            </div>
        )}

        {/* Status Update Section */}
        {canUpdateStatus && availableStatusOptions.length > 0 && (
          <div className={styles.infoBlock}>
            <div className={styles.blockHeader}>
              <PencilSquareIcon className={styles.blockIcon} />
              <h3 className={styles.blockTitle}>Змінити статус заявки</h3>
            </div>
            <div className={`${styles.blockContent} ${styles.formSection}`}>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                disabled={isUpdatingStatus || isModalLoading}
                className={styles.selectField}
              >
                {availableStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {user?.role === "dorm_manager" && newStatus === "settled" && (
                <div className={styles.roomSelection}>
                  <label htmlFor="roomSelectModal" className={styles.inputLabel}>Оберіть кімнату для поселення:</label>
                  <select
                    id="roomSelectModal"
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className={styles.selectField}
                    disabled={isUpdatingStatus || rooms.length === 0 || isModalLoading}
                  >
                    <option value="">{isUpdatingStatus && rooms.length === 0 ? "Завантаження кімнат..." : (rooms.length === 0 ? "Немає доступних кімнат" : "Оберіть кімнату...")}</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        Кімната №{room.number} (Місткість: {room.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                onClick={handleStatusChange}
                disabled={isUpdatingStatus || isModalLoading || (newStatus === application.status && (newStatus !== 'settled' || selectedRoomId === (application.room_id || "")))}
                className={styles.actionButton}
              >
                <CheckCircleIcon className={styles.buttonIcon} />
                {isUpdatingStatus || isModalLoading ? "Оновлення..." : "Оновити статус"}
              </button>
            </div>
          </div>
        )}

        {/* Admin Comments Section */}
        {canAddComment && (
          <div className={styles.infoBlock}>
            <div className={styles.blockHeader}>
              <ChatBubbleLeftEllipsisIcon className={styles.blockIcon} />
              <h3 className={styles.blockTitle}>Коментарі адміністрації</h3>
            </div>
            <div className={styles.blockContent}>
              {isLoadingComments ? (
                <p className={styles.loadingMessage}>Завантаження коментарів...</p>
              ) : comments.length === 0 ? (
                <p className={styles.emptyMessage}>Коментарі відсутні.</p>
              ) : (
                <div className={styles.commentListWrapper}>
                  <ul className={styles.commentList}>
                    {comments.map((comment) => (
                      <li key={comment.id} className={styles.commentItem}>
                        <p className={styles.commentMeta}>
                          <strong>{comment.admin_name || 'Адміністратор'}</strong>
                          <span className={styles.commentDate}>({formatDate(comment.created_at)})</span>
                        </p>
                        <p className={styles.commentText}>{comment.comment}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className={styles.addCommentArea}>
                <label htmlFor="newCommentTextarea" className={styles.inputLabel}>Додати новий коментар:</label>
                <textarea
                  id="newCommentTextarea"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Введіть ваш коментар тут..."
                  disabled={isAddingComment || isModalLoading}
                  className={styles.textareaField}
                  rows="3"
                />
                <button
                  onClick={handleCommentSubmit}
                  disabled={isAddingComment || isModalLoading || !newComment.trim()}
                  className={styles.actionButton}
                >
                  <PlusCircleIcon className={styles.buttonIcon} />
                  {isAddingComment || isModalLoading ? "Додавання..." : "Додати коментар"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.modalFooter}>
        <button onClick={onClose} className={styles.closeModalButton}>
            Закрити деталі
        </button>
       </div>
    </div>
  );
};

export default ApplicationDetailModal;