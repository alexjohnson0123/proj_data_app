declare global {
    namespace Express {
        interface Request {
            user?: {
                roles?: string[]
                [key: string]: unknown
            }
        }
    }
}

export {}
