import type { PrismaClient } from '../../generated/prisma/client.js'

// Workday project shape based on fields used in API response
interface WorkdayProject {
    id: string
    name: string
    company: { descriptor: string }
    overview: string
    startDate: string
}

export default async function updateDb(prisma: PrismaClient, projects: WorkdayProject[]) {
    for (const project of projects) {
        try {
            const workdayId = project.id
            if (!workdayId) throw new Error('Could not find Workday ID')

            const workdayData = {
                workdayId: project.id,
                name: project.name,
                client: project.company.descriptor,
                description: project.overview,
                startDate: project.startDate
            }

            const dbProject = null;
            if (dbProject) {
            } else {
            }
        } catch (err: any) {
            console.error(`Error initializing Workday project: ${err.message}\n${project}`)
        }
    }
}
