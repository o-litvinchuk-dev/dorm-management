// utils/toastConfig.js
import { toast } from "sonner";

const showToast = (type, title, description) => {
    const options = {
        duration: 5000,
        ...(description && { description }),
    };

    switch (type) {
        case "success":
            toast.success(title, options);
            break;
        case "error":
            toast.error(title, options);
            break;
        case "warning":
            toast.warning(title, options);
            break;
        case "info":
            toast.info(title, options);
            break;
        default:
            toast(title, options);
    }
};

const handleApiError = (error) => {
    if (!error.response) {
        return ToastService.networkError();
    }

    const status = error.response.status;
    const serverMessage = error.response.data?.error;

    switch (status) {
        case 400:
            ToastService.validationError(serverMessage || "Невірні дані");
            break;
        case 401:
            ToastService.authError(error);
            break;
        case 403:
            ToastService.forbiddenError(serverMessage);
            break;
        case 404:
            ToastService.notFoundError(serverMessage);
            break;
        case 409:
            ToastService.conflictError(serverMessage);
            break;
        case 429:
            ToastService.tooManyRequests();
            break;
        default:
            ToastService.serverError(status, serverMessage);
    }
};

const ToastService = {
    // Базові методи
    success: (title, description) => showToast("success", title, description),
    error: (title, description) => showToast("error", title, description),
    warning: (title, description) => showToast("warning", title, description),
    info: (title, description) => showToast("info", title, description),

    // Спеціалізовані сценарії
    networkError: () =>
        showToast("error", "Мережева помилка", "Перевірте інтернет-з'єднання"),

    authError: (error) => {
        const message =
            error.response?.status === 401
                ? "Невірні облікові дані"
                : "Помилка автентифікації";
        showToast("error", message, error.response?.data?.error);
    },

    accountNotVerified: () =>
        showToast(
            "warning",
            "Не підтверджений акаунт",
            "Підтвердьте email перед входом"
        ),

    googleError: (error) =>
        showToast(
            "error",
            "Помилка Google",
            error?.message || "Помилка авторизації через Google"
        ),

    existingLocalAccount: () =>
        showToast(
            "error",
            "Конфлікт акаунтів",
            "Ця електронна пошта вже зареєстрована через локальний вхід. Використовуйте стандартний вхід з паролем"
        ),

    validationError: (errors) => {
        const message = Array.isArray(errors) ? errors.join("\n") : errors;
        showToast("error", "Помилки валідації", message);
    },

    passwordResetSuccess: () =>
        showToast("success", "Лист відправлено", "Перевірте вашу пошту"),

    // Нові методи з бекенду
    emailConflict: () =>
        showToast(
            "error",
            "Пошта вже використовується",
            "Користувач з цією адресою вже зареєстрований"
        ),

    invalidEmail: () =>
        showToast(
            "error",
            "Невірна електронна адреса",
            "Користувача з такою поштою не знайдено"
        ),

    invalidPassword: () =>
        showToast(
            "error",
            "Невірний пароль",
            "Введений пароль не відповідає обліковим даним"
        ),

    tokenError: (message = "Недійсний або прострочений токен") =>
        showToast("error", "Помилка токена", message),

    passwordRequirements: () =>
        showToast(
            "error",
            "Невірний пароль",
            "Пароль повинен містити:\n• Мінімум 8 символів\n• Хоча б одну велику літеру\n• Хоча б одну цифру"
        ),

    passwordValidationError: (errors) => {
        const message = Array.isArray(errors)
            ? `Пароль повинен містити:\n• ${errors.join("\n• ")}`
            : "Некоректний пароль";
        showToast("error", "Помилка пароля", message);
    },

    emailVerificationSent: () =>
        showToast(
            "success",
            "Лист надіслано",
            "Інструкції для підтвердження відправлено на вашу пошту"
        ),

    resetPasswordSuccess: () =>
        showToast("success", "Пароль оновлено", "Увійдіть з новим паролем"),

    existingEmailWithDifferentProvider: (provider) =>
        showToast(
            "error",
            "Конфлікт акаунтів",
            `Ця пошта вже використовується для входу через ${provider}`
        ),

    serverConfigurationError: () =>
        showToast(
            "error",
            "Помилка конфігурації",
            "Серверні налаштування невірні"
        ),

    emailSendError: () =>
        showToast(
            "error",
            "Помилка відправки",
            "Не вдалося відправити лист. Спробуйте ще раз"
        ),

    // Обробник API помилок
    handleApiError: (error) => handleApiError(error),

    // Додаткові помилки
    forbiddenError: (message) =>
        showToast("error", "Доступ заборонено", message || "Недостатньо прав"),

    notFoundError: (message) =>
        showToast("error", "Не знайдено", message || "Ресурс не існує"),

    conflictError: (message) =>
        showToast("error", "Конфлікт даних", message || "Дані вже існують"),

    tooManyRequests: () =>
        showToast("error", "Забагато запитів", "Спробуйте через 15 хвилин"),

    serverError: (status, message) =>
        showToast(
            "error",
            `Помилка сервера (${status})`,
            message || "Спробуйте пізніше"
        ),
};

export { showToast, ToastService };