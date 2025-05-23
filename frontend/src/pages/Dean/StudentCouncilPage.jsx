// frontend/src/pages/Dean/StudentCouncilPage.jsx
import React, { useState, useEffect } from "react";
import StudentCouncilForm from "../../components/Dean/StudentCouncilForm";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import { useUser } from "../../contexts/UserContext";
import styles from "./styles/StudentCouncilPage.module.css";

const StudentCouncilPage = () => {
  const { user } = useUser();
  const [members, setMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/api/v1/faculties/${user.faculty_id}/student-council`);
      setMembers(response.data);
    } catch (error) {
      ToastService.handleApiError(error);
    }
  };

  const handleRemove = async (userId) => {
    try {
      await api.put(`/api/v1/users/${userId}/role`, { role: "student", faculty_id: null });
      setMembers(members.filter((m) => m.id !== userId));
      ToastService.success("Студента видалено зі студради");
    } catch (error) {
      ToastService.handleApiError(error);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Управління студентською радою</h1>
      <button onClick={() => setIsModalOpen(true)} className={styles.addButton}>
        Призначити студента
      </button>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>ПІБ</th>
            <th>Роль</th>
            <th>Дії</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>{member.id}</td>
              <td>{member.name}</td>
              <td>{member.role === "student_council_head" ? "Голова" : "Член"}</td>
              <td>
                <button
                  onClick={() => handleRemove(member.id)}
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
        <StudentCouncilForm
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchMembers}
        />
      )}
    </div>
  );
};

export default StudentCouncilPage;