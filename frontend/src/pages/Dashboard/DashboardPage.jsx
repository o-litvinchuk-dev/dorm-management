import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import DormPassCard from "../../components/Dashboard/DormPassCard";
import QuickActionLink from "../../components/Dashboard/QuickActionLink";
import ActivitySummaryCard from "../../components/Dashboard/ActivitySummaryCard";
import api from "../../utils/api";
import styles from "./styles/Dashboard.module.css";
import { useUser } from "../../contexts/UserContext";
import Avatar from "../../components/UI/Avatar/Avatar";
import {
  DocumentTextIcon,
  BellIcon,
  InformationCircleIcon,
  ClipboardDocumentCheckIcon,
  MagnifyingGlassCircleIcon,
  UserCircleIcon as ProfileIconHero,
  BuildingStorefrontIcon,
  AcademicCapIcon as DeanPanelIcon,
  ShieldCheckIcon as AdminPanelIcon,
  BookmarkSquareIcon,
  UserPlusIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  HomeIcon,
  BuildingOffice2Icon,
  UsersIcon
} from "@heroicons/react/24/outline";
import { HomeIcon as HomeSolidIcon } from "@heroicons/react/24/solid";

const SettlementStep = ({ title, status, isActive, isCompleted, onClick, actionText, icon }) => {
  const IconComponent = icon;
  return (
    <div
      className={`${styles.settlementStep} ${isActive ? styles.activeStep : ''} ${isCompleted ? styles.completedStep : ''} ${isCompleted && status.toLowerCase().includes('відхилено') ? styles.rejectedCompletedStep : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={onClick ? 0 : -1}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      aria-label={`Етап поселення: ${title}. Статус: ${status}`}
    >
      <div className={styles.stepIconWrapper}>
        {isCompleted && !status.toLowerCase().includes('відхилено') ? <CheckCircleIcon className={styles.stepIconCompleted} /> :
          isCompleted && status.toLowerCase().includes('відхилено') ? <XCircleIcon className={styles.stepIconRejected} /> :
            (IconComponent ? <IconComponent className={styles.stepIcon} /> : <InformationCircleIcon className={styles.stepIcon} />)}
      </div>
      <div className={styles.stepText}>
        <h4 className={styles.stepTitle}>{title}</h4>
        <p className={styles.stepStatus}>{status}</p>
        {isActive && actionText && !status.toLowerCase().includes('відхилено') && (
          <span className={styles.stepAction}>
            {actionText} <ArrowRightIcon />
          </span>
        )}
      </div>
    </div>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return "Невідомо";
  return new Date(dateString).toLocaleString("uk-UA", {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const getStatusDetails = (statusKey, type = 'application') => {
  const applicationStatusLabels = {
    pending: "Очікує", approved: "Затверджено", rejected: "Відхилено",
    approved_by_faculty: "Затв. деканатом", rejected_by_faculty: "Відх. деканатом",
    approved_by_dorm: "Затв. гуртожитком", rejected_by_dorm: "Відх. гуртожитком",
    settled: "Поселено", cancelled_by_user: "Скасовано вами"
  };
  const reservationStatusLabels = {
    pending_confirmation: "Очікує підтвердження", confirmed: "Підтверджено",
    cancelled_by_user: "Скасовано вами", rejected_by_admin: "Відхилено адміністрацією",
    checked_in: "Заселено", checked_out: "Виселено", expired: "Термін минув"
  };
  const agreementStatusLabels = {
    pending_review: "На розгляді", approved: "Затверджено",
    rejected: "Відхилено", archived: "Архівовано"
  };

  if (type === 'application') return applicationStatusLabels[statusKey] || statusKey || "N/A";
  if (type === 'reservation') return reservationStatusLabels[statusKey] || statusKey || "N/A";
  if (type === 'agreement') return agreementStatusLabels[statusKey] || statusKey || "N/A";
  return statusKey || "N/A";
};

const DashboardPage = () => {
  const { user: contextUser, isLoading: isUserContextLoading, logout } = useUser();
  const [dashboardData, setDashboardData] = useState(null);
  const [settlementStatus, setSettlementStatus] = useState(null);
  const [activePass, setActivePass] = useState(null);
  const [roommates, setRoommates] = useState([]);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  const fetchStudentDashboardData = useCallback(async () => {
    if (!contextUser || contextUser.role !== 'student') {
      setIsLoadingData(false);
      return;
    }
    setIsLoadingData(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) { logout(); navigate("/login", { replace: true }); return; }

      const [dashboardRes, passResSettled, reservationsResSettled, agreementsResSettled] = await Promise.allSettled([
        api.get("/secure/dashboard"),
        api.get('/secure/my-pass'),
        api.get('/secure/my-reservations'),
        api.get('/secure/my-settlement-agreements')
      ]);

      const dashboardResult = dashboardRes.status === 'fulfilled' ? dashboardRes.value.data : null;
      const activePassResult = passResSettled.status === 'fulfilled' ? passResSettled.value.data : null;
      const reservationsResult = reservationsResSettled.status === 'fulfilled' ? (reservationsResSettled.value.data || []) : [];
      const agreementsResult = agreementsResSettled.status === 'fulfilled' ? (agreementsResSettled.value.data?.agreements || []) : [];

      if (!dashboardResult) {
        throw new Error("Не вдалося завантажити основні дані дашборду.");
      }

      setDashboardData(dashboardResult);
      setActivePass(activePassResult);

      const latestApplication = dashboardResult.applications?.[0];
      let stageKey = 'initial_application';
      let appStatusForStage = null;

      if (activePassResult) {
        stageKey = 'completed';
        appStatusForStage = latestApplication?.status ? getStatusDetails(latestApplication.status, 'application') : 'Поселено';
        try {
          const roommatesRes = await api.get('/secure/my-roommates');
          setRoommates(roommatesRes.data || []);
        } catch (roommatesError) {
          if (roommatesError.response?.status !== 404) {
            console.warn("Could not fetch roommates:", roommatesError);
          }
          setRoommates([]);
        }
      } else if (latestApplication) {
        appStatusForStage = latestApplication.status;
        if (['settled'].includes(appStatusForStage)) {
          stageKey = 'completed';
        } else if (['rejected', 'rejected_by_faculty', 'rejected_by_dorm', 'cancelled_by_user'].includes(appStatusForStage)) {
          stageKey = 'application_rejected';
        } else {
          const activeReservation = reservationsResult.find(r => r.status === 'confirmed' || r.status === 'checked_in');
          const pendingReservation = reservationsResult.find(r => r.status === 'pending_confirmation');
          const activeAgreement = agreementsResult.find(a => a.status === 'approved');
          const pendingAgreement = agreementsResult.find(a => a.status === 'pending_review');

          if (activeAgreement) {
            stageKey = 'completed';
          } else if (pendingAgreement) {
            stageKey = 'agreement_review';
          } else if (activeReservation || ['approved', 'approved_by_dorm'].includes(appStatusForStage)) {
            stageKey = 'agreement';
          } else if (pendingReservation) {
            stageKey = 'reservation_pending';
          } else if (['approved_by_faculty'].includes(appStatusForStage) || (appStatusForStage === 'pending' && dashboardResult.applications.length > 0)) {
            stageKey = 'reservation';
          } else if (appStatusForStage === 'pending') {
            stageKey = 'application_review';
          }
        }
      }

      setSettlementStatus({
        currentStage: stageKey,
        applicationStatus: appStatusForStage,
        hasActivePass: !!activePassResult,
        reservationDetails: reservationsResult.find(r => r.status === 'confirmed' || r.status === 'pending_confirmation'),
        agreementDetails: agreementsResult.find(a => a.status === 'approved' || a.status === 'pending_review')
      });

    } catch (err) {
      const errorStatus = err.response?.status;
      const errorCode = err.response?.data?.code;
      const errorMessage = err.response?.data?.error || "Не вдалося завантажити дані для дашборду.";

      if (errorStatus === 401 || errorStatus === 403) {
        if (errorCode === "PROFILE_INCOMPLETE_FACULTY" || errorCode === "DORMITORY_NOT_ASSIGNED" || errorMessage.includes("Оновіть профіль")) {
          setError(errorMessage);
        } else {
          logout(); navigate("/login?session_expired=1", { replace: true });
        }
      } else { setError(errorMessage + " Спробуйте оновити сторінку."); }
    } finally {
      setIsLoadingData(false);
    }
  }, [navigate, contextUser, logout]);

  useEffect(() => {
    if (isUserContextLoading) { setIsLoadingData(true); return; }
    if (contextUser) {
      if (!contextUser.is_profile_complete && location.pathname !== "/complete-profile") {
        navigate("/complete-profile", { state: { from: location }, replace: true }); return;
      }
      const roleRedirects = {
        admin: '/admin/dashboard', superadmin: '/admin/dashboard',
        faculty_dean_office: '/dean/dashboard', dorm_manager: '/dorm-manager/dashboard',
      };
      if (roleRedirects[contextUser.role]) {
        navigate(roleRedirects[contextUser.role], { replace: true }); return;
      }
      if (contextUser.role === 'student') {
        fetchStudentDashboardData();
      } else {
        setIsLoadingData(false);
      }
    } else if (!localStorage.getItem("accessToken")) {
      setIsLoadingData(false);
      navigate("/login", { replace: true });
    }
  }, [navigate, contextUser, isUserContextLoading, fetchStudentDashboardData, location]);

  const handleSidebarToggle = (state) => {
    setIsSidebarExpanded(state);
    localStorage.setItem("sidebarOpen", JSON.stringify(state));
  };

  const renderApplicationItem = (app) => (
    <div key={app.id} className={styles.activityItem} onClick={() => navigate(`/my-accommodation-applications?open=${app.id}`)}
      role="button" tabIndex="0" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/my-accommodation-applications?open=${app.id}`) }}>
      <DocumentTextIcon className={styles.itemIcon} />
      <div className={styles.itemContent}>
        <span className={styles.itemTitle}>Заявка #{app.id} - <span className={styles.itemStatus}>{getStatusDetails(app.status, 'application')}</span></span>
        <span className={styles.itemDetails}>
          {app.dormitory_name && `Гуртожиток: ${app.dormitory_name}`}
          {app.faculty_name_display && `${app.dormitory_name ? ' | ' : ''}Факультет: ${app.faculty_name_display}`}
        </span>
        <span className={styles.itemDate}>Створено: {formatDate(app.created_at)}</span>
      </div>
    </div>
  );

  const renderNotificationItem = (notif) => (
    <div key={notif.id} className={`${styles.activityItem} ${notif.read ? styles.readNotification : ''}`}
      onClick={() => navigate("/settings?category=notifications")} role="button" tabIndex="0"
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate("/settings?category=notifications") }}>
      <BellIcon className={styles.itemIcon} />
      <div className={styles.itemContent}>
        <span className={styles.itemTitle}>{notif.title}</span>
        <span className={styles.itemDetails}>{notif.description}</span>
        <span className={styles.itemDate}>Отримано: {formatDate(notif.created_at)}</span>
      </div>
    </div>
  );

  const isLoadingOverall = isLoadingData || isUserContextLoading;

  if (contextUser && contextUser.role === 'student') {
    const stageDetails = {
      initial_application: {
        title: "1. Подача Заяви", status: "Подайте заяву на поселення, щоб розпочати",
        actionText: "Подати заяву", actionLink: "/services/accommodation-application", icon: ClipboardDocumentCheckIcon,
        isActive: true, isCompleted: false
      },
      application_review: {
        title: "1. Заява на Розгляді", status: `Ваша заява зі статусом: ${getStatusDetails(settlementStatus?.applicationStatus, 'application')}`,
        actionText: "Переглянути заяви", actionLink: "/my-accommodation-applications", icon: ClockIcon,
        isActive: false, isCompleted: false
      },
      application_rejected: {
        title: "1. Заяву Відхилено", status: `Статус: ${getStatusDetails(settlementStatus?.applicationStatus, 'application')}`,
        actionText: "Подати нову заяву", actionLink: "/services/accommodation-application", icon: XCircleIcon,
        isActive: true, isCompleted: true,
      },
      reservation: {
        title: "2. Бронювання Кімнати", status: "Заява затверджена. Оберіть кімнату для проживання.",
        actionText: "Знайти та забронювати", actionLink: "/services/rooms/search", icon: BookmarkSquareIcon,
        isActive: true, isCompleted: false
      },
      reservation_pending: {
        title: "2. Бронювання Очікує", status: `Бронювання кімнати №${settlementStatus?.reservationDetails?.room_number || '...'} ${getStatusDetails(settlementStatus?.reservationDetails?.status, 'reservation')}`,
        actionText: "Мої бронювання", actionLink: "/my-reservations", icon: ClockIcon,
        isActive: false, isCompleted: false
      },
      agreement: {
        title: "3. Оформлення Договору",
        status: `Кімната №${settlementStatus?.reservationDetails?.room_number || (settlementStatus?.applicationStatus === 'approved_by_dorm' && dashboardData?.applications?.[0]?.preferred_room) || '...'} заброньована/визначена. Заповніть договір.`,
        actionText: "Заповнити договір", actionLink: "/services/settlement-agreement", icon: DocumentTextIcon,
        isActive: true, isCompleted: false
      },
      agreement_review: {
        title: "3. Договір на Розгляді", status: `Ваш договір (${getStatusDetails(settlementStatus?.agreementDetails?.status, 'agreement')}) перевіряється.`,
        actionText: "Мої активності", actionLink: "/my-accommodation-applications", icon: ClockIcon,
        isActive: false, isCompleted: false
      },
      completed: {
        title: "4. Поселення Завершено!", status: "Вітаємо! Усі етапи пройдено. Ваша перепустка активна.",
        icon: HomeSolidIcon,
        isActive: false, isCompleted: true
      }
    };
    const currentStageKey = settlementStatus?.currentStage || 'initial_application';
    const currentStageDefinition = stageDetails[currentStageKey] || stageDetails.initial_application;

    const stepsOrder = ['initial_application', 'reservation', 'agreement', 'completed'];
    const baseStageOfCurrent = currentStageKey.split('_')[0];
    const activeStageOrderIndex = stepsOrder.indexOf(baseStageOfCurrent);

    return (
      <div className={styles.dashboardLayout}>
        <Sidebar onToggle={handleSidebarToggle} isExpanded={isSidebarExpanded} />
        <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
          <Navbar isSidebarExpanded={isSidebarExpanded} onMenuToggle={() => handleSidebarToggle(!isSidebarExpanded)} />
          {isLoadingOverall ? (
            <div className={styles.loadingStateFullPage}>Завантаження даних...</div>
          ) : error ? (
            <div className={`${styles.errorMessageContainerFullPage} ${styles.centeredMessage}`}>
              <InformationCircleIcon className={styles.errorIconLarge} />
              <h3>Помилка завантаження</h3>
              <p>{error}</p>
              <button onClick={fetchStudentDashboardData} className={styles.retryButton}>Спробувати ще раз</button>
            </div>
          ) : dashboardData && settlementStatus ? (
            <> {/* Main content wrapper for student dashboard */}
              {!contextUser.is_profile_complete && (
                <Link to="/complete-profile" className={`${styles.completeProfilePrompt} ${styles.fullWidthPromptGridItem}`}>
                  <InformationCircleIcon />
                  Ваш профіль не заповнений. Будь ласка, завершіть реєстрацію для повного доступу до функцій.
                </Link>
              )}
              <div className={styles.studentDashboardGrid}>
                <div className={styles.leftColumn}> {/* Left column for settlement progress and recent activities */}
                  <section className={`${styles.section} ${styles.settlementProgressSection}`}>
                    <h2 className={styles.mainSectionTitle}>Мій Прогрес Поселення</h2>
                    <div className={styles.settlementStepsContainer}>
                      {stepsOrder.map((key, index) => {
                        let stageToRender = stageDetails[key];
                        let isStepActive = false;
                        let isStepCompleted = index < activeStageOrderIndex;

                        if (key === baseStageOfCurrent) {
                          stageToRender = currentStageDefinition;
                          isStepActive = currentStageDefinition.isActive;
                          isStepCompleted = currentStageDefinition.isCompleted;
                        } else if (key === 'initial_application' && currentStageKey === 'application_rejected') {
                          stageToRender = stageDetails.application_rejected;
                          isStepCompleted = true;
                        }

                        return (
                          <SettlementStep
                            key={key}
                            title={stageToRender.title}
                            status={stageToRender.status}
                            isActive={isStepActive}
                            isCompleted={isStepCompleted}
                            onClick={stageToRender.isActive && stageToRender.actionLink ? () => navigate(stageToRender.actionLink) : undefined}
                            actionText={stageToRender.actionText}
                            icon={stageToRender.icon}
                          />
                        );
                      })}
                    </div>
                  </section>

                  {dashboardData.applications && dashboardData.applications.length > 0 && (
                    <section className={`${styles.section} ${styles.listSectionItem}`}>
                      <div className={styles.listHeader}>
                        <h2 className={styles.sectionTitle}>Останні Заяви на Поселення</h2>
                        <Link to="/my-accommodation-applications" className={styles.viewAllLink}>Всі заяви ({dashboardData.applications.length})</Link>
                      </div>
                      <div className={styles.activityList}>
                        {dashboardData.applications.slice(0, 2).map(renderApplicationItem)}
                      </div>
                    </section>
                  )}
                </div>

                <div className={styles.rightColumn}> {/* Right column for pass, dorm info, quick actions, notifications */}
                  <section className={`${styles.section} ${styles.passCardWrapper}`}>
                    <h2 className={styles.sectionTitle}>Моя Перепустка</h2>
                    <DormPassCard />
                  </section>

                  {activePass && (contextUser.dormitory_name || contextUser.dormitory_id) && (
                    <section className={styles.section}>
                      <h2 className={styles.sectionTitle}><BuildingOffice2Icon className={styles.sectionTitleIconInternal} />Мій Гуртожиток</h2>
                      <div className={styles.dormInfoBlock}>
                        <p><strong>Назва:</strong> {contextUser.dormitory_name || `№${contextUser.dormitory_id}`}</p>
                        {/* Consider adding dorm address if available in contextUser or activePass */}
                        {activePass.dormitory_address && <p><strong>Адреса:</strong> {activePass.dormitory_address}</p>}
                        {activePass.room_display_number && <p><strong>Моя кімната:</strong> {activePass.room_display_number}</p>}
                      </div>
                    </section>
                  )}

                  {activePass && roommates.length > 0 && (
                    <section className={styles.section}>
                      <h2 className={styles.sectionTitle}><UsersIcon className={styles.sectionTitleIconInternal} />Мої Сусіди</h2>
                      <div className={styles.roommatesList}>
                        {roommates.map(mate => (
                          <div key={mate.id} className={styles.roommateItem}>
                            <Avatar user={{ avatar: mate.avatar, email: mate.name }} size={36} />
                            <div className={styles.roommateInfo}>
                              <span className={styles.roommateName}>{mate.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                  {activePass && roommates.length === 0 && !isLoadingData && (
                    <section className={styles.section}>
                      <h2 className={styles.sectionTitle}><UsersIcon className={styles.sectionTitleIconInternal} />Мої Сусіди</h2>
                      <p className={styles.noRoommatesMessage}>Інформація про сусідів наразі відсутня або Ви проживаєте один(а).</p>
                    </section>
                  )}

                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Швидкі Дії</h2>
                    <div className={styles.quickActions}>
                      {currentStageDefinition && currentStageDefinition.icon && currentStageDefinition.actionLink && currentStageDefinition.isActive && !currentStageDefinition.isCompleted && (
                        <QuickActionLink
                          to={currentStageDefinition.actionLink}
                          label={currentStageDefinition.actionText || "Перейти до етапу"}
                          icon={<currentStageDefinition.icon className={styles.quickActionIcon} />}
                          isPrimary={true}
                        />
                      )}
                      <QuickActionLink to="/services/accommodation-application" label="Заяви на Поселення" icon={<ClipboardDocumentCheckIcon />} />
                      <QuickActionLink to="/services/rooms/search" label="Знайти/Змінити Кімнату" icon={<MagnifyingGlassCircleIcon />} />
                      <QuickActionLink to="/my-accommodation-applications" label="Мої Активності" icon={<DocumentTextIcon />} />
                      <QuickActionLink to="/my-reservations" label="Мої Бронювання" icon={<BookmarkSquareIcon />} />
                      <QuickActionLink to="/profile" label="Мій Профіль" icon={<ProfileIconHero />} />
                    </div>
                  </section>

                  {dashboardData.notifications && dashboardData.notifications.length > 0 && (
                    <section className={`${styles.section}`}>
                      <div className={styles.listHeader}>
                        <h2 className={styles.sectionTitle}>Останні Сповіщення</h2>
                        <Link to="/settings?category=notifications" className={styles.viewAllLink}>Всі ({dashboardData.notifications.length})</Link>
                      </div>
                      <div className={styles.activityList}>
                        {dashboardData.notifications.slice(0, 3).map(renderNotificationItem)}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className={`${styles.errorMessageContainerFullPage} ${styles.centeredMessage}`}>
              <InformationCircleIcon className={styles.errorIconLarge} />
              <h3>Дані для дашборду не завантажено</h3>
              <p>Можливо, сервіс тимчасово недоступний або сталася помилка.</p>
              <button onClick={fetchStudentDashboardData} className={styles.retryButton}>Спробувати ще раз</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar onToggle={handleSidebarToggle} isExpanded={isSidebarExpanded} />
      <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
        <Navbar isSidebarExpanded={isSidebarExpanded} onMenuToggle={() => handleSidebarToggle(!isSidebarExpanded)} />
        <div className={styles.loadingStateFullPage}>
          {isLoadingOverall ? "Завантаження..." : `Панель для ролі "${contextUser?.role}" в розробці або перенаправлення...`}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;