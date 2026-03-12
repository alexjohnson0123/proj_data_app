import { DBConnect } from './src/start-database.js';
import updateDB from './src/services/update-db.js'
import { getWorkdayProjects, requestToken } from './src/services/workday-integration.js';
import createApp from './src/app.js';
import cron from 'node-cron';
import dotenv from 'dotenv';
import auth from './src/middleware/auth.js';

// Initialize environment variables
dotenv.config();

// Connect to database
DBConnect();

// Sync project data to Workday
const syncProjects = async () => {
    try {
        const projects = await getWorkdayProjects();
        updateDB(projects);
    } catch (err) {
        console.error(`Workday sync failed: ${err.message}`);
    }
}
syncProjects();
// Schedule re-sync every 24 hours
cron.schedule('0 0 * * *', syncProjects);

// Create and start server
const app = createApp(auth);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Serving running on port: ${PORT}`);
});