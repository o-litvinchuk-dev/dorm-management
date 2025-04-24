import React from "react";

const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `#${Array.from({ length: 3 }, (_, i) =>
    ((hash >> (i * 8)) & 0xFF).toString(16).padStart(2, "0")
  ).join("")}`;
};

const getInitials = (email) => {
  if (!email) return "U";
  return email
    .split("@")[0]
    .split(/[._]/)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

const Avatar = ({ user, size = 96 }) => {
  const avatarUrl = user?.avatar ? `${user.avatar}?${Date.now()}` : null;
  const initials = getInitials(user?.email);
  const backgroundColor = stringToColor(user?.email || "user");

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: avatarUrl ? "transparent" : backgroundColor,
        color: avatarUrl ? "transparent" : "#fff",
        fontSize: size / 2,
        fontWeight: "bold",
        overflow: "hidden",
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Avatar"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain", // Зображення вміщається повністю
            objectPosition: "center", // Центрування
            borderRadius: "50%",
          }}
          onError={(e) => (e.target.style.display = "none")}
          referrerPolicy="no-referrer"
        />
      ) : (
        initials
      )}
    </div>
  );
};

export default Avatar;