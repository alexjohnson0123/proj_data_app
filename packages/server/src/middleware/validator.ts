import { Request, Response, NextFunction } from 'express'
import { z, ZodTypeAny } from 'zod'
import ApiError from '../errors/api-error.js'

function validateRequestBody(schema: ZodTypeAny) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body)
            next()
        } catch (err) {
            if (err instanceof z.ZodError) {
                const errorDetails = err.issues.map(e => ({
                    field: e.path.join('.'),
                    issue: e.message
                }))
                throw new ApiError(400, 'Validation Failed', errorDetails)
            } else {
                throw err
            }
        }
    }
}

export default validateRequestBody
