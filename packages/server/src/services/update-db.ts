import type { PrismaClient } from '../../generated/prisma/client.js'

// Workday project shape based on fields used in API response
interface WorkdayProject {
    id: string
    name: string
    company: { descriptor: string }
    overview: string
    startDate: string,
    worktags: {
        id: string,
        descriptor: string
    }[]
}

function getWorktag(worktags: { id: string, descriptor: string }[], tag_id: string): string | null {
    const tag = worktags.find(t => t.id === tag_id)
    return tag ? tag.descriptor : null
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
                startDate: new Date(project.startDate),
                sphere: getWorktag(project.worktags, 'Industry_Sphere'),
                region: getWorktag(project.worktags, 'Region'),
            }

            await prisma.project.upsert({
                where: { workdayId },
                create: workdayData,
                update: workdayData
            });
        } catch (err: any) {
            console.error(`Error initializing Workday project: ${err.message}\n${project}`)
        }
    }
}
