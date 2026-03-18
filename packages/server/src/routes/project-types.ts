import { Router } from 'express'
import validateRequestBody from '../middleware/validator.js'
import requireAdmin from '../middleware/require-admin.js'
import { z } from 'zod'
import prisma from '../prisma.js'
import * as services from '../services/project-type-services.js'

const router = Router()

const attributeSchema = z.object({
    label: z.string(),
    dataType: z.string(),
    required: z.boolean().optional()
})

const projectTypeDefinitionSchema = z.object({
    name: z.string(),
    attributes: z.array(attributeSchema).optional()
})

router.get('/', async (req, res) => {
    const projectTypes = await services.getProjectTypes(prisma);
    res.status(200).json(projectTypes)
})

router.post('/', requireAdmin, validateRequestBody(projectTypeDefinitionSchema), async (req, res) => {
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

router.put('/:name', requireAdmin, async (req, res) => {

})

router.delete('/:name', requireAdmin, async (req, res) => {

})

router.post('/:name/attributes', requireAdmin, validateRequestBody(attributeSchema), async (req, res) => {
    const projectTypeName = req.params.name as string;
    const { label, dataType } = req.body;
    const attributeDef = await services.createAttributeDefinition(prisma, label, dataType, projectTypeName);
    res.status(201).json(attributeDef);
})

router.put('/:name/attributes/:label', requireAdmin, validateRequestBody(attributeSchema), async (req, res) => {

})

router.delete('/:name/attributes/:label', requireAdmin, async (req, res) => {

})

export default router;
