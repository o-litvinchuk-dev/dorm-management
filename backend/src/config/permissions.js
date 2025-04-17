export const roles = {
    user: ["read:profile", "update:profile"],
    moderator: ["read:all_profiles", "manage:content"],
    admin: ["manage:users", "manage:system", "audit:logs"],
};

export const getPermissionsForRole = (role) => {
    return roles[role] || [];
};

export const checkPermission = (permission) => (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
        return res.status(403).json({
            error: "Недостатньо прав для цієї операції",
        });
    }
    next();
};