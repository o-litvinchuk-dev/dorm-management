// src/utils/toastConfig.js
import { toast } from "sonner";

const showToast = (type, title, description) => {
  const options = {
    duration: 5000,
    ...(description && { description }),
  };
  switch (type) {
    case "success": toast.success(title, options); break;
    case "error": toast.error(title, options); break;
    case "warning": toast.warning(title, options); break;
    case "info": toast.info(title, options); break;
    default: toast(title, options);
  }
};

const handleApiError = (error) => {
  if (!error.response) {
    return ToastService.networkError();
  }

  const statusCode = error.response.status;
  const serverMessage = error.response.data?.error;
  const serverCode = error.response.data?.code; // Отримуємо код помилки з бекенду

  switch (statusCode) {
    case 400:
      ToastService.validationError(serverMessage || "Невірні дані");
      break;
    case 401:
    case 403:
      // Специфічна обробка 401/403 з кодами
      switch (serverCode) {
        case "TOKEN_MISSING": ToastService.tokenMissing(); break;
        case "TOKEN_EXPIRED": ToastService.tokenExpired(); break;
        case "INVALID_TOKEN": ToastService.invalidToken(); break;
        case "INVALID_TOKEN_PAYLOAD": ToastService.invalidTokenPayload(); break;
        case "TOKEN_VERSION_MISMATCH": ToastService.tokenVersionMismatch(); break;
        case "USER_NOT_FOUND": ToastService.userNotFound(); break;
        case "REFRESH_TOKEN_MISSING": ToastService.refreshTokenMissing(); break;
        case "REFRESH_TOKEN_EXPIRED": ToastService.refreshTokenExpired(); break;
        case "INVALID_REFRESH_TOKEN": ToastService.invalidRefreshToken(); break;
        case "REFRESH_TOKEN_USED_OR_INVALID": ToastService.refreshTokenUsedOrInvalid(); break;
        case "USER_NOT_FOUND_FOR_TOKEN": ToastService.userNotFoundForToken(); break;
        case "EMAIL_NOT_VERIFIED": ToastService.accountNotVerified(); break;
        case "AUTHENTICATION_FAILED": ToastService.authFailed(); break;
        case "PROFILE_INCOMPLETE_FACULTY": ToastService.profileIncompleteForRole("Ваш профіль не заповнений або факультет не визначено."); break;
        case "DORMITORY_NOT_ASSIGNED": ToastService.profileIncompleteForRole("Вам не призначено гуртожиток для управління."); break;
        case "INSUFFICIENT_PERMISSIONS": ToastService.forbiddenError(serverMessage); break;
        case "ACCOUNT_CONFLICT": ToastService.existingLocalAccount(); break;
        default: ToastService.forbiddenError(serverMessage || "Недостатньо прав або проблема авторизації.");
      }
      break;
    case 404: ToastService.notFoundError(serverMessage); break;
    case 409: ToastService.conflictError(serverMessage); break;
    case 429: ToastService.tooManyRequests(); break;
    default: ToastService.serverError(statusCode, serverMessage);
  }
};

const ToastService = {
  success: (title, description) => showToast("success", title, description),
  error: (title, description) => showToast("error", title, description),
  warning: (title, description) => showToast("warning", title, description),
  info: (title, description) => showToast("info", title, description),

  // Нові специфічні повідомлення
  sessionExpired: (description = "Ваша сесія закінчилась. Будь ласка, увійдіть знову.") => showToast("error", "Сесія завершена", description),
  tokenMissing: () => showToast("error", "Помилка авторизації", "Токен відсутній у запиті."),
  tokenExpired: () => showToast("error", "Помилка авторизації", "Термін дії токену закінчився."),
  invalidToken: () => showToast("error", "Помилка авторизації", "Наданий токен недійсний."),
  invalidTokenPayload: () => showToast("error", "Помилка авторизації", "Некоректний формат токена."),
  tokenVersionMismatch: () => showToast("error", "Сесія відкликана", "Ваш обліковий запис було оновлено (можливо, змінено пароль). Будь ласка, увійдіть знову."),
  userNotFound: () => showToast("error", "Помилка авторизації", "Користувача не знайдено."),
  refreshTokenMissing: () => showToast("error", "Помилка сесії", "Токен оновлення відсутній."),
  refreshTokenExpired: () => showToast("error", "Помилка сесії", "Термін дії токену оновлення закінчився."),
  invalidRefreshToken: () => showToast("error", "Помилка сесії", "Недійсний токен оновлення."),
  refreshTokenUsedOrInvalid: () => showToast("error", "Помилка сесії", "Токен оновлення вже використано або недійсний. Можливо, хтось намагався увійти у ваш акаунт."),
  userNotFoundForToken: () => showToast("error", "Помилка", "Користувача для вашої сесії не знайдено."),
  authFailed: (description = "Не вдалося автентифікуватися. Перевірте облікові дані або спробуйте пізніше.") => showToast("error", "Помилка автентифікації", description),
  profileIncompleteForRole: (description) => showToast("warning", "Неповний профіль", description),


  // Існуючі повідомлення
  networkError: () => showToast("error", "Мережева помилка", "Перевірте інтернет-з'єднання"),
  accountNotVerified: () => showToast("warning", "Не підтверджений акаунт", "Підтвердіть email перед входом"),
  googleError: (error) => showToast("error", "Помилка Google", error?.message || "Помилка авторизації через Google"),
  existingLocalAccount: () => showToast("error", "Конфлікт акаунтів", "Ця електронна пошта вже зареєстрована через локальний вхід. Використовуйте стандартний вхід з паролем"),
  validationError: (errors) => {
    const message = Array.isArray(errors) ? errors.join("\n") : errors;
    showToast("error", "Помилки валідації", message);
  },
  passwordResetSuccess: () => showToast("success", "Лист відправлено", "Перевірте вашу пошту"),
  emailConflict: () => showToast("error", "Пошта вже використовується", "Користувач з цією адресою вже зареєстрований"),
  invalidEmail: () => showToast("error", "Невірна електронна адреса", "Користувача з такою поштою не знайдено"),
  invalidPassword: () => showToast("error", "Невірний пароль", "Введений пароль не відповідає обліковим даним"),
  passwordRequirements: () => showToast("error", "Невірний пароль", "Пароль повинен містити:\n• Мінімум 8 символів\n• Хоча б одну велику літеру\n• Хоча б одну цифру"),
  passwordValidationError: (errors) => {
    const message = Array.isArray(errors) ? `Пароль повинен містити:\n• ${errors.join("\n• ")}` : "Некоректний пароль";
    showToast("error", "Помилка пароля", message);
  },
  emailVerificationSent: () => showToast("success", "Лист надіслано", "Інструкції для підтвердження відправлено на вашу пошту"),
  resetPasswordSuccess: () => showToast("success", "Пароль оновлено", "Увійдіть з новим паролем"),
  existingEmailWithDifferentProvider: (provider) => showToast("error", "Конфлікт акаунтів", `Ця пошта вже використовується для входу через ${provider}`),
  serverConfigurationError: () => showToast("error", "Помилка конфігурації", "Серверні налаштування невірні"),
  emailSendError: () => showToast("error", "Помилка відправки", "Не вдалося відправити лист. Спробуйте ще раз"),
  handleApiError: (error) => handleApiError(error),
  forbiddenError: (message) => showToast("error", "Доступ заборонено", message || "Недостатньо прав"),
  notFoundError: (message) => showToast("error", "Не знайдено", message || "Ресурс не існує"),
  conflictError: (message) => showToast("error", "Конфлікт даних", message || "Дані вже існують"),
  tooManyRequests: () => showToast("error", "Забагато запитів", "Спробуйте через 15 хвилин"),
  serverError: (status, message) => showToast("error", `Помилка сервера (${status})`, message || "Спробуйте пізніше"),
};

export { showToast, ToastService };