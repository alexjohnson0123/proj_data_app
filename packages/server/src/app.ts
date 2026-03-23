import express, { RequestHandler } from 'express'
import cors from 'cors'
import projectRouter from './routes/projects.js'
import projectTypeRouter from './routes/project-types.js'
import engagementRouter from './routes/engagement-types.js'
import adminRouter from './routes/admin.js'
import errorHandler from './errors/error-handler.js'
import { requireAdmin } from './middleware/auth.js'

function createApp(auth: RequestHandler) {
    const app = express();

    app.use(express.json());
    app.use(cors({
        origin: process.env.CLIENT_ORIGIN,
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }));

    // Global authentication middleware
    app.use(auth);

    // Routes for API endpoints
    app.use('/api/projects', projectRouter);
    app.use('/api/project-types', projectTypeRouter);
    app.use('/api/engagements', engagementRouter);
    // Admin route protected with requireAdmin
    app.use('/api/admin', requireAdmin, adminRouter);

    // Custom error handler
    app.use(errorHandler);

    // Handle invalid routes
    app.use((req, res) => res.status(404).json({ error: 'NotFound', message: 'Route not found' }));

    return app;
}

export default createApp;
