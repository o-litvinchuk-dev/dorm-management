import React, { useState, useEffect } from "react";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import ApplicationsTable from "../../components/Admin/ApplicationsTable";
import Filters from "../../components/Admin/Filters";
import Pagination from "../../components/Admin/Pagination";
import ApplicationDetailModal from "../../components/Admin/ApplicationDetailModal";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "./styles/AdminApplicationsPage.module.css";

const AdminAccommodationManagementPage = () => {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    dateFrom: "",
    dateTo: "",
    search: "",
    dormNumber: "",
  });
  const [sort, setSort] = useState({ field: "created_at", order: "desc" });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          sort: sort.field,
          order: sort.order,
          ...filters,
        };
        const response = await api.get("/admin/accommodation-applications", { params });
        setApplications(response.data.applications || []);
        setPagination((prev) => ({
          ...prev,
          total: response.data.total || 0,
        }));
      } catch (error) {
        console.error("[AdminAccommodationManagementPage] Помилка отримання даних:", error);
        setError(error);
        ToastService.serverError(
          error.response?.status,
          error.response?.data?.error || "Не вдалося отримати заявки на проживання"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchApplications();
  }, [filters, sort, pagination.page, pagination.limit]);

  const handleSort = (field) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/admin/accommodation-applications/${id}/status`, { status });
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status } : app))
      );
      ToastService.success("Статус оновлено");
    } catch (error) {
      ToastService.serverError(
        error.response?.status,
        error.response?.data?.error || "Не вдалося оновити статус"
      );
    }
  };

  const handleAddComment = async (id, comment) => {
    try {
      await api.post(`/admin/accommodation-applications/${id}/comments`, { comment });
      ToastService.success("Коментар додано");
    } catch (error) {
      ToastService.serverError(
        error.response?.status,
        error.response?.data?.error || "Не вдалося додати коментар"
      );
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
        <Navbar
          isSidebarExpanded={isSidebarExpanded}
          onMenuToggle={() => setIsSidebarExpanded((prev) => !prev)}
        />
        <div className={styles.container}>
          <h2>Управління заявками на проживання</h2>
          <Filters onChange={setFilters} />
          {isLoading ? (
            <div className={styles.loading}>Завантаження...</div>
          ) : error ? (
            <div className={styles.error}>
              Помилка: {error.response?.data?.error || "Не вдалося завантажити дані"}
            </div>
          ) : applications.length === 0 ? (
            <div className={styles.empty}>Заявки відсутні</div>
          ) : (
            <>
              <ApplicationsTable
                applications={applications}
                onSort={handleSort}
                sort={sort}
                onOpenDetails={setSelectedApplication}
              />
              <Pagination
                total={pagination.total}
                page={pagination.page}
                limit={pagination.limit}
                onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
                onLimitChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
              />
            </>
          )}
          {selectedApplication && (
            <ApplicationDetailModal
              application={selectedApplication}
              onClose={() => setSelectedApplication(null)}
              onStatusUpdate={handleStatusUpdate}
              onAddComment={handleAddComment}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAccommodationManagementPage;