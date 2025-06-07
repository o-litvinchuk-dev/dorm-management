import api from "./api"; // Впевнений, що це правильний імпорт до вашого api.js

export const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    const sessionId = localStorage.getItem("sessionId"); // Отримуємо sessionId
    if (!refreshToken) {
      throw new Error("Відсутній токен оновлення");
    }

    // Використовуємо 'api.public' бо це допоміжна функція для рефрешу без інтерцепторів
    // основної 'api' інстанції, яка може бути у циклі рефрешу.
    const response = await api.public.post(
      "/auth/refresh-token",
      { refreshToken },
      { headers: { "X-Session-Id": sessionId || "" } } // Передаємо sessionId
    );

    localStorage.setItem("accessToken", response.data.accessToken);
    // Якщо refresh token також оновлюється (це можливо, якщо сервер повертає новий RT),
    // то збережіть його.
    if (response.data.refreshToken) {
      localStorage.setItem("refreshToken", response.data.refreshToken);
    }
    // sessionId не змінюється при refresh, він залишається тим самим для поточної сесії.

    return response.data.accessToken;
  } catch (error) {
    console.error("Помилка оновлення токену:", error);
    // У випадку помилки оновлення, виконати повний вихід з системи
    // Бажано, щоб це обробляв UserContext або централізована функція.
    logout(); // Викликаємо локальну функцію logout
    throw error; // Перекидаємо помилку далі, щоб викликаючий код міг її обробити
  }
};

export const logout = () => {
  // Ця функція logout має бути уніфікована.
  // Найнадійніший спосіб - викликати logout з UserContext.
  // Якщо ви викликаєте цю функцію, а не UserContext.logout(),
  // вона повинна очищати всі необхідні дані сесії.
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("sessionId"); // Очищаємо sessionId
  localStorage.removeItem("user"); // Очищаємо дані користувача з localStorage
  window.location.href = "/login"; // Перенаправляємо на сторінку входу
};