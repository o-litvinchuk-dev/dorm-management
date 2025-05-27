import { newEnforcer } from "casbin";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelPath = path.join(__dirname, "rbac_model.conf");
const policyPath = path.join(__dirname, "rbac_policy.csv");

let globalEnforcerInstance; // Store the enforcer instance
const enableDebugLogs = process.env.CASBIN_DEBUG_LOGS === 'true'; // Optional: control debug logs with env variable

const initializeEnforcer = async () => {
    // If enforcer is already initialized, return it
    if (globalEnforcerInstance) {
        return globalEnforcerInstance;
    }

    try {
        const enforcer = await newEnforcer(modelPath, policyPath);
        
        if (enableDebugLogs) {
            console.log('[Casbin Init] Enforcer created successfully.');
            // Log all loaded policy rules
            const loadedPolicy = await enforcer.getPolicy();
            console.log('[Casbin Init] Loaded Policy Rules:');
            if (loadedPolicy.length === 0) {
                console.log('[Casbin Init] No policy rules were loaded!');
            } else {
                loadedPolicy.forEach(rule => console.log('[Casbin Init] Rule:', rule.join(', ')));
            }

            // Check specific rule for dorm_manager
            const testRuleExists = loadedPolicy.some(rule => 
                rule[0] === 'dorm_manager' && 
                rule[1] === '/api/v1/application-presets' && 
                rule[2] === 'GET'
            );
            console.log('[Casbin Init] Test: Rule "p, dorm_manager, /api/v1/application-presets, GET" exists in loaded policy:', testRuleExists);
        }

        globalEnforcerInstance = enforcer; // Store in global variable
        return enforcer;
    } catch (err) {
        console.error('[Casbin Init] Error creating or loading policy for enforcer:', err);
        throw err; // Rethrow to ensure server doesn't start if there's an issue
    }
};

export const getEnforcer = async () => {
    // Always return the initialized enforcer (or initialize it if not yet done)
    return await initializeEnforcer();
};

export const assignRole = async (userId, role, assigningUserRole) => {
    const enforcer = await getEnforcer(); // Get the enforcer instance
    const canAssign = await enforcer.enforce(assigningUserRole, "/api/v1/users/assign-role", "POST"); // Generic endpoint
    if (!canAssign) {
        throw new Error("Недостатньо прав для призначення ролі");
    }
    await enforcer.addRoleForUser(userId.toString(), role);
    // Note: Changes are not persistent unless saved to the policy file or adapter supports it
    return true;
};