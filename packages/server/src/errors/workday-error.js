class WorkdayError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'WorkdayError';
        this.status = status;
    }
}

export default WorkdayError;