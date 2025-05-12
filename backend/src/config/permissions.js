// backend/src/config/permissions.js
import { newEnforcer } from "casbin";
import path from "path";
import { fileURLToPath } from "url";

// Визначення шляхів до файлів конфігурації
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modelPath = path.join(__dirname, "rbac_model.conf");
const policyPath = path.join(__dirname, "rbac_policy.csv");

// Ініціалізація Casbin Enforcer
const initializeEnforcer = async () => {
    const enforcer = await newEnforcer(modelPath, policyPath);
    return enforcer;
};

// Експорт Enforcer для використання в інших частинах програми
export const getEnforcer = async () => {
    return await initializeEnforcer();
};

// Функція для призначення ролі користувачу
export const assignRole = async (userId, role, assigningUserRole) => {
    const enforcer = await initializeEnforcer();

    // Перевірка, чи має користувач, що призначає роль, достатні права
    const canAssign = await enforcer.enforce(assigningUserRole, "/roles/assign", "POST");
    if (!canAssign) {
        throw new Error("Недостатньо прав для призначення ролі");
    }

    // Додавання ролі в політику
    await enforcer.addRoleForUser(userId.toString(), role);
    return true;
};