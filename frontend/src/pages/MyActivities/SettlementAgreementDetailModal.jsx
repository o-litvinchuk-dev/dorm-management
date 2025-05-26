import React from 'react';
// Import the new dedicated CSS module for this modal
import modalDetailStyles from './styles/SettlementAgreementDetailModal.module.css';
import {
  ClipboardDocumentListIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ClockIcon,
  UserCircleIcon,
  InformationCircleIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';

const settlementAgreementStatusLabels = {
  pending_review: "На розгляді",
  approved: "Затверджено",
  rejected: "Відхилено",
  archived: "Архівовано"
};

const getStatusClass = (status) => {
  if (!status) return modalDetailStyles.statusDefault;
  const baseClass = modalDetailStyles.statusBadgeOnModal; // Use class from dedicated CSS
  switch (status.toLowerCase()) {
    case 'pending_review': return `${baseClass} ${modalDetailStyles.statusPending}`;
    case 'approved': return `${baseClass} ${modalDetailStyles.statusApproved}`;
    case 'rejected':
    case 'archived': return `${baseClass} ${modalDetailStyles.statusRejected}`;
    default: return `${baseClass} ${modalDetailStyles.statusDefault}`;
  }
};

const SettlementAgreementDetailModal = ({ agreement, onClose, isModalLoading, isDetailLimited }) => {
  if (!agreement) return null;

  const formatDate = (dateString) => {
    if (!dateString || dateString === "0000-00-00") return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A (некор. дата)';
      return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) { return 'N/A (помилка форматування)'; }
  };

  const formatFullDateTimeOrNA = (dateString) => {
    if (!dateString || dateString === "0000-00-00" || String(dateString).startsWith('[Помилка')) return <span className={modalDetailStyles.naText}>N/A</span>;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return <span className={modalDetailStyles.naText}>N/A (некор. дата)</span>;
      return date.toLocaleString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return <span className={modalDetailStyles.naText}>N/A (помилка форматування)</span>; }
  };

  const displayValueOrNA = (value, fieldName = "") => {
    if (value === null || value === undefined || String(value).trim() === "") return <span className={modalDetailStyles.naText}>N/A</span>;
    if (typeof value === "string" && value.startsWith("[Помилка розшифрування")) return <span className={modalDetailStyles.naText}>{`N/A (помилка розшифрування${fieldName ? ` для "${fieldName}"` : ''})`}</span>;
    if (typeof value === "string" && value.startsWith("[Помилка формату")) return <span className={modalDetailStyles.naText}>{value}</span>;
    return String(value);
  };

  return (
    <div className={modalDetailStyles.modalInnerContentScrollable}>
      <div className={modalDetailStyles.modalHeader}>
        <h2 className={modalDetailStyles.modalTitle}>
          <ClipboardDocumentListIcon className={`${modalDetailStyles.modalTitleIcon} ${modalDetailStyles.headerIcon}`} />
          Деталі Договору на Поселення #{agreement.id}
        </h2>
      </div>
      <div className={modalDetailStyles.modalBody}>
        {isModalLoading ? (
          <p className={modalDetailStyles.loadingMessage}>Завантаження деталей...</p>
        ) : (
          <>
            {!isDetailLimited && (
              <div className={modalDetailStyles.modalSection}>
                <h3 className={modalDetailStyles.modalSectionTitle}><UserCircleIcon /> Персональні дані</h3>
                <div className={modalDetailStyles.modalDetailGrid}>
                  <div className={modalDetailStyles.modalInfoItemWide}><strong>ПІБ (за договором):</strong> {displayValueOrNA(agreement.fullName, "ПІБ")}</div>
                  <div className={modalDetailStyles.modalInfoItem}><strong>Серія паспорта:</strong> {displayValueOrNA(agreement.passportSeries, "Серія паспорта")}</div>
                  <div className={modalDetailStyles.modalInfoItem}><strong>Номер паспорта:</strong> {displayValueOrNA(agreement.passportNumber, "Номер паспорта")}</div>
                  <div className={modalDetailStyles.modalInfoItem}><strong>ІПН:</strong> {displayValueOrNA(agreement.taxId, "ІПН")}</div>
                  <div className={modalDetailStyles.modalInfoItem}><strong>Телефон (за договором):</strong> {displayValueOrNA(agreement.residentPhone, "Телефон")}</div>
                </div>
              </div>
            )}

            <div className={modalDetailStyles.modalSection}>
              <h3 className={modalDetailStyles.modalSectionTitle}><BuildingOffice2Icon /> Інформація про поселення</h3>
              <div className={modalDetailStyles.modalInfoGrid}>
                <div className={modalDetailStyles.modalInfoItem}><strong>Гуртожиток:</strong> {agreement.dormitory_name_from_dormitories_table || `ID: ${agreement.dorm_number}` || 'N/A'}</div>
                <div className={modalDetailStyles.modalInfoItem}><strong>Кімната №:</strong> {agreement.room_number || 'N/A'}</div>
                <div className={modalDetailStyles.modalInfoItem}><strong>Факультет:</strong> {agreement.faculty_name || 'N/A'}</div>
                <div className={modalDetailStyles.modalInfoItem}><strong>Група:</strong> {agreement.group_name || 'N/A'}</div>
                <div className={modalDetailStyles.modalInfoItem}><strong>Курс:</strong> {agreement.course || 'N/A'}</div>
              </div>
            </div>

            <div className={modalDetailStyles.modalSection}>
              <h3 className={modalDetailStyles.modalSectionTitle}><CalendarDaysIcon /> Дати та статус</h3>
              <div className={modalDetailStyles.modalInfoGrid}>
                <div className={modalDetailStyles.modalInfoItem}><strong>Дата договору:</strong> {formatDate(agreement.contract_date)}</div>
                <div className={modalDetailStyles.modalInfoItem}><strong>Початок проживання:</strong> {formatDate(agreement.settlement_start_date)}</div>
                <div className={modalDetailStyles.modalInfoItem}><strong>Кінець проживання:</strong> {formatDate(agreement.settlement_end_date)}</div>
                <div className={modalDetailStyles.modalInfoItem}><strong>Статус:</strong> <span className={getStatusClass(agreement.status)}>{settlementAgreementStatusLabels[agreement.status] || agreement.status}</span></div>
                <div className={modalDetailStyles.modalInfoItemWide}><ClockIcon className={modalDetailStyles.inlineIconXs} /> <strong>Створено:</strong> {formatFullDateTimeOrNA(agreement.created_at)}</div>
                <div className={modalDetailStyles.modalInfoItemWide}><ClockIcon className={modalDetailStyles.inlineIconXs} /> <strong>Оновлено:</strong> {formatFullDateTimeOrNA(agreement.updated_at)}</div>
              </div>
            </div>

            {agreement.admin_notes && (
              <div className={modalDetailStyles.modalSection}>
                <h3 className={modalDetailStyles.modalSectionTitle}><ChatBubbleLeftEllipsisIcon /> Примітки адміністратора</h3>
                <p>{agreement.admin_notes}</p>
              </div>
            )}

            {isDetailLimited && (
              <p className={modalDetailStyles.infoTextModal}>Для перегляду повної інформації (включаючи особисті дані та додатки) зверніться до адміністрації гуртожитку або перегляньте деталі через відповідний розділ адмін-панелі, якщо маєте доступ.</p>
            )}
            {!isDetailLimited && (!agreement.inventory || agreement.inventory.length === 0) &&
              (!agreement.premisesConditions || agreement.premisesConditions.length === 0) &&
              (!agreement.electricalAppliances || agreement.electricalAppliances.length === 0) &&
              (
                <p className={modalDetailStyles.infoTextModal}>Додаткова інформація по Додатках 1, 2, 3 (інвентар, стан приміщення, електроприлади) не заповнена в цьому договорі.</p>
              )}
            {/* TODO: Add inventory, premisesConditions, electricalAppliances display when data is available and !isDetailLimited */}
          </>
        )}
      </div>
      <div className={modalDetailStyles.modalFooter}>
        <button onClick={onClose} className={`${modalDetailStyles.commonButton} ${modalDetailStyles.closeModalButtonWide}`}>
          Закрити
        </button>
      </div>
    </div>
  );
};

export default SettlementAgreementDetailModal;