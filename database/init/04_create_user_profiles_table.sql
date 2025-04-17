CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INT PRIMARY KEY,
    birthday DATE,
    phone VARCHAR(13),
    about_me TEXT,
    interests VARCHAR(255),
    room VARCHAR(10),
    dormitory VARCHAR(50),
    instagram VARCHAR(255),
    telegram VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;