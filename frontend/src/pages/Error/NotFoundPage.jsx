import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Сторінку не знайдено</h1>
      <p>Вибачте, ця сторінка не існує.</p>
      <Link to="/">Повернутися на головну</Link>
    </div>
  );
};

export default NotFoundPage;