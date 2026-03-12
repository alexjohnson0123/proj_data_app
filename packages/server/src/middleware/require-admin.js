import ApiError from "../errors/api-error.js";

export default function requireAdmin(req, res, next) {
    const scopes = req.user?.roles ?? [];
    if (!scopes.includes('admin')) {
        throw new ApiError(403, 'Insufficient Permissions');
    }
    next();
}