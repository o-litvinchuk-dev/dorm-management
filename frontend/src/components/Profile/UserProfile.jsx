import React, { useState } from "react";
import styles from "./UserProfile.module.css";
import { PencilIcon, XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";
import instagramIcon from "../../images/instagram-icon.svg";
import telegramIcon from "../../images/telegram-icon.svg";

const UserProfile = ({ userData, onUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: userData.name || "",
    email: userData.email || "",
    status: userData.status || "",
    about: userData.about_me || "",
    interests: userData.interests || "",
    dormitory: userData.dormitory || "",
    room: userData.room || "",
    faculty: userData.faculty || "",
    course: userData.course || "",
    instagram: userData.instagram || "",
    telegram: userData.telegram || ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
    setEditMode(false);
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileHeader}></div>

      <div className={styles.profileBody}>
        <div className={styles.profileContent}>
          <div className={styles.profileTopSection}>
            <div className={styles.mainInfo}>
              <div className={styles.avatarWrapper}>
                <div className={styles.avatar}>
                  {userData.avatar && <img src={userData.avatar} alt="Avatar" />}
                </div>
                <div className={styles.socialLinks}>
                  {formData.instagram && (
                    <a href={`https://instagram.com/${formData.instagram}`} target="_blank" rel="noopener noreferrer">
                      <img src={instagramIcon} alt="Instagram" className={styles.socialIcon} />
                    </a>
                  )}
                  {formData.telegram && (
                    <a href={`https://t.me/${formData.telegram}`} target="_blank" rel="noopener noreferrer">
                      <img src={telegramIcon} alt="Telegram" className={styles.socialIcon} />
                    </a>
                  )}
                </div>
              </div>
              
              <div className={styles.userInfo}>
                {editMode ? (
                  <input 
                    className={styles.nameInput}
                    value={formData.fullName}
                    onChange={handleChange}
                    name="fullName"
                  />
                ) : (
                  <h1 className={styles.userName}>{formData.fullName}</h1>
                )}
                <p className={styles.userEmail}>{formData.email}</p>
                <span className={styles.userStatus}>{formData.status}</span>
              </div>
            </div>

            <button 
              className={styles.editButton}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? (
                <XMarkIcon className={styles.editIcon} />
              ) : (
                <PencilIcon className={styles.editIcon} />
              )}
            </button>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoSection}>
              <h3>Про себе</h3>
              {editMode ? (
                <textarea
                  className={styles.textarea}
                  value={formData.about}
                  onChange={handleChange}
                  name="about"
                />
              ) : (
                <p>{formData.about}</p>
              )}
            </div>

            <div className={styles.infoSection}>
              <h3>Інтереси</h3>
              {editMode ? (
                <input
                  className={styles.inputField}
                  value={formData.interests}
                  onChange={handleChange}
                  name="interests"
                />
              ) : (
                <p>{formData.interests}</p>
              )}
            </div>

            <div className={styles.infoSection}>
              <h3>Поселення</h3>
              <div className={styles.detailsGrid}>
                <div>
                  <label>Гуртожиток:</label>
                  {editMode ? (
                    <input
                      className={styles.inputField}
                      value={formData.dormitory}
                      onChange={handleChange}
                      name="dormitory"
                    />
                  ) : (
                    <span>{formData.dormitory}</span>
                  )}
                </div>
                <div>
                  <label>Кімната:</label>
                  {editMode ? (
                    <input
                      className={styles.inputField}
                      value={formData.room}
                      onChange={handleChange}
                      name="room"
                    />
                  ) : (
                    <span>{formData.room}</span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.infoSection}>
              <h3>Освіта</h3>
              <div className={styles.detailsGrid}>
                <div>
                  <label>Факультет:</label>
                  {editMode ? (
                    <input
                      className={styles.inputField}
                      value={formData.faculty}
                      onChange={handleChange}
                      name="faculty"
                    />
                  ) : (
                    <span>{formData.faculty}</span>
                  )}
                </div>
                <div>
                  <label>Курс:</label>
                  {editMode ? (
                    <input
                      className={styles.inputField}
                      value={formData.course}
                      onChange={handleChange}
                      name="course"
                    />
                  ) : (
                    <span>{formData.course}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {editMode && (
            <button className={styles.saveButton} onClick={handleSubmit}>
              <CheckIcon className={styles.checkIcon} />
              Зберегти зміни
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;