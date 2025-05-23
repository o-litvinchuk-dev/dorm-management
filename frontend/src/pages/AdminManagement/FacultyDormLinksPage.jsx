// frontend/src/pages/AdminManagement/FacultyDormLinksPage.jsx
import React, { useState, useEffect } from "react";
import FacultyDormLinkForm from "../../components/Admin/FacultyDormLinkForm";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "./styles/FacultyDormLinksPage.module.css";

const FacultyDormLinksPage = () => {
  const [links, setLinks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await api.get("/api/v1/faculty-dormitories");
      setLinks(response.data);
    } catch (error) {
      ToastService.handleApiError(error);
    }
  };

  const handleDelete = async (facultyId, dormitoryId) => {
    try {
      await api.delete(`/api/v1/faculty-dormitories/${facultyId}/${dormitoryId}`);
      setLinks(links.filter((l) => l.faculty_id !== facultyId || l.dormitory_id !== dormitoryId));
      ToastService.success("Зв'язок видалено");
    } catch (error) {
      ToastService.handleApiError(error);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Призначення гуртожитків факультетам</h1>
      <button onClick={() => setIsModalOpen(true)} className={styles.addButton}>
        Додати зв'язок
      </button>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Факультет</th>
            <th>Гуртожиток</th>
            <th>Квота</th>
            <th>Дії</th>
          </tr>
        </thead>
        <tbody>
          {links.map((link) => (
            <tr key={`${link.faculty_id}-${link.dormitory_id}`}>
              <td>{link.faculty_name}</td>
              <td>{link.dormitory_name}</td>
              <td>{link.quota}</td>
              <td>
                <button
                  onClick={() => {
                    setSelectedLink(link);
                    setIsModalOpen(true);
                  }}
                  className={styles.editButton}
                >
                  Редагувати
                </button>
                <button
                  onClick={() => handleDelete(link.faculty_id, link.dormitory_id)}
                  className={styles.deleteButton}
                >
                  Видалити
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {isModalOpen && (
        <FacultyDormLinkForm
          link={selectedLink}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLink(null);
          }}
          onSuccess={fetchLinks}
        />
      )}
    </div>
  );
};

export default FacultyDormLinksPage;