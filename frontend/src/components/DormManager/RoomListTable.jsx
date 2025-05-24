import React from 'react';
import styles from './styles/RoomListTable.module.css'; // Create this CSS file
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const RoomListTable = ({ rooms, onEdit, onDelete, actionLoading }) => {
  const genderTypeLabels = {
    any: 'Будь-яка',
    male: 'Чоловіча',
    female: 'Жіноча',
    mixed: 'Змішана',
  };

  const currentGenderOccupancyLabels = {
    empty: 'Порожня',
    male: 'Чоловіки',
    female: 'Жінки',
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.roomsTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Номер</th>
            <th>Місткість</th>
            <th>Поверх</th>
            <th>Тип (стать)</th>
            <th>Зайнято</th>
            <th>Поточна стать</th>
            <th>Резервується</th>
            <th>Опис</th>
            <th className={styles.actionsHeader}>Дії</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room.id}>
              <td>{room.id}</td>
              <td>{room.number}</td>
              <td>{room.capacity}</td>
              <td>{room.floor !== null ? room.floor : 'N/A'}</td>
              <td>{genderTypeLabels[room.gender_type] || room.gender_type}</td>
              <td>{room.occupied_places}</td>
              <td>{currentGenderOccupancyLabels[room.current_gender_occupancy] || room.current_gender_occupancy}</td>
              <td>{room.is_reservable ? 'Так' : 'Ні'}</td>
              <td className={styles.descriptionCell} title={room.description || ''}>
                {room.description ? `${room.description.substring(0, 40)}${room.description.length > 40 ? '...' : ''}` : 'N/A'}
              </td>
              <td className={styles.actionsCell}>
                <button
                  onClick={() => onEdit(room)}
                  className={`${styles.actionButton} ${styles.editButton}`}
                  disabled={actionLoading}
                  title="Редагувати"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => onDelete(room.id)}
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  disabled={actionLoading}
                  title="Видалити"
                >
                  <TrashIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RoomListTable;