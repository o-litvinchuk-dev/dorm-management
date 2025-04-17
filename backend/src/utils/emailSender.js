import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendVerificationEmail = async (email, token) => {
    try {
        console.log(
            "[Email] Початок відправки для:",
            email.substring(0, 3) + "***"
        );

        if (!process.env.BACKEND_URL)
            throw new Error("BACKEND_URL не налаштовано");
        if (!process.env.EMAIL_USER) throw new Error("EMAIL_USER не вказано");
        if (!process.env.EMAIL_PASS) throw new Error("EMAIL_PASS не вказано");

        const verificationUrl = `${process.env.BACKEND_URL}/api/v1/auth/verify-email?token=${token}`;
        console.log("[Email] Посилання:", verificationUrl);

        // Base64 логотипу
        const logoData =
            `iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAO0SURBVHgBXVUtjxRBEK3qnQ1LcjnuUJwggDswcEHwC3CE4ElI8ARyEoXGAIKgSFBIEggGgUBi+FCAPAU4OMPXznRR9V717MBmZqdnurs+Xr16reK/7Vs/j9vQP1KV00VsU9VERa2oacFYBE8f+DV+LzEhfMatZqYzH1d5Npd+98XNrT0N48t+eFvMNktZGXBj5pfMStgNJ3RQYr5gmRW+C9fTkaZDf/8+r8NO93tZ7/r8hvnKaphEzBZjX1cNH9yCaBivEbUhQzflQ9/sa4xr4VSrINCNpc4edbXKpfBYq+ZkbIsIYhymMXRnMQwUuCAMxhDGFMn6foVxRwMu3NaZLrxHHDDeIok0gTwmBQVxGwOMwKdUJqCFDpWZcBCbC31slNgYd0xWYXoYh1vhd8McKqqZhYy3ENJqxapwD9dzHI7SaHCAUEUI2GCaTnIO8CucRRnC+YA9XhvjXJRrXO93h7SCkjEBRrgBr5aSScJ5XIan/105NwejHr/+DRbVoK0hcDgvgKsYQrUWDaJDeRIGNWRjyZYRGrWLO3M5e2w2wtGyGiYoRIyxDxlE1GGhkg3ZWIAAdqPwawuR86fmiG77yEyevVsS6+gFI7lmZB72ipCAExapJMXhIYwjfTdx9HCR59cW8uFLlfb76OMKcKPGhKImnQE1aArK6siWkT2NWewIeXB5Ifs/TS4//GWf0snHr7ZiUit81sBGO5AN8jcyqaxBUtTA/bWDRU5tqTx5O6Ae21sF0YdD7BFGzv3NuFpjX4dBDX0xFlHBd3YoKYf38yc7XV+onDsxkydvlqBxUbZbFDR0rPULWcQnIAooUXkBpycwFdv/IXLn5ZI9TRRA0bUD0jInyxoKNZHId13f7YEgpTelmPoykWa+Hzoo8uL6Qtb9eeH+L/v8rU4UNNdN1Bh21m4s7X+d1ybDBaGNTpqjlRFLuea5MCvtfFhJdwfMoiRFqY6miToB1RTBeEaZg45ZphS21jsBD7ufBcZCK2SCd2GlccQYzE7pJSOIN3VLrQmc5XmRQjkKXGNR/HWSEpDM0dR6FDuh4rnQmga9ReZxnukFK7iuIU6WeQbyvanmqC3/yLSkclryvfUJNYv8X31jL0CLwLAI6r1NzoCg2JBOAmAjRP80D88PNNYIVxyokXUTRkBX5WlZdno1siAftHUwyoCoLaPK7GRSDyzKGkQNsT/ffWb/z9DvFrmne31Xdvzj06Guoqq52WQl121+depNshLqkZfGIZdXfd/v7N3e3PsLimYx31zCMx4AAAAASUVORK5CYII=`.trim();

        const mailOptions = {
            from: `"DORM LIFE" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Підтвердження реєстрації",
            html: `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffffff">
        <div style="max-width: 480px; margin: 0 auto; padding: 20px 15px">
            <!-- Контейнер -->
            <div
                style="
                    background: #fff;
                    border-radius: 12px;
                    padding: 25px;
                    border: 1px solid #e0e0e0;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                "
            >
                <!-- Заголовок з лого (таблична структура для Gmail) -->
                <table
                    role="presentation"
                    cellpadding="0"
                    cellspacing="0"
                    width="100%"
                    style="margin-bottom: 30px"
                >
                    <tr>
                        <td align="center" style="padding-bottom: 15px">
                            <table
                                role="presentation"
                                cellpadding="0"
                                cellspacing="0"
                            >
                                <tr>
                                    <td
                                        style="
                                            vertical-align: middle;
                                            padding-right: 8px;
                                        "
                                    >
                                        <img
                                            src="cid:logo@dormlife"
                                            alt="DORM LIFE"
                                            width="24"
                                            height="24"
                                            style="
                                                display: block;
                                                width: 24px;
                                                height: 24px;
                                            "
                                        />
                                    </td>
                                    <td style="vertical-align: middle">
                                        <h1
                                            style="
                                                font-family: Arial, sans-serif;
                                                font-size: 21px;
                                                font-weight: 700;
                                                color: #212121;
                                                margin: 0;
                                                line-height: 1;
                                            "
                                        >
                                            DORM LIFE
                                        </h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <!-- Заголовок -->
                <h2
                    style="
                        font-family: Arial, sans-serif;
                        font-size: 22px;
                        font-weight: 700;
                        text-align: center;
                        color: #263238;
                        margin: 0 0 10px 0;
                    "
                >
                    Підтвердіть вашу електронну адресу 🎉
                </h2>

                <!-- Контент -->
                <div style="font-family: Arial, sans-serif; padding: 15px">
                    <p
                        style="
                            color: #607d8b;
                            font-size: 15px;
                            line-height: 1.5;
                            margin: 0 0 15px 0;
                            text-align: center;
                        "
                    >
                        Дякуємо за реєстрацію в Dorm Life! Для завершення
                        процесу будь ласка підтвердіть вашу електронну адресу:
                    </p>

                    <!-- Кнопка -->
                    <div style="text-align: center; margin: 0 0 30px 0">
                        <a
                            href="${verificationUrl}"
                            style="
                                display: inline-block;
                                padding: 12px 28px;
                                border-radius: 6px;
                                background: #006aff;
                                color: #fff;
                                font-weight: 700;
                                text-decoration: none;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                            "
                        >
                            Підтвердити Email
                        </a>
                    </div>

                    <!-- Альтернативне посилання -->
                    <div
                        style="
                            border-top: 1px solid #e0e0e0;
                            padding: 20px 0 0 0;
                            text-align: center;
                        "
                    >
                        <p
                            style="
                                color: #757575;
                                font-size: 13px;
                                margin: 0 0 12px 0;
                            "
                        >
                            Якщо кнопка не працює, скопіюйте це посилання:
                        </p>
                        <a
                            href="${verificationUrl}"
                            style="
                                color: #006aff;
                                font-size: 13px;
                                word-break: break-all;
                                text-decoration: none;
                                line-height: 1.4;
                            "
                        >
                            ${verificationUrl}
                        </a>
                    </div>
                </div>

                <!-- Футер -->
                <div
                    style="
                        margin: 25px 0 0 0;
                        padding: 20px 0 0 0;
                        border-top: 1px solid #e0e0e0;
                        text-align: center;
                    "
                >
                    <p
                        style="
                            color: #757575;
                            font-size: 11px;
                            line-height: 1.5;
                            margin: 0;
                        "
                    >
                        © 2024 Dorm Life. Всі права захищені.<br />
                        Цей лист надіслано автоматично - не відповідайте на
                        нього.
                    </p>
                </div>
            </div>
        </div>
    </body>
</html>

            `,
            attachments: [
                {
                    filename: "logo.png",
                    content: logoData,
                    encoding: "base64",
                    cid: "logo@dormlife",
                },
            ],
        };

        await transporter.verify();
        console.log("[Email] Перевірка SMTP: OK");

        const info = await transporter.sendMail(mailOptions);
        console.log("[Email] Лист успішно відправлено! ID:", info.messageId);

        return { success: true };
    } catch (error) {
        console.error("[Email] Критична помилка:", {
            code: error.code || "N/A",
            message: error.message,
            stack:
                process.env.NODE_ENV === "development"
                    ? error.stack
                    : "Приховано",
        });
        throw new Error("Помилка відправки листа: " + error.message);
    }
};

export const sendPasswordResetEmail = async (email, resetUrl) => {
    try {
        console.log(
            "[Email][Password] Початок відправки для:",
            email.substring(0, 3) + "***"
        );

        if (!process.env.EMAIL_USER) throw new Error("EMAIL_USER не вказано");
        if (!process.env.EMAIL_PASS) throw new Error("EMAIL_PASS не вказано");

        // Той самий base64 логотипу як у верифікаційному листі
        const logoData =
            `iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAO0SURBVHgBXVUtjxRBEK3qnQ1LcjnuUJwggDswcEHwC3CE4ElI8ARyEoXGAIKgSFBIEggGgUBi+FCAPAU4OMPXznRR9V717MBmZqdnurs+Xr16reK/7Vs/j9vQP1KV00VsU9VERa2oacFYBE8f+DV+LzEhfMatZqYzH1d5Npd+98XNrT0N48t+eFvMNktZGXBj5pfMStgNJ3RQYr5gmRW+C9fTkaZDf/8+r8NO93tZ7/r8hvnKaphEzBZjX1cNH9yCaBivEbUhQzflQ9/sa4xr4VSrINCNpc4edbXKpfBYq+ZkbIsIYhymMXRnMQwUuCAMxhDGFMn6foVxRwMu3NaZLrxHHDDeIok0gTwmBQVxGwOMwKdUJqCFDpWZcBCbC31slNgYd0xWYXoYh1vhd8McKqqZhYy3ENJqxapwD9dzHI7SaHCAUEUI2GCaTnIO8CucRRnC+YA9XhvjXJRrXO93h7SCkjEBRrgBr5aSScJ5XIan/105NwejHr/+DRbVoK0hcDgvgKsYQrUWDaJDeRIGNWRjyZYRGrWLO3M5e2w2wtGyGiYoRIyxDxlE1GGhkg3ZWIAAdqPwawuR86fmiG77yEyevVsS6+gFI7lmZB72ipCAExapJMXhIYwjfTdx9HCR59cW8uFLlfb76OMKcKPGhKImnQE1aArK6siWkT2NWewIeXB5Ifs/TS4//GWf0snHr7ZiUit81sBGO5AN8jcyqaxBUtTA/bWDRU5tqTx5O6Ae21sF0YdD7BFGzv3NuFpjX4dBDX0xFlHBd3YoKYf38yc7XV+onDsxkydvlqBxUbZbFDR0rPULWcQnIAooUXkBpycwFdv/IXLn5ZI9TRRA0bUD0jInyxoKNZHId13f7YEgpTelmPoykWa+Hzoo8uL6Qtb9eeH+L/v8rU4UNNdN1Bh21m4s7X+d1ybDBaGNTpqjlRFLuea5MCvtfFhJdwfMoiRFqY6miToB1RTBeEaZg45ZphS21jsBD7ufBcZCK2SCd2GlccQYzE7pJSOIN3VLrQmc5XmRQjkKXGNR/HWSEpDM0dR6FDuh4rnQmga9ReZxnukFK7iuIU6WeQbyvanmqC3/yLSkclryvfUJNYv8X31jL0CLwLAI6r1NzoCg2JBOAmAjRP80D88PNNYIVxyokXUTRkBX5WlZdno1siAftHUwyoCoLaPK7GRSDyzKGkQNsT/ffWb/z9DvFrmne31Xdvzj06Guoqq52WQl121+depNshLqkZfGIZdXfd/v7N3e3PsLimYx31zCMx4AAAAASUVORK5CYII=`.trim();

        const mailOptions = {
            from: `"DORM LIFE" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Скидання пароля DORM LIFE",
            html: `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffffff">
        <div style="max-width: 480px; margin: 0 auto; padding: 20px 15px">
            <!-- Контейнер -->
            <div
                style="
                    background: #fff;
                    border-radius: 12px;
                    padding: 25px;
                    border: 1px solid #e0e0e0;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                "
            >
                <!-- Заголовок з лого -->
                <table
                    role="presentation"
                    cellpadding="0"
                    cellspacing="0"
                    width="100%"
                    style="margin-bottom: 30px"
                >
                    <tr>
                        <td align="center" style="padding-bottom: 15px">
                            <table
                                role="presentation"
                                cellpadding="0"
                                cellspacing="0"
                            >
                                <tr>
                                    <td style="vertical-align: middle; padding-right: 8px;">
                                        <img
                                            src="cid:logo@dormlife"
                                            alt="DORM LIFE"
                                            width="24"
                                            height="24"
                                            style="
                                                display: block;
                                                width: 24px;
                                                height: 24px;
                                            "
                                        />
                                    </td>
                                    <td style="vertical-align: middle">
                                        <h1
                                            style="
                                                font-family: Arial, sans-serif;
                                                font-size: 21px;
                                                font-weight: 700;
                                                color: #212121;
                                                margin: 0;
                                                line-height: 1;
                                            "
                                        >
                                            DORM LIFE
                                        </h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <!-- Заголовок -->
                <h2
                    style="
                        font-family: Arial, sans-serif;
                        font-size: 22px;
                        font-weight: 700;
                        text-align: center;
                        color: #263238;
                        margin: 0 0 10px 0;
                    "
                >
                    Скидання пароля 🔑
                </h2>

                <!-- Контент -->
                <div style="font-family: Arial, sans-serif; padding: 15px">
                    <p
                        style="
                            color: #607d8b;
                            font-size: 15px;
                            line-height: 1.5;
                            margin: 0 0 15px 0;
                            text-align: center;
                        "
                    >
                        Ми отримали запит на скидання пароля для вашого облікового запису.
                        Натисніть кнопку нижче, щоб встановити новий пароль:
                    </p>

                    <!-- Кнопка -->
                    <div style="text-align: center; margin: 0 0 30px 0">
                        <a
                            href="${resetUrl}"
                            style="
                                display: inline-block;
                                padding: 12px 28px;
                                border-radius: 6px;
                                background: #006aff;
                                color: #fff;
                                font-weight: 700;
                                text-decoration: none;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                            "
                        >
                            Встановити новий пароль
                        </a>
                    </div>

                    <!-- Додаткова інформація -->
                    <div
                        style="
                            background: #f8f9fa;
                            border-radius: 8px;
                            padding: 15px;
                            margin: 20px 0;
                        "
                    >
                        <p
                            style="
                                color: #757575;
                                font-size: 13px;
                                margin: 0 0 8px 0;
                                text-align: center;
                            "
                        >
                            ⏳ Посилання дійсне протягом <strong>1 години</strong>
                        </p>
                        <p
                            style="
                                color: #757575;
                                font-size: 13px;
                                margin: 0;
                                text-align: center;
                            "
                        >
                            Якщо ви не запитували зміну пароля - проігноруйте цей лист
                        </p>
                    </div>

                    <!-- Альтернативне посилання -->
                    <div
                        style="
                            border-top: 1px solid #e0e0e0;
                            padding: 20px 0 0 0;
                            text-align: center;
                        "
                    >
                        <p
                            style="
                                color: #757575;
                                font-size: 13px;
                                margin: 0 0 12px 0;
                            "
                        >
                            Якщо кнопка не працює, скопіюйте це посилання:
                        </p>
                        <a
                            href="${resetUrl}"
                            style="
                                color: #006aff;
                                font-size: 13px;
                                word-break: break-all;
                                text-decoration: none;
                                line-height: 1.4;
                            "
                        >
                            ${resetUrl}
                        </a>
                    </div>
                </div>

                <!-- Футер -->
                <div
                    style="
                        margin: 25px 0 0 0;
                        padding: 20px 0 0 0;
                        border-top: 1px solid #e0e0e0;
                        text-align: center;
                    "
                >
                    <p
                        style="
                            color: #757575;
                            font-size: 11px;
                            line-height: 1.5;
                            margin: 0;
                        "
                    >
                        © 2024 Dorm Life. Всі права захищені.<br />
                        Цей лист надіслано автоматично - не відповідайте на нього.
                    </p>
                </div>
            </div>
        </div>
    </body>
</html>
            `,
            attachments: [
                {
                    filename: "logo.png",
                    content: logoData,
                    encoding: "base64",
                    cid: "logo@dormlife",
                },
            ],
        };

        await transporter.verify();
        console.log("[Email][Password] Перевірка SMTP: OK");

        const info = await transporter.sendMail(mailOptions);
        console.log(
            "[Email][Password] Лист успішно відправлено! ID:",
            info.messageId
        );

        return { success: true };
    } catch (error) {
        console.error("[Email][Password] Критична помилка:", {
            code: error.code || "N/A",
            message: error.message,
            stack:
                process.env.NODE_ENV === "development"
                    ? error.stack
                    : "Приховано",
        });
        throw new Error("Помилка відправки листа: " + error.message);
    }
};
