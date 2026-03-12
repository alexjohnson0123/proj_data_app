import express from 'express'
import cors from 'cors'
import projectsRouter from './routes/projects.js'
import projectTypesRouter from './routes/project-types.js'
import adminRouter from './routes/admin.js'
import errorHandler from './errors/error-handler.js'
import requireAdmin from './middleware/require-admin.js'

function createApp(auth) {
    const app = express();
    app.use(express.json());
    app.use(cors({
        origin: process.env.CLIENT_ORIGIN,
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }));

    // Use authentication middleware specified by paramater
    app.use(auth);

    // Route request address to corresponding logic
    app.use('/api/projects', projectsRouter);
    app.use('/api/project-types', projectTypesRouter);
    app.use('/api/admin', requireAdmin, adminRouter);

    // Custom error handler
    app.use(errorHandler);
    return app;
}

export default createApp;
