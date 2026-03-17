import { Request, Response, NextFunction } from 'express'
import ApiError from "./api-error.js"
import WorkdayError from "./workday-error.js"
import { Prisma } from '../../generated/prisma/client.js'

function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    let statusCode = 500;
    const errorResponse: Record<string, unknown> = {
        error: err.name,
        message: err.message || 'Internal Server Error'
    }

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        if (err.details) errorResponse.details = err.details;
    } else if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // Prisma unique constraint violation
        const field = (err.meta?.target as string[])?.[0] ?? 'field';
        statusCode = 409;
        errorResponse.message = 'Duplicate field value entered';
        errorResponse.details = [{ field, issue: `${field} is already taken.` }];
    } else if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        statusCode = 404;
        errorResponse.message = 'Record not found';
    } else if (err instanceof WorkdayError) {
        statusCode = 502;
    }

    if (process.env.NODE_ENV === 'development')
        errorResponse.stack = err.stack;

    if (statusCode === 500)
        console.error(err);

    res.status(statusCode).send(errorResponse);
}

export default errorHandler;