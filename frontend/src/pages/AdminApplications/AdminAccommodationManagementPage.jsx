import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import Filters from "../../components/Admin/Filters";
import ApplicationsTable from "../../components/Admin/ApplicationsTable";
import Pagination from "../../components/Admin/Pagination";
import ApplicationDetailModal from "../../components/Admin/ApplicationDetailModal";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "./styles/AdminApplicationsPage.module.css";

const AdminAccommodationManagementPage = () => {
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
  const [error, setError] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Remove empty filters
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
      setApplications(response.data.applications);
      setPagination((prev) => ({
        ...prev,
        total: response.data.total,
      }));
    } catch (err) {
      setError("Не вдалося завантажити заявки");
      ToastService.handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, sort, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

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

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/admin/accommodation-applications/${id}/status`, { status });
      ToastService.success("Статус оновлено");
      fetchApplications();
      setSelectedApplication((prev) =>
        prev && prev.id === id ? { ...prev, status } : prev
      );
    } catch (err) {
      ToastService.handleApiError(err);
    }
  };

  const handleAddComment = async (id, comment) => {
    try {
      const response = await api.post(`/admin/accommodation-applications/${id}/comments`, {
        comment,
      });
      ToastService.success("Коментар додано");
      return response.data.comment;
    } catch (err) {
      ToastService.handleApiError(err);
      throw err;
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div
        className={`${styles.mainContent} ${
          !isSidebarExpanded ? styles.sidebarCollapsed : ""
        }`}
      >
        <Navbar
          isSidebarExpanded={isSidebarExpanded}
          onMenuToggle={() => setIsSidebarExpanded((prev) => !prev)}
        />
        <div className={styles.container}>
          <h2>Керування заявками на поселення</h2>
          <Filters
            category="accommodation"
            filters={filters}
            onFilterChange={handleFilterChange}
          />
          {isLoading ? (
            <p>Завантаження...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <>
              <ApplicationsTable
                category="accommodation"
                applications={applications}
                onViewDetails={handleViewDetails}
                sort={sort}
                onSortChange={handleSortChange}
              />
              <Pagination
                page={pagination.page}
                limit={pagination.limit}
                total={pagination.total}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
            </>
          )}
          {selectedApplication && (
            <ApplicationDetailModal
              category="accommodation"
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