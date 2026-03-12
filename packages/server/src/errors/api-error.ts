class ApiError extends Error {
    statusCode: number
    details: unknown

    constructor(statusCode: number, message: string, details: unknown = null) {
        super(message)
        this.name = this.constructor.name
        this.statusCode = statusCode
        this.details = details
        Error.captureStackTrace(this, this.constructor)
    }
}

export default ApiError
