import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../utils/api';
import styles from './styles/DormPassCard.module.css';
import Avatar from '../UI/Avatar/Avatar';
import { ArrowsRightLeftIcon, QrCodeIcon, TicketIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const DormPassCard = () => {
  const [passData, setPassData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPass = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/secure/my-pass');
        setPassData(response.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setPassData(null);
          setError("Активну перепустку не знайдено. Вона генерується після підтвердження поселення.");
        } else {
          console.error("Error fetching pass:", err);
          setError("Помилка завантаження перепустки. Спробуйте оновити сторінку.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchPass();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return 'N/A'; }
  };

  if (isLoading) {
    return <div className={`${styles.passCardPlaceholder} ${styles.loadingState}`}>Завантаження перепустки...</div>;
  }

  if (error && !passData) {
    return (
      <div className={`${styles.passCardPlaceholder} ${styles.errorState}`}>
        <InformationCircleIcon className={styles.placeholderIcon} />
        <h4>Помилка Перепустки</h4>
        <p>{error}</p>
        <p className={styles.smallText}>Якщо ви вважаєте, що це помилка, зверніться до адміністрації.</p>
      </div>
    );
  }

  if (!passData) {
    return (
      <div className={`${styles.passCardPlaceholder} ${styles.noPassState}`}>
        <TicketIcon className={styles.placeholderIcon} />
        <h4>Перепустка Відсутня</h4>
        <p>Активна перепустка для вас ще не згенерована. Зазвичай вона створюється після підтвердження поселення.</p>
      </div>
    );
  }

  const qrValue = `${window.location.origin}/verify-pass-public/${passData.pass_identifier}`;

  return (
    <div className={styles.passCardContainer} onClick={() => setIsFlipped(!isFlipped)}
      role="button" tabIndex="0" aria-pressed={isFlipped}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsFlipped(!isFlipped); }}
      aria-label={`Перепустка, дійсна до ${formatDate(passData.valid_until)}. Натисніть, щоб побачити QR-код.`}
    >
      <div className={`${styles.passCard} ${isFlipped ? styles.isFlipped : ''}`}>
        <div className={styles.passFront}>
          <div className={styles.passHeader}>
            <h4>ПЕРЕПУСТКА В ГУРТОЖИТОК</h4>
            <img src="/logo2.svg" alt="Dorm Life" className={styles.passLogo} />
          </div>
          <div className={styles.passBody}>
            <div className={styles.studentPhoto}>
              <Avatar user={{ avatar: passData.student_avatar, email: passData.student_name || 'студент' }} size={80} />
            </div>
            <div className={styles.studentInfo}>
              <p className={styles.studentName}>{passData.student_name || 'Студент'}</p>
              <p><strong>Факультет:</strong> {passData.faculty_name || 'N/A'}</p>
              <p><strong>Гуртожиток:</strong> {passData.dormitory_name || 'N/A'}</p>
              <p><strong>Кімната:</strong> {passData.room_display_number || 'N/A'}</p>
            </div>
          </div>
          <div className={styles.passFooter}>
            <span>Дійсна до: <strong>{formatDate(passData.valid_until)}</strong></span>
            <span className={styles.flipIndicator}>
              <ArrowsRightLeftIcon className={styles.iconSmall} /> QR-код
            </span>
          </div>
        </div>
        <div className={styles.passBack}>
          <div className={styles.qrHeader}>
            <QrCodeIcon className={styles.iconMedium} /> Покажіть цей QR-код для перевірки
          </div>
          <div className={styles.qrCodeWrapper}>
            {qrValue && <QRCodeSVG value={qrValue} size={150} level="M" includeMargin={false} bgColor="#ffffff" fgColor="#1f2937" />}
          </div>
          <div className={styles.passFooterBack}>
            <span className={styles.flipIndicator}>
              <ArrowsRightLeftIcon className={styles.iconSmall} /> Деталі
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DormPassCard;