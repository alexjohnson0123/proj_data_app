import { Router } from 'express'
import { getWorkdayProjects } from '../services/workday-integration.js'
import updateDb from '../services/update-db.js'

const router = Router()

router.post('/update-db', async (req, res) => {
    const projects = await getWorkdayProjects()
    await updateDb(projects as any[])
    res.status(200).send('Update complete')
})

export default router
