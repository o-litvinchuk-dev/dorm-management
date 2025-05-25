import { newEnforcer } from "casbin";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelPath = path.join(__dirname, "rbac_model.conf");
const policyPath = path.join(__dirname, "rbac_policy.csv");

let globalEnforcerInstance; // Зберігатимемо екземпляр енфорсера

const initializeEnforcer = async () => {
    console.log('[Casbin Init] Attempting to initialize enforcer...');
    console.log('[Casbin Init] Model Path:', modelPath);
    console.log('[Casbin Init] Policy Path:', policyPath);
    try {
        const enforcer = await newEnforcer(modelPath, policyPath);
        console.log('[Casbin Init] Enforcer created successfully.');
        
        // Логування всієї завантаженої політики
        const loadedPolicy = await enforcer.getPolicy();
        console.log('[Casbin Init] Loaded Policy Rules:');
        if (loadedPolicy.length === 0) {
            console.log('[Casbin Init] No policy rules were loaded!');
        } else {
            loadedPolicy.forEach(rule => console.log('[Casbin Init] Rule:', rule.join(', ')));
        }

        // Перевірка конкретного правила для dorm_manager
        const testRuleExists = loadedPolicy.some(rule => 
            rule[0] === 'dorm_manager' && 
            rule[1] === '/api/v1/application-presets' && 
            rule[2] === 'GET'
        );
        console.log('[Casbin Init] Test: Rule "p, dorm_manager, /api/v1/application-presets, GET" exists in loaded policy:', testRuleExists);

        globalEnforcerInstance = enforcer; // Зберігаємо в глобальну змінну
        return enforcer;
    } catch (err) {
        console.error('[Casbin Init] Error creating or loading policy for enforcer:', err);
        throw err; // Перекидаємо помилку, щоб сервер не стартував або проблема була очевидною
    }
};

export const getEnforcer = async () => {
    // Якщо енфорсер ще не ініціалізований (наприклад, при першому запиті після старту, якщо не було await у server.js)
    // або якщо ми хочемо завжди переініціалізовувати (що зараз і відбувається)
    // Для продакшена краще ініціалізувати один раз при старті.
    // Поточна логіка initializeEnforcer() викликається при кожному запиті authorize, що має підхоплювати зміни CSV.
    return await initializeEnforcer();
};

export const assignRole = async (userId, role, assigningUserRole) => {
    const enforcer = await getEnforcer(); // Використовуємо свіжий енфорсер
    const canAssign = await enforcer.enforce(assigningUserRole, "/roles/assign", "POST");
    if (!canAssign) {
        throw new Error("Недостатньо прав для призначення ролі");
    }
    await enforcer.addRoleForUser(userId.toString(), role);
    // Важливо: якщо політика зберігається лише в файлі, зміни тут не будуть персистентними
    // без перезавантаження політики з файлу або збереження змін назад у файл.
    // Для динамічного оновлення політики в пам'яті цього достатньо, але вона скинеться при перезапуску.
    // Щоб зробити зміни персистентними, потрібно enforcer.savePolicy() якщо адаптер це підтримує,
    // або оновлювати CSV файл і перезавантажувати енфорсер.
    return true;
};