import ApiError from '../errors/api-error.js'
import type { AttributeValue, PrismaClient, Project } from '../../generated/prisma/client.js'
import { ProjectWhereInput } from '../../generated/prisma/models.js'

// Helper function for casting string inputs to variable types
function castAttrValue(value: string): string | number | boolean {
    if (value === 'true') return true
    if (value === 'false') return false
    const num = Number(value)
    if (!isNaN(num) && value.trim() !== '') return num
    return value
}

// Search and filter projects
// q: the search query
// client/sphere/projectType: static search filters
// attrFilters: repeated `attr=label:value` query params for dynamic attribute filtering
export async function searchProjects(
    prisma: PrismaClient,
    q: string | undefined,
    client: string | undefined,
    sphere: string | undefined,
    projectType: string | undefined,
    attrFilters: string[]
) {
    const where: ProjectWhereInput = {};

    if (q) {
        where.OR = [
            { name: { contains: q, mode: 'insensitive' } },
            { client: { contains: q, mode: 'insensitive' } },
            { sphere: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
        ];
    }

    if (client) where.client = client;
    if (sphere) where.sphere = sphere;
    if (projectType) where.projectType = { is: { name: projectType } };

    const parsedAttributes = attrFilters.map((s) => {
        const arr = s.split(':');
        return [arr[0], arr.slice(1).join(':')];
    });
    const dynamicFilters: ProjectWhereInput[] = []
    for (const [label, value] of parsedAttributes) {
        const casted = castAttrValue(value as string);
        if (typeof casted === 'number')
            dynamicFilters.push({
                attributeValues: {
                    some: { attributeDef: { label }, valueNumber: casted }
                }
            });
        else if (!isNaN(Date.parse(value as string)))
            dynamicFilters.push({
                attributeValues: {
                    some: { attributeDef: { label }, valueDate: new Date(value as string) }
                }
            });
        else if (typeof casted === 'string')
            dynamicFilters.push({
                attributeValues: {
                    some: { attributeDef: { label }, valueString: casted }
                }
            });
    }
    if (dynamicFilters.length > 0) where.AND = dynamicFilters;

    return await prisma.project.findMany({ where, include: { projectType: true } });
}

export async function getMeta(prisma: PrismaClient) {
    const [clients, spheres] = await Promise.all([
        prisma.project.findMany({
            where: { client: { not: null } },
            select: { client: true },
            distinct: ['client']
        }).then(arr => arr.map(p => p.client)),
        prisma.project.findMany({
            where: { sphere: { not: null } },
            select: { sphere: true },
            distinct: ['sphere']
        }).then(arr => arr.map(p => p.sphere))
    ]);
    return { clients, spheres };
}

// Add attribute value to a project
export async function addAttributeValueToProject(prisma: PrismaClient, workdayId: string, name: string, value: number | string | Date) {
    const project = await findProject(prisma, workdayId);
    if (!project.projectTypeId) throw new ApiError(400, "Invalid Project Type");
    const attributeDef = await prisma.attributeDefinition.findFirst({ where: { label: name, projectTypeId: project.projectTypeId } });
    if (!attributeDef) throw new ApiError(404, "Attribute Not Found");

    const newAttribute = { projectId: project.id, attributeDefinitionId: attributeDef.id };

    if (attributeDef.dataType === 'number' && typeof value === 'number')
        return await prisma.attributeValue.create({ data: { ...newAttribute, valueNumber: value } });
    if (attributeDef.dataType === 'string' && typeof value === 'string')
        return await prisma.attributeValue.create({ data: { ...newAttribute, valueString: value } });
    if (attributeDef.dataType === 'date' && value instanceof Date)
        return await prisma.attributeValue.create({ data: { ...newAttribute, valueDate: value } });
    throw new ApiError(400, 'Attribute Validation Failed');
}

// Update attribute value
export async function updateAttributeValue(prisma: PrismaClient, workdayId: string, attributeName: string, value: number | string | Date) {
    const project = await findProject(prisma, workdayId);
    if (!project.projectTypeId) throw new ApiError(400, "Invalid Project Type");
    const attributeDef = await prisma.attributeDefinition.findFirst({ where: { label: attributeName, projectTypeId: project.projectTypeId } });
    if (!attributeDef) throw new ApiError(404, "Attribute Definition Not Found");

    const where = {
        projectId_attributeDefinitionId: {
            projectId: project.id,
            attributeDefinitionId: attributeDef.id
        }
    };

    if (attributeDef.dataType === 'number' && typeof value === 'number')
        return await prisma.attributeValue.update({ where, data: { valueNumber: value } });
    if (attributeDef.dataType === 'string' && typeof value === 'string')
        return await prisma.attributeValue.update({ where, data: { valueString: value } });
    if (attributeDef.dataType === 'date' && value instanceof Date)
        return await prisma.attributeValue.update({ where, data: { valueDate: value } });
    throw new ApiError(400, 'Attribute Validation Failed');
}

// Delete an attribute value
export async function deleteAttributeValue(prisma: PrismaClient, workdayId: string, attributeName: string) {
    const project = await findProject(prisma, workdayId);
    if (!project.projectTypeId) throw new ApiError(400, "Invalid Project Type");
    const attributeDef = await prisma.attributeDefinition.findFirst({ where: { label: attributeName, projectTypeId: project.projectTypeId } });
    if (!attributeDef) throw new ApiError(404, "Attribute Definition Not Found");
    return await prisma.attributeValue.delete({
        where: {
            projectId_attributeDefinitionId: {
                projectId: project.id,
                attributeDefinitionId: attributeDef.id
            }
        }
    });
}

// Return a project's attributes given its workdayId
export async function getAttributeValues(prisma: PrismaClient, workdayId: string): Promise<AttributeValue[]> {
    const project = await findProject(prisma, workdayId);
    return await prisma.attributeValue.findMany({ where: { projectId: project.id } });
}

// Return project given workdayId
export async function findProject(prisma: PrismaClient, id: string): Promise<Project> {
    const project = await prisma.project.findUnique({ where: { workdayId: id }, include: { attributeValues: true } })
    if (project === null) throw new ApiError(404, 'Project Not Found');
    return project
}

// Update a project's type
export async function updateProjectType(prisma: PrismaClient, id: string, projectTypeId: number, clearAttributes?: boolean): Promise<Project> {
    const projectAttributes = await getAttributeValues(prisma, id);
    if (projectAttributes.length === 0)
        return await prisma.project.update({
            where: { workdayId: id },
            data: { projectTypeId: projectTypeId }
        })
    if (!clearAttributes)
        throw new ApiError(409, 'Warning: Updating project type will delete attribute data', projectAttributes)
    return await prisma.project.update({
        where: { workdayId: id },
        data: {
            projectTypeId: projectTypeId,
            attributeValues: { deleteMany: {} }
        }
    });
}
