import React, { useState } from "react";

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
  const [showInitials, setShowInitials] = useState(!avatarUrl);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: avatarUrl && !showInitials ? "#f0f0f0" : backgroundColor, // Light gray for image background, colored for initials
        color: avatarUrl && !showInitials ? "transparent" : "#fff",
        fontSize: size / 2,
        fontWeight: "bold",
        overflow: "hidden",
      }}
    >
      {avatarUrl && !showInitials ? (
        <img
          src={avatarUrl}
          alt="Avatar"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain", // Changed to contain to show full image
            objectPosition: "center",
            borderRadius: "50%",
          }}
          onError={() => setShowInitials(true)} // Show initials on image load failure
          referrerPolicy="no-referrer"
        />
      ) : (
        initials
      )}
    </div>
  );
};

export default Avatar;