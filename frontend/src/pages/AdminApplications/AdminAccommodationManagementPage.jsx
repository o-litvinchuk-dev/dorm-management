import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import Filters from "../../components/Admin/Filters";
import ApplicationsTable from "../../components/Admin/ApplicationsTable";
import Pagination from "../../components/Admin/Pagination";
import ApplicationDetailModal from "../../components/Admin/ApplicationDetailModal";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "./styles/AdminAccommodationManagementPage.module.css";
import { useUser } from "../../contexts/UserContext";
import { XMarkIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

const AdminAccommodationManagementPage = () => {
  const { user } = useUser();
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    dormNumber: "",
  });
  const [sort, setSort] = useState({ sortBy: "created_at", sortOrder: "desc" });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });
  const canUpdateStatus = ["admin", "superadmin", "faculty_dean_office", "dorm_manager"].includes(user?.role);
  const canAddComment = user?.role && !["student_council_member"].includes(user?.role);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== "")
        ),
      };
      const response = await api.get("/admin/accommodation-applications", {
        params: queryParams,
      });
      setApplications(response.data.applications || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.total || 0,
      }));
    } catch (err) {
      setError("Не вдалося завантажити заявки. Спробуйте оновити сторінку.");
      ToastService.handleApiError(err);
      setApplications([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
    } finally {
      setIsLoading(false);
    }
  }, [filters, sort, pagination.page, pagination.limit]);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [fetchApplications, user]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (sortBy, sortOrder) => {
    setSort({ sortBy, sortOrder });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
  };

  const handleCloseModal = () => {
    setSelectedApplication(null);
  };

  const handleStatusUpdate = async (id, status, _unusedRoomData = {}) => {
    if (!canUpdateStatus) {
      ToastService.error("Недостатньо прав для зміни статусу");
      return;
    }
    setIsModalLoading(true);
    try {
      const payload = { status };
      await api.put(`/admin/accommodation-applications/${id}/status`, payload);
      ToastService.success("Статус оновлено");
      const updatedApplications = applications.map((app) =>
        app.id === id ? { ...app, status: status } : app
      );
      setApplications(updatedApplications);
      if (selectedApplication && selectedApplication.id === id) {
        setSelectedApplication((prevApp) => ({ ...prevApp, status: status }));
      }
    } catch (err) {
      ToastService.handleApiError(err);
      throw err;
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleAddComment = async (id, commentText) => {
    if (!canAddComment) {
      ToastService.error("Недостатньо прав для додавання коментаря");
      return null;
    }
    setIsModalLoading(true);
    try {
      const response = await api.post(`/admin/accommodation-applications/${id}/comments`, {
        comment: commentText,
      });
      ToastService.success("Коментар додано");
      fetchApplications();
      return response.data.comment;
    } catch (err) {
      ToastService.handleApiError(err);
      throw err;
    } finally {
      setIsModalLoading(false);
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div
        className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}
      >
        <Navbar
          isSidebarExpanded={isSidebarExpanded}
          onMenuToggle={() => setIsSidebarExpanded((prev) => !prev)}
        />
        <main className={styles.pageContainer}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              <DocumentTextIcon className={styles.titleIcon} />
              Керування заявками на поселення
            </h1>
          </div>
          <div className={styles.contentWrapper}>
            <Filters
              category="accommodation"
              filters={filters}
              onFilterChange={handleFilterChange}
            />
            {isLoading ? (
              <div className={styles.loading}>Завантаження...</div>
            ) : error ? (
              <div className={styles.errorMessage}>{error}</div>
            ) : applications.length === 0 && !isLoading ? (
              <p className={styles.emptyMessage}>Заявки за обраними фільтрами відсутні.</p>
            ) : (
              <ApplicationsTable
                category="accommodation"
                applications={applications}
                onViewDetails={handleViewDetails}
                sort={sort}
                onSortChange={handleSortChange}
                canUpdateStatus={canUpdateStatus}
                canAddComment={canAddComment}
              />
            )}
          </div>
          {!isLoading && !error && applications.length > 0 && pagination.total > pagination.limit && (
            <div className={styles.paginationWrapper}>
              <Pagination
                page={pagination.page}
                limit={pagination.limit}
                total={pagination.total}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
            </div>
          )}
        </main>
        {selectedApplication && (
          <div
            className={styles.modalOverlay}
            onClick={handleCloseModal}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleCloseModal}
                className={styles.closeButtonIcon}
                aria-label="Закрити деталі заявки"
              >
                <XMarkIcon />
              </button>
              <ApplicationDetailModal
                application={selectedApplication}
                onClose={handleCloseModal}
                onStatusUpdate={handleStatusUpdate}
                onAddComment={handleAddComment}
                isModalLoading={isModalLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAccommodationManagementPage;