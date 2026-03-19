import type { AttributeDefinition, DataType, Prisma, PrismaClient, ProjectType } from '../../generated/prisma/client.js'
import ApiError from '../errors/api-error.js';

export async function getProjectTypes(prisma: PrismaClient) {
    return await prisma.projectType.findMany({ include: { attributeDefs: true } });
}

export async function getProjectTypeByName(prisma: PrismaClient, name: string) {
    const projectType = await prisma.projectType.findUnique({ where: { name }, include: { attributeDefs: true } });
    if (!projectType) throw new ApiError(404, 'Project Type definition not found');
    return projectType;
}

export async function createProjectType(prisma: PrismaClient, name: string, attributes: { label: string, dataType: DataType, required?: boolean }[]) {
    return await prisma.projectType.create({ data: { name, attributeDefs: { create: attributes } } });
}

export async function updateProjectType(prisma: PrismaClient, oldName: string, newName: string) {
    return await prisma.projectType.update({ where: { name: oldName }, data: { name: newName } });
}

export async function deleteProjectType(prisma: PrismaClient, name: string) {
    // TODO: Implement attribute deletion behavior
    return await prisma.projectType.delete({ where: { name } });
}

export async function createAttributeDefinition(prisma: PrismaClient, label: string, dataType: DataType, projectTypeName: string) {
    const projectType = await getProjectTypeByName(prisma, projectTypeName);
    return await prisma.attributeDefinition.create({
        data: { label, dataType, projectTypeId: projectType.id }
    });
}

export async function updateAttributeDefinition(
    prisma: PrismaClient,
    projectTypeName: string,
    oldLabel: string,
    attributeData: { label?: string, dataType?: DataType, required?: boolean }
) {
    // TODO: Implement attributeValue cascade behavior
    const projectType = await getProjectTypeByName(prisma, projectTypeName);
    return await prisma.attributeDefinition.update({
        where: {
            projectTypeId_label: { label: oldLabel, projectTypeId: projectType.id }
        },
        data: attributeData
    })
}

export async function deleteAttributeDefinition(prisma: PrismaClient, projectTypeName: string, label: string) {
    // TODO: Implement attributeValue cascade deletion
    const projectType = await getProjectTypeByName(prisma, projectTypeName);
    return await prisma.attributeDefinition.delete({
        where: {
            projectTypeId_label: {
                label,
                projectTypeId: projectType.id
            }
        }
    });
}