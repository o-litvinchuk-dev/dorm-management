import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../utils/api"; // Use the shared API instance
import styles from "../Profile/styles/ProfilePage.module.css"; // Reuse existing styles
import Avatar from "../../components/UI/Avatar/Avatar";
import instagramIcon from "../../images/instagram-icon.svg";
import telegramIcon from "../../images/telegram-icon.svg";

const PublicUserProfilePage = () => {
  const { userId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPublicProfile = async () => {
      setLoading(true);
      setError('');
      try {
        // Use the public API endpoint (without authentication)
        const { data } = await api.public.get(`/public/users/${userId}/profile`);
        setProfileData(data);
      } catch (err) {
        console.error("[PublicUserProfilePage] Error fetching public profile:", err);
        setError(err.response?.data?.error || 'Не вдалося завантажити профіль користувача.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [userId]);

  if (loading) {
    return <div className={styles.loading}>Завантаження профілю...</div>;
  }

  if (error) {
    return <div className={`${styles.profileLayout} ${styles.centeredMessage}`}><p className={styles.errorMessage}>{error}</p></div>;
  }

  if (!profileData) {
    return <div className={`${styles.profileLayout} ${styles.centeredMessage}`}><p className={styles.errorMessage}>Профіль не знайдено або він не є публічним.</p></div>;
  }

  // Simplified role display for public view
  const getPublicRoleDisplay = (role) => {
    switch (role) {
      case "student": return "Студент";
      case "admin":
      case "superadmin": return "Адміністратор";
      case "faculty_dean_office": return "Співробітник деканату";
      case "dorm_manager": return "Комендант гуртожитку";
      case "student_council_head": return "Голова студентської ради";
      case "student_council_member": return "Член студентської ради";
      default: return "Користувач";
    }
  };

  return (
    <div className={styles.profileLayout} style={{ padding: '20px', height: 'auto', minHeight: '100vh' }}>
      <div className={styles.profileContainer} style={{ maxWidth: '800px', margin: '20px auto', padding: '24px' }}>
        <div className={styles.profileHeader} style={{ height: '120px', margin: '-24px -24px 0 -24px' }}></div>
        <div className={styles.profileBody} style={{ padding: '1rem 0' }}>
          <div className={styles.profileContent} style={{ padding: '0 16px' }}>
            <div className={styles.profileTopSection} style={{ marginTop: '-60px' }}>
              <div className={styles.mainInfo}>
                <div className={styles.avatarWrapper} style={{ width: '100px', height: '100px' }}>
                  <Avatar user={profileData} size={100} />
                  <div className={styles.socialLinks} style={{ marginTop: '0.5rem' }}>
                    {profileData.instagram && (
                      <a
                        href={`https://www.instagram.com/${profileData.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Instagram: ${profileData.instagram}`}
                      >
                        <img src={instagramIcon} alt="Instagram" className={styles.socialIcon} style={{ width: '28px', height: '28px' }} />
                      </a>
                    )}
                    {profileData.telegram && (
                      <a
                        href={`https://t.me/${profileData.telegram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Telegram: ${profileData.telegram}`}
                      >
                        <img src={telegramIcon} alt="Telegram" className={styles.socialIcon} style={{ width: '28px', height: '28px' }} />
                      </a>
                    )}
                  </div>
                </div>
                <div className={styles.userInfo}>
                  <h1 className={styles.userName} style={{ fontSize: '1.8rem' }}>{profileData.name}</h1>
                  <span className={styles.userStatus} style={{ fontSize: '0.85rem' }}>{getPublicRoleDisplay(profileData.role)}</span>
                </div>
              </div>
            </div>

            <div className={styles.infoGrid} style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
              {profileData.about_me && (
                <div className={styles.infoSection}>
                  <h3>Про себе</h3>
                  <p>{profileData.about_me}</p>
                </div>
              )}
              {profileData.interests && (
                <div className={styles.infoSection}>
                  <h3>Інтереси</h3>
                  <p>{profileData.interests}</p>
                </div>
              )}
              {(profileData.dormitory || profileData.room || profileData.faculty_name || profileData.group_name || profileData.course) && (
                <div className={styles.infoSection}>
                  <h3>Додаткова інформація</h3>
                  <div className={styles.detailsGrid}>
                    {profileData.faculty_name && (
                      <div>
                        <label>Факультет:</label>
                        <span>{profileData.faculty_name}</span>
                      </div>
                    )}
                    {profileData.group_name && (
                      <div>
                        <label>Група:</label>
                        <span>{profileData.group_name}</span>
                      </div>
                    )}
                    {profileData.course && (
                      <div>
                        <label>Курс:</label>
                        <span>{profileData.course}</span>
                      </div>
                    )}
                    {profileData.dormitory && (
                      <div>
                        <label>Гуртожиток:</label>
                        <span>{profileData.dormitory}</span>
                      </div>
                    )}
                    {profileData.room && (
                      <div>
                        <label>Кімната:</label>
                        <span>{profileData.room}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicUserProfilePage;