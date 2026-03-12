import { z } from 'zod';
import ApiError from '../errors/api-error.js';

function validateRequestBody(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        } catch (err) {
            if (err instanceof z.ZodError) {
                // Map Zod's error format to our AppError details array
                const errorDetails = err.issues.map(e => ({
                    field: e.path.join('.'),
                    issue: e.message
                }));

                // Throw a 400 Bad Request to our global error handler
                throw new ApiError(400, 'Validation Failed', errorDetails);
            } else {
                throw err;
            }
        }
    }
}

export default validateRequestBody;
