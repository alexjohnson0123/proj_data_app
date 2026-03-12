import { Project } from '../models.js'

export default async function updateDb(projects) {
    for (const project of projects) {
        try {
            const workdayId = project.id;
            if (!workdayId) throw Error("Could not find Workday ID");

            const workdayData = {
                workdayId: project.id,
                name: project.name,
                client: project.company.descriptor,
                description: project.overview,
                startDate: project.startDate
            }

            const dbProject = await Project.findOne({ workdayId: workdayId });
            if (dbProject) {
                await Project.findByIdAndUpdate(
                    dbProject._id,
                    workdayData
                )
            } else {
                await Project.create(workdayData);
            }
        } catch (err) {
            console.error(`Error initializing Workday project: ${err.message}\n${project}`)
        }
    }
}