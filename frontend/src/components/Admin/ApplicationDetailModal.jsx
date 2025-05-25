import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "../../contexts/UserContext";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "./styles/ApplicationDetailModal.module.css";
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
  InformationCircleIcon,
  ClockIcon,
  XCircleIcon,
  BookmarkSquareIcon // Іконка для бронювання
} from "@heroicons/react/24/outline";

const ApplicationDetailModal = ({ application, onClose, onStatusUpdate, onAddComment, isModalLoading }) => {
  const { user } = useUser();
  const [comments, setComments] = useState([]);
  const [newAdminComment, setNewAdminComment] = useState(""); 
  const [newStatusToSet, setNewStatusToSet] = useState(""); 
  
  const [selectedRoomId, setSelectedRoomId] = useState(application.room_id || "");
  const [rooms, setRooms] = useState([]);

  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);

  const modalContentRef = useRef(null);

  const canReallyUpdateStatus = onStatusUpdate && !["student_council_head", "student_council_member"].includes(user?.role);
  const canReallyAddComment = onAddComment;

  // Отримуємо інформацію про активне бронювання з пропса application
  const activeRoomReservation = application.activeRoomReservation || null; 

  useEffect(() => {
    setSelectedRoomId(application.room_id || "");
    setNewAdminComment(""); 
    setIsEditingStatus(false); 
    setNewStatusToSet(application.status); 
  }, [application]);

  useEffect(() => {
    if (user?.role === "dorm_manager" && newStatusToSet === "settled" && application?.dormitory_id) {
      const fetchRooms = async () => {
        try {
          const response = await api.get(`/dormitories/${application.dormitory_id}/rooms`);
          setRooms(response.data || []);
        } catch (error) {
          ToastService.handleApiError(error);
          setRooms([]);
        }
      };
      fetchRooms();
    } else {
      setRooms([]);
    }
  }, [user?.role, application?.dormitory_id, newStatusToSet]);

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

  const handleConfirmStatusChange = async () => {
    const isStatusActuallyChanged = newStatusToSet !== "" && newStatusToSet !== application.status;
    const isCommentAdded = newAdminComment.trim() !== "";

    if (!isStatusActuallyChanged && !isCommentAdded) {
      ToastService.info("Немає змін для збереження (статус не змінено, коментар порожній).");
      setIsEditingStatus(false);
      setNewStatusToSet(application.status); 
      return;
    }
    
    setIsUpdatingStatus(true);
    let statusUpdatedSuccessfully = false;
    try {
      if (isStatusActuallyChanged) {
        await onStatusUpdate(application.id, newStatusToSet, {});
        statusUpdatedSuccessfully = true; 
      }

      if (isCommentAdded) {
        const addedComment = await onAddComment(application.id, newAdminComment.trim());
        if (addedComment) {
          setComments((prevComments) => [addedComment, ...prevComments]);
            if (modalContentRef.current) {
                setTimeout(() => {
                    const commentListElement = modalContentRef.current.querySelector(`.${styles.commentListWrapper} ul li:first-child`);
                    if (commentListElement) {
                        commentListElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }, 100);
            }
        }
      }
      
      setNewAdminComment("");
      setIsEditingStatus(false); 
      if (!statusUpdatedSuccessfully) {
          setNewStatusToSet(application.status);
      }
    } catch(err) {
        // Обробка помилки вже має бути в onStatusUpdate або onAddComment
    } 
    finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleIndependentCommentSubmit = async () => {
    if (!newAdminComment.trim()) {
      ToastService.error("Коментар не може бути порожнім.");
      return;
    }
    setIsAddingComment(true);
    try {
      const addedComment = await onAddComment(application.id, newAdminComment.trim());
      if (addedComment) {
        setComments((prevComments) => [addedComment, ...prevComments]);
        setNewAdminComment(""); 
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

  const roomReservationStatusLabels = {
    pending_confirmation: "Очікує підтвердження",
    confirmed: "Підтверджено",
    cancelled_by_user: "Скасовано студентом",
    rejected_by_admin: "Відхилено адміністрацією",
    checked_in: "Заселено",
    checked_out: "Виселено",
    expired: "Термін минув"
  };
  const getRoomReservationStatusDisplayName = (statusKey) => roomReservationStatusLabels[statusKey] || statusKey;


  const statusOptionsConfig = {
    admin: [
      { value: "approved", label: "Затверджено" },
      { value: "rejected", label: "Відхилено" }, 
      { value: "approved_by_faculty", label: "Затв. деканатом" },
      { value: "rejected_by_faculty", label: "Відх. деканатом" }, 
      { value: "approved_by_dorm", label: "Затв. гуртожитком" },
      { value: "rejected_by_dorm", label: "Відх. гуртожитком" }, 
    ],
    superadmin: [],
    faculty_dean_office: [
      { value: "approved_by_faculty", label: "Затвердити від деканату" },
      { value: "rejected_by_faculty", label: "Відхилити від деканату" },
    ],
    dorm_manager: [
      { value: "approved_by_dorm", label: "Затвердити від гуртожитку" },
      { value: "rejected_by_dorm", label: "Відхилити від гуртожитку" },
    ],
  };
  statusOptionsConfig.superadmin = [...statusOptionsConfig.admin];
  
  let availableStatusOptions = (statusOptionsConfig[user?.role] || []);
  availableStatusOptions = availableStatusOptions.filter(opt => opt.value !== application.status);
  availableStatusOptions = availableStatusOptions.filter(opt => opt.value !== 'pending');

  if (!application) return null;

  const applicantNameRegistered = application.applicant_full_name || "Н/Д";
  const applicantNameFromForm = application.full_name || "Н/Д";
  const isNameMismatch = application.applicant_full_name && application.full_name && application.applicant_full_name !== application.full_name;

  const getStatusClass = (status, isRoomReservation = false) => {
    if (!status) return styles.statusDefault;
    const baseClass = styles.statusBadge;
    const suffix = isRoomReservation ? "RoomRes" : ""; 

    switch (status.toLowerCase()) {
        case 'pending': 
        case 'pending_confirmation':
            return `${baseClass} ${styles[`statusPending${suffix}`] || styles.statusPending}`;
        case 'approved':
        case 'approved_by_faculty':
        case 'approved_by_dorm':
        case 'confirmed': 
        case 'checked_in': 
             return `${baseClass} ${styles[`statusApproved${suffix}`] || styles.statusApproved}`;
        case 'rejected':
        case 'rejected_by_faculty':
        case 'rejected_by_dorm':
        case 'cancelled_by_user': 
        case 'rejected_by_admin': 
        case 'expired': 
            return `${baseClass} ${styles[`statusRejected${suffix}`] || styles.statusRejected}`;
        case 'settled': 
        case 'checked_out': 
            return `${baseClass} ${styles[`statusSettled${suffix}`] || styles.statusSettled}`;
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
          {/* Інформація про заявника */}
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

          {/* Навчальна інформація */}
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

          {/* Деталі заявки на поселення */}
          <div className={styles.infoBlock}>
            <div className={styles.blockHeader}>
              <HomeModernIcon className={styles.blockIcon} />
              <h3 className={styles.blockTitle}>Деталі заявки на поселення</h3>
            </div>
            <div className={styles.blockContent}>
              <p><strong>Гуртожиток:</strong> {application.dormitory_name || <span className={styles.notAvailableData}><NoSymbolIcon className={styles.inlineIconSmall} />Н/Д</span>}</p>
              <p><strong>Дата подачі:</strong> {formatDate(application.application_date)}</p>
              <p><strong>Термін проживання:</strong> {formatDate(application.start_date)} - {formatDate(application.end_date)}</p>
               {/* Відображаємо display_room_info замість preferred_room */}
              <p><strong>Бажана/поточна кімната:</strong> {application.display_room_info || <span className={styles.notAvailableData}>Не вказано</span>}</p>
            </div>
          </div>
          
          {/* Статус заявки на поселення */}
          <div className={styles.infoBlock}>
            <div className={styles.blockHeader}>
              <CalendarDaysIcon className={styles.blockIcon} />
              <h3 className={styles.blockTitle}>Статус заявки на поселення</h3>
            </div>
            <div className={styles.blockContent}>
              <p><strong>Статус:</strong> <span className={getStatusClass(application.status)}>{getStatusDisplayName(application.status)}</span></p>
              <div className={styles.timestamps}>
                  <p><ClockIcon className={styles.inlineIconXs}/><strong>Створено:</strong> {formatDate(application.created_at)}</p>
                  <p><ClockIcon className={styles.inlineIconXs}/><strong>Оновлено:</strong> {formatDate(application.updated_at)}</p>
              </div>
            </div>
          </div>
        </div> {/* Кінець contentGrid */}

        {/* Блок інформації про бронювання кімнати (якщо є) */}
        {activeRoomReservation && (
            <div className={styles.infoBlock}> 
                <div className={styles.blockHeader}>
                    <BookmarkSquareIcon className={styles.blockIcon} />
                    <h3 className={styles.blockTitle}>Активне бронювання кімнати студентом</h3>
                </div>
                <div className={styles.blockContent}>
                    <p><strong>ID Бронювання:</strong> {activeRoomReservation.id}</p>
                    <p><strong>Заброньована кімната:</strong> №{activeRoomReservation.room_number || "Не вказано"}</p>
                    <p>
                        <strong>Статус бронювання:</strong>  
                        <span className={getStatusClass(activeRoomReservation.status, true)}>
                           {getRoomReservationStatusDisplayName(activeRoomReservation.status)}
                        </span>
                    </p>
                    {activeRoomReservation.notes_student && <p><strong>Коментар студента до бронювання:</strong> {activeRoomReservation.notes_student}</p>}
                    {activeRoomReservation.reservation_start_date && activeRoomReservation.reservation_end_date && (
                        <p><strong>Період бронювання:</strong> {formatDate(activeRoomReservation.reservation_start_date)} - {formatDate(activeRoomReservation.reservation_end_date)}</p>
                    )}
                </div>
            </div>
        )}

        {application.comments && (
            <div className={styles.infoBlock}>
                <div className={styles.blockHeader}>
                    <InformationCircleIcon className={styles.blockIcon} />
                    <h3 className={styles.blockTitle}>Коментар студента до заявки на поселення</h3>
                </div>
                <div className={styles.blockContent}>
                    <p className={styles.studentCommentText}>{application.comments}</p>
                </div>
            </div>
        )}

        {canReallyUpdateStatus && (
          <div className={styles.infoBlock}>
            <div className={styles.blockHeader}>
              <PencilSquareIcon className={styles.blockIcon} />
              <h3 className={styles.blockTitle}>Змінити статус заявки на поселення</h3>
            </div>
            <div className={`${styles.blockContent} ${styles.formSection}`}>
              {!isEditingStatus ? (
                <button
                  onClick={() => {
                    setIsEditingStatus(true);
                    setNewStatusToSet(""); 
                    setNewAdminComment(""); 
                  }}
                  className={styles.actionButton}
                  disabled={isModalLoading}
                >
                  <PencilSquareIcon className={styles.buttonIcon} /> Змінити статус
                </button>
              ) : (
                <>
                  <div className={styles.statusEditGroup}>
                    <label htmlFor="statusSelectModal" className={styles.inputLabel}>Новий статус:</label>
                    <select
                      id="statusSelectModal"
                      value={newStatusToSet} 
                      onChange={(e) => setNewStatusToSet(e.target.value)}
                      disabled={isUpdatingStatus || isModalLoading}
                      className={styles.selectField}
                    >
                      <option value="" disabled>Оберіть новий статус...</option>
                      {availableStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.statusEditGroup}>
                    <label htmlFor="statusChangeComment" className={styles.inputLabel}>Коментар до зміни статусу (необов'язково, але бажано для відхилення):</label>
                    <textarea
                      id="statusChangeComment"
                      value={newAdminComment}
                      onChange={(e) => setNewAdminComment(e.target.value)}
                      placeholder="Причина зміни статусу, додаткова інформація..."
                      disabled={isUpdatingStatus || isModalLoading}
                      className={styles.textareaField}
                      rows="2"
                    />
                  </div>

                  <div className={styles.statusActionButtons}>
                    <button
                      onClick={handleConfirmStatusChange}
                      disabled={isUpdatingStatus || isModalLoading || (newStatusToSet === "" && !newAdminComment.trim()) || (newStatusToSet === application.status && !newAdminComment.trim())}
                      className={styles.actionButton}
                    >
                      <CheckCircleIcon className={styles.buttonIcon} />
                      {isUpdatingStatus || isModalLoading ? "Збереження..." : "Зберегти зміни"}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingStatus(false);
                        setNewAdminComment("");
                        setNewStatusToSet(application.status); 
                      }}
                      className={`${styles.actionButton} ${styles.cancelButton}`}
                      disabled={isUpdatingStatus || isModalLoading}
                    >
                       <XCircleIcon className={styles.buttonIcon}/> Скасувати
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {canReallyAddComment && !isEditingStatus && ( 
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
                <label htmlFor="independentCommentTextarea" className={styles.inputLabel}>Додати новий коментар (не змінюючи статус):</label>
                <textarea
                  id="independentCommentTextarea"
                  value={newAdminComment} 
                  onChange={(e) => setNewAdminComment(e.target.value)}
                  placeholder="Введіть ваш коментар тут..."
                  disabled={isAddingComment || isModalLoading}
                  className={styles.textareaField}
                  rows="3"
                />
                <button
                  onClick={handleIndependentCommentSubmit}
                  disabled={isAddingComment || isModalLoading || !newAdminComment.trim()}
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