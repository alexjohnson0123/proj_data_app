class WorkdayError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.name = 'WorkdayError'
        this.status = status
    }
}

export default WorkdayError
