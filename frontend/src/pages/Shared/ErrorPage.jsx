import React from "react";
import { useNavigate } from "react-router-dom";

function ErrorPage() {
    const navigate = useNavigate();

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>404</h1>
            <p style={styles.message}>Сторінку не знайдено</p>
            <button style={styles.button} onClick={() => navigate("/")}>
                На головну
            </button>
        </div>
    );
}

const styles = {
    container: {
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#f8f9fa",
        color: "#333",
    },
    title: {
        fontSize: "72px",
        margin: "0",
    },
    message: {
        fontSize: "24px",
        marginBottom: "20px",
    },
    button: {
        padding: "10px 20px",
        fontSize: "18px",
        backgroundColor: "#006aff",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
    },
};

export default ErrorPage;
