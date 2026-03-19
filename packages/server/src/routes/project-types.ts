import { Router } from 'express'
import validateRequestBody from '../middleware/validator.js'
import { requireAdmin } from '../middleware/auth.js'
import prisma from '../prisma.js'
import * as services from '../services/project-type-services.js'
import {
    attributeDefSchema,
    projectTypeSchema,
    nameSchema
} from '@proj/shared'

const router = Router()

router.get('/', async (req, res) => {
    const projectTypes = await services.getProjectTypes(prisma);
    res.status(200).json(projectTypes)
})

router.post('/', requireAdmin, validateRequestBody(projectTypeSchema), async (req, res) => {
    const name = req.body.name;
    const attributeDefs = req.body.attributes;
    const newProjectType = await services.createProjectType(prisma, name, attributeDefs);
    res.status(201).json(newProjectType);
})

router.get('/:name', async (req, res) => {
    const name = req.params.name;
    const projectType = await services.getProjectTypeByName(prisma, name);
    res.status(200).json(projectType)
})

router.put('/:name', requireAdmin, validateRequestBody(nameSchema), async (req, res) => {
    const oldName = req.params.name as string;
    const newName = req.body.name;
    const projectType = await services.updateProjectType(prisma, oldName, newName);
    res.status(200).json(projectType);
})

router.delete('/:name', requireAdmin, async (req, res) => {
    const name = req.params.name as string;
    const projectType = await services.deleteProjectType(prisma, name);
    return res.status(200).json(projectType);
})

router.post('/:name/attributes', requireAdmin, validateRequestBody(attributeDefSchema), async (req, res) => {
    const projectTypeName = req.params.name as string;
    const { label, dataType } = req.body;
    const attributeDef = await services.createAttributeDefinition(prisma, label, dataType, projectTypeName);
    res.status(201).json(attributeDef);
})

router.put('/:name/attributes/:label', requireAdmin, validateRequestBody(attributeDefSchema.partial()), async (req, res) => {
    const projectTypeName = req.params.name as string;
    const oldLabel = req.params.label as string;
    const attributeData = req.body;
    const attributeDef = await services.updateAttributeDefinition(prisma, projectTypeName, oldLabel, attributeData);
    res.status(200).json(attributeDef);
})

router.delete('/:name/attributes/:label', requireAdmin, async (req, res) => {
    const projectTypeName = req.params.name as string;
    const label = req.params.label as string;
    const attributeDef = await services.deleteAttributeDefinition(prisma, projectTypeName, label);
    res.status(200).json(attributeDef);
})

export default router;
