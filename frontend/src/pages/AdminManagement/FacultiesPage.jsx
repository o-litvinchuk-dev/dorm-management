// frontend/src/pages/AdminManagement/FacultiesPage.jsx
import React, { useState, useEffect } from "react";
import FacultyTable from "../../components/Admin/FacultyTable";
import FacultyForm from "../../components/Admin/FacultyForm";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "./styles/FacultiesPage.module.css";

const FacultiesPage = () => {
  const [faculties, setFaculties] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      const response = await api.get("/api/v1/faculties");
      setFaculties(response.data);
    } catch (error) {
      ToastService.handleApiError(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/v1/faculties/${id}`);
      setFaculties(faculties.filter((f) => f.id !== id));
      ToastService.success("Факультет видалено");
    } catch (error) {
      ToastService.handleApiError(error);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Управління факультетами</h1>
      <button onClick={() => setIsModalOpen(true)} className={styles.addButton}>
        Додати факультет
      </button>
      <FacultyTable
        faculties={faculties}
        onEdit={(faculty) => {
          setSelectedFaculty(faculty);
          setIsModalOpen(true);
        }}
        onDelete={handleDelete}
      />
      {isModalOpen && (
        <FacultyForm
          faculty={selectedFaculty}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedFaculty(null);
          }}
          onSuccess={fetchFaculties}
        />
      )}
    </div>
  );
};

export default FacultiesPage;