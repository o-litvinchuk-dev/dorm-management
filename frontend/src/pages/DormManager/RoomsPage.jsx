import React, { useState, useEffect } from "react";
import RoomForm from "../../components/DormManager/RoomForm";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import { useUser } from "../../contexts/UserContext";
import styles from "./styles/RoomsPage.module.css";

const RoomsPage = () => {
  const { user } = useUser();
  const [rooms, setRooms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get(`/api/v1/dormitories/${user.dormitory_id}/rooms`);
      setRooms(response.data);
    } catch (error) {
      ToastService.handleApiError(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/v1/dormitories/${user.dormitory_id}/rooms/${id}`);
      setRooms(rooms.filter((r) => r.id !== id));
      ToastService.success("Кімнату видалено");
    } catch (error) {
      ToastService.handleApiError(error);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Управління кімнатами</h1>
      <button onClick={() => setIsModalOpen(true)} className={styles.addButton}>
        Додати кімнату
      </button>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Номер</th>
            <th>Місткість</th>
            <th>Опис</th>
            <th>Дії</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room.id}>
              <td>{room.id}</td>
              <td>{room.number}</td>
              <td>{room.capacity}</td>
              <td>{room.description || "Н/Д"}</td>
              <td>
                <button
                  onClick={() => {
                    setSelectedRoom(room);
                    setIsModalOpen(true);
                  }}
                  className={styles.editButton}
                >
                  Редагувати
                </button>
                <button
                  onClick={() => handleDelete(room.id)}
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
        <RoomForm
          room={selectedRoom}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRoom(null);
          }}
          onSuccess={fetchRooms}
        />
      )}
    </div>
  );
};

export default RoomsPage;