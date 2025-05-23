import React from "react";
import { Link } from "react-router-dom";

const UnauthorizedPage = () => {
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Немає доступу</h1>
      <p>У вас немає прав для доступу до цієї сторінки.</p>
      <Link to="/">Повернутися на головну</Link>
    </div>
  );
};

export default UnauthorizedPage;