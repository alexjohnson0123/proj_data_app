import type { AttributeDefinition, DataType, PrismaClient, ProjectType } from '../../generated/prisma/client.js'
import ApiError from '../errors/api-error.js';

export async function getProjectTypes(prisma: PrismaClient) {
    return await prisma.projectType.findMany({ include: { attributeDefs: true } });
}

export async function getProjectTypeByName(prisma: PrismaClient, name: string) {
    const projectType = await prisma.projectType.findUnique({ where: { name } });
    if (!projectType) throw new ApiError(404, 'Project Type definition not found');
    return projectType;
}

export async function createProjectType(prisma: PrismaClient, name: string, attributes: { label: string, dataType: DataType, required?: boolean }[]) {
    return await prisma.projectType.create({ data: { name, attributeDefs: { create: attributes } } });
}

export async function createAttributeDefinition(prisma: PrismaClient, label: string, dataType: DataType, projectTypeName: string) {
    const projectType = await prisma.projectType.findUnique({ where: { name: projectTypeName } });
    if (!projectType) throw new ApiError(404, 'Project Type Not Found');
    return await prisma.attributeDefinition.create({
        data: { label, dataType, projectTypeId: projectType.id }
    });
}