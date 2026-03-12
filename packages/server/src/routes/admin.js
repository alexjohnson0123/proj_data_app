import { Router } from 'express';
import { requestToken, getWorkdayProjects } from '../services/workday-integration.js';

const router = Router();

router.post('/update-db', async (req, res) => {
    const projects = await getWorkdayProjects();
    await syncProjects(projects);
    res.status(200).send('Update complete');
});

export default router;