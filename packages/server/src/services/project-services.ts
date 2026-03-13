import ApiError from '../errors/api-error.js'
import { IProject, Project, ProjectTypeDefinition } from '../models.js'
import type { PrismaClient } from '../../generated/prisma/client.js'

export async function validateProjectTypeAttributes(prisma: PrismaClient, project: IProject) {
    if (project.attributes.size === 0) return

    if (!project.projectType) {
        throw new ApiError(400, 'Project Type Validation Failed')
    }

    const projectTypeDefinition = await ProjectTypeDefinition.findById(project.projectType)
    if (!projectTypeDefinition) throw new ApiError(404, 'Project Type Not Found')

    for (const [name, value] of project.attributes.entries()) {
        const defAttribute = projectTypeDefinition.attributes.find(a => a.label === name)

        if (!defAttribute || defAttribute.dataType !== typeof value) {
            throw new ApiError(400, 'Attribute Validation Failed')
        }
    }
}

export async function findProject(prisma: PrismaClient, id: string): Promise<IProject> {
    const project = await Project.findOne({ workdayId: id })
    if (project === null) {
        throw new ApiError(404, 'Project Not Found')
    }
    return project
}

export async function updateProjectType(prisma: PrismaClient, id: string, projectTypeId: string, clearAttributes?: boolean): Promise<IProject> {
    const project = await findProject(prisma, id)
    const projectType = await ProjectTypeDefinition.findById(projectTypeId)
    if (!projectType) throw new ApiError(404, 'Project Type Not Found')

    if (project.attributes.size > 0) {
        if (!clearAttributes) {
            const attributes = Object.fromEntries(project.attributes.entries())
            throw new ApiError(409, 'Warning: Updating project type will delete attribute data', attributes)
        } else {
            project.attributes.clear()
        }
    }

    project.projectType = projectType._id;
    await project.save()

    return project
}
