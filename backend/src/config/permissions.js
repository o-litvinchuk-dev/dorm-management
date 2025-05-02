import { newEnforcer } from 'casbin';
import path from 'path';
import { fileURLToPath } from 'url';

// Визначення шляхів до файлів конфігурації
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modelPath = path.join(__dirname, 'rbac_model.conf');
const policyPath = path.join(__dirname, 'rbac_policy.csv');

// Ініціалізація Casbin Enforcer
const initializeEnforcer = async () => {
    const enforcer = await newEnforcer(modelPath, policyPath);
    return enforcer;
};

// Функція для перевірки дозволу
export const checkPermission = (permission) => async (req, res, next) => {
    const enforcer = await initializeEnforcer();
    const { user } = req;
    const { path, method } = req;

    try {
        const allowed = await enforcer.enforce(user.role, path, method);
        if (!allowed) {
            return res.status(403).json({
                error: 'Недостатньо прав для виконання цієї дії',
            });
        }
        next();
    } catch (error) {
        console.error('[Casbin] Помилка перевірки прав:', error);
        res.status(500).json({ error: 'Помилка сервера при перевірці прав' });
    }
};

// Функція для призначення ролі користувачу
export const assignRole = async (userId, role, assigningUserRole) => {
    const enforcer = await initializeEnforcer();

    // Перевірка, чи має користувач, що призначає роль, достатні права
    const canAssign = await enforcer.enforce(assigningUserRole, '/roles/assign', 'POST');
    if (!canAssign) {
        throw new Error('Недостатньо прав для призначення ролі');
    }

    // Додавання ролі в політику
    await enforcer.addRoleForUser(userId.toString(), role);
    return true;
};

// Експорт Enforcer для використання в інших частинах програми
export const getEnforcer = async () => {
    return await initializeEnforcer();
};