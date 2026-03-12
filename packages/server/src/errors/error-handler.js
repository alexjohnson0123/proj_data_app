import ApiError from "./api-error.js";
import WorkdayError from "./workday-error.js";

function errorHandler(err, req, res, next) {
    let statusCode = 500;
    const errorResponse = {
        error: err.name,
        message: err.message || 'Internal Server Error'
    }

    if (err instanceof ApiError) {
        // Custom error class
        statusCode = err.statusCode;
        if (err.details) errorResponse.details = err.details;
    } else if (err.name === 'ValidationError') {
        // Mongoose schema validation error
        statusCode = 400;
        errorResponse.message = Object.values(err.errors).map(e => e.message);
    } else if (err.code === 11000) {
        // Mongoose duplicate key error
        const field = Object.keys(err.keyValue)[0];
        statusCode = 409; // 409 Conflict
        errorResponse.message = 'Duplicate field value entered';
        errorResponse.details = [{ field: field, issue: `${field} is already taken.` }];
    } else if (err instanceof WorkdayError) {
        statusCode = 502;
    }

    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }

    if (statusCode === 500) {
        console.error(err);
    }

    res.status(statusCode).send(errorResponse);
}

export default errorHandler;
