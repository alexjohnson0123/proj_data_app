import { Router } from 'express'
import * as services from '../services/project-services.js'
import validateRequestBody from '../middleware/validator.js'
import { z } from 'zod'
import prisma from '../prisma.js'

const router = Router()



// Return all projects with optional search/filter
router.get('/', async (req, res) => {
    const { q, client, sphere, projectType } = req.query as Record<string, string | undefined>;
    const attrFilters = (req.query.attr ?
        Array.isArray(req.query.attr) ? req.query.attr : [req.query.attr]
        : []) as string[];
    const projects = await services.searchProjects(prisma, q, client, sphere, projectType, attrFilters);
    res.status(200).json(projects);
})

// Return distinct client/sphere values for filter dropdowns
router.get('/meta', async (req, res) => {
    const meta = await services.getMeta(prisma);
    res.status(200).json(meta);
})

// Return a project by id
router.get('/:id', async (req, res) => {
    const project = await services.findProject(prisma, req.params.id);
    res.status(200).json(project);
})

// Update project instance
router.put('/:id', validateRequestBody(
    z.object({
        // TODO: insert mutable fields
    }).strict()
), async (req, res) => {
    const updated = null;
    res.status(200).json(updated);
})

// Update a project's project type
router.put('/:id/project-type', validateRequestBody(
    z.object({ projectTypeId: z.number(), clearAttributes: z.boolean().optional() }).strict()
), async (req, res) => {
    const { projectTypeId, clearAttributes } = req.body;
    const updated = await services.updateProjectType(prisma, req.params.id as string, projectTypeId, clearAttributes);
    res.status(200).json(updated);
})

// Add a new attribute value to a project
router.post('/:id/attributes', validateRequestBody(
    z.object({
        name: z.string(),
        value: z.union([z.string(), z.number(), z.boolean()])
    })
), async (req, res) => {
    const workdayId = req.params.id;
    const { name, value } = req.body;
    await services.addAttributeValueToProject(prisma, workdayId as string, name, value);

    return res.status(200).json({ name, value });
})

// Modify and update an attribute's value
router.put('/:id/attributes/:name', validateRequestBody(
    z.object({
        value: z.union([z.string(), z.number(), z.boolean()])
    })
), async (req, res) => {
    const name = req.params.name as string
    const workdayId = req.params.id as string;
    const { value } = req.body
    await services.updateAttributeValue(prisma, workdayId, name, value);
    return res.status(200).json({ value })
})

// Delete an attribute value from a project
router.delete('/:id/attributes/:name', async (req, res) => {
    const { id, name } = req.params;
    await services.deleteAttributeValue(prisma, id, name);
    res.status(200).send('Attribute deleted.')
})

export default router;
