import { Request, Response, NextFunction } from 'express'
import ApiError from '../errors/api-error.js'

export default function requireAdmin(req: Request, res: Response, next: NextFunction) {
    const roles = req.user?.roles ?? []
    if (!roles.includes('admin')) {
        throw new ApiError(403, 'Insufficient Permissions')
    }
    next()
}
