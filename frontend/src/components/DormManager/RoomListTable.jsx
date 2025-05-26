import React from 'react';
import styles from './styles/RoomListTable.module.css';
import { ArrowUpIcon, ArrowDownIcon, EyeIcon, EyeSlashIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

const RoomListTable = ({
  rooms,
  onEdit,
  onDelete,
  actionLoading,
  // batchActionLoading, // Цей пропс не використовується безпосередньо в таблиці для блокування, але може бути корисним для індикації
  selectedRooms,
  onSelectRoom,
  onSelectAllRooms,
  sort,
  onSortChange,
  genderTypeLabels,
  currentGenderOccupancyLabels,
  isLoadingTable, // Новий пропс для індикатора завантаження
}) => {

  const handleSort = (key) => {
    if (!onSortChange) return;
    onSortChange(key);
  };

  const columns = [
    { key: 'select', label: (<input type="checkbox" onChange={onSelectAllRooms} checked={!isLoadingTable && rooms.length > 0 && selectedRooms.size === rooms.length} disabled={isLoadingTable || rooms.length === 0 || actionLoading} aria-label="Вибрати всі кімнати"/>), sortable: false, width: '5%' },
    { key: 'number', label: 'Номер', sortable: true, width: '10%' },
    { key: 'floor', label: 'Поверх', sortable: true, width: '10%' },
    { key: 'capacity', label: 'Місткість', sortable: true, width: '10%' },
    { key: 'occupied_places', label: 'Зайнято', sortable: true, width: '10%' },
    { key: 'gender_type', label: 'Тип статі', sortable: true, width: '15%' },
    { key: 'current_gender_occupancy', label: 'Поточна стать', sortable: false, width: '15%' },
    { key: 'is_reservable', label: 'Резерв.', sortable: true, width: '10%' },
    { key: 'description', label: 'Опис', sortable: false, width: 'auto' },
    { key: 'actions', label: 'Дії', sortable: false, width: '10%' },
  ];

  return (
    <div className={`${styles.tableContainer} ${isLoadingTable ? styles.tableLoadingOverlay : ''}`}>
      {isLoadingTable && <div className={styles.tableSpinner}>Завантаження...</div>}
      <table className={styles.roomsTable}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => col.sortable && handleSort(col.key)}
                className={`${styles.th} ${col.sortable ? styles.sortableHeader : ''}`}
                style={{ width: col.width }}
                aria-sort={col.sortable && sort.sortBy === col.key ? (sort.sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
              >
                <div className={styles.headerContent}>
                  {col.label}
                  {col.sortable && sort.sortBy === col.key && (
                    sort.sortOrder === 'asc' ? <ArrowUpIcon className={styles.sortIcon} /> : <ArrowDownIcon className={styles.sortIcon} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room.id} className={selectedRooms.has(room.id) ? styles.selectedRow : ''}>
              <td data-label="Вибрати" className={styles.tdCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedRooms.has(room.id)}
                  onChange={() => onSelectRoom(room.id)}
                  disabled={actionLoading || isLoadingTable}
                  aria-label={`Вибрати кімнату ${room.number}`}
                />
              </td>
              <td data-label="Номер">{room.number}</td>
              <td data-label="Поверх">{room.floor !== null ? room.floor : 'Н/Д'}</td>
              <td data-label="Місткість">{room.capacity}</td>
              <td data-label="Зайнято">{room.occupied_places}</td>
              <td data-label="Тип статі">{genderTypeLabels[room.gender_type] || room.gender_type}</td>
              <td data-label="Поточна стать">{currentGenderOccupancyLabels[room.current_gender_occupancy] || room.current_gender_occupancy}</td>
              <td data-label="Резервується" className={styles.reservableCell}>
                {room.is_reservable ? <EyeIcon className={styles.reservableIconTrue} title="Доступна для резервування"/> : <EyeSlashIcon className={styles.reservableIconFalse} title="Не доступна для резервування"/>}
              </td>
              <td data-label="Опис" className={styles.descriptionCell} title={room.description || ''}>
                {room.description ? `${room.description.substring(0, 40)}${room.description.length > 40 ? '...' : ''}` : '–'}
              </td>
              <td data-label="Дії" className={styles.actionsCell}>
                <button onClick={() => onEdit(room)} className={`${styles.actionButton} ${styles.editButton}`} disabled={actionLoading || isLoadingTable} title="Редагувати">
                  <PencilSquareIcon />
                </button>
                <button onClick={() => onDelete(room.id)} className={`${styles.actionButton} ${styles.deleteButton}`} disabled={actionLoading || isLoadingTable} title="Видалити">
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