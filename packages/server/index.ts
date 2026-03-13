import updateDB from './src/services/update-db.js'
import { getWorkdayProjects } from './src/services/workday-integration.js'
import createApp from './src/app.js'
import cron from 'node-cron'
import dotenv from 'dotenv'
import auth from './src/middleware/auth.js'
import prisma from './src/prisma.js'

// initialize environment variables
dotenv.config();

// sync projects with those in Workday
const syncProjects = async () => {
    try {
        const projects = await getWorkdayProjects();
        updateDB(prisma, projects as any[]);
    } catch (err: any) {
        console.error(`Workday sync failed: ${err.message}`);
    }
}
syncProjects();
// re-sync every 24 hours
cron.schedule('0 0 * * *', syncProjects);

// start app
const app = createApp(auth);
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});
