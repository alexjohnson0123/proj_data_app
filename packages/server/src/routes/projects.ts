import { Router } from 'express'
import { Project } from '../models.js'
import ApiError from '../errors/api-error.js'
import * as services from '../services/project-services.js'
import validateRequestBody from '../middleware/validator.js'
import { z } from 'zod'
import { ParsedQs } from 'qs'

const router = Router()

function castAttrValue(value: string): string | number | boolean {
    if (value === 'true') return true
    if (value === 'false') return false
    const num = Number(value)
    if (!isNaN(num) && value.trim() !== '') return num
    return value
}

// Return all projects with optional search/filter
router.get('/', async (req, res) => {
    const { q, client, sphere, projectType } = req.query as Record<string, string | undefined>
    const attrFilters = (req.query.attr ?? {}) as ParsedQs

    const filter: Record<string, unknown> = {}

    if (q) {
        const regex = new RegExp(q, 'i')
        filter.$or = [
            { name: regex },
            { client: regex },
            { sphere: regex },
            { description: regex },
        ]
    }

    if (client) filter.client = client
    if (sphere) filter.sphere = sphere
    if (projectType) filter.projectType = projectType

    for (const [label, value] of Object.entries(attrFilters)) {
        if (typeof value === 'string') {
            filter[`attributes.${label}`] = castAttrValue(value)
        }
    }

    const projects = await Project.find(filter).populate('projectType', 'name')
    res.status(200).json(projects)
})

// Return distinct client/sphere values for filter dropdowns
router.get('/meta', async (req, res) => {
    const [clients, spheres] = await Promise.all([
        Project.distinct('client'),
        Project.distinct('sphere'),
    ])
    res.status(200).json({
        clients: clients.filter(Boolean).sort(),
        spheres: spheres.filter(Boolean).sort(),
    })
})

// Return a project by id
router.get('/:id', async (req, res) => {
    const project = await Project.findOne({ workdayId: req.params.id }).populate('projectType')
    if (!project) throw new ApiError(404, 'Project Not Found')
    res.status(200).json(project)
})

// Update project instance
router.put('/:id', validateRequestBody(
    z.object({
        // TODO: insert mutable fields
    }).strict()
), async (req, res) => {
    const updated = await Project.findOneAndUpdate({ workdayId: req.params.id }, req.body,
        { returnDocument: 'after' }
    )
    if (!updated) throw new ApiError(404, 'Project Not Found')
    res.status(200).json(updated)
})

router.put('/:id/project-type', validateRequestBody(
    z.object({ projectTypeId: z.string(), clearAttributes: z.boolean().optional() }).strict()
), async (req, res) => {
    const { projectTypeId, clearAttributes } = req.body
    const updated = await services.updateProjectType(req.params.id as string, projectTypeId, clearAttributes)
    res.status(200).json(updated)
})

router.post('/:id/attributes', validateRequestBody(
    z.object({
        name: z.string(),
        value: z.union([z.string(), z.number(), z.boolean()])
    })
), async (req, res) => {
    const { name, value } = req.body

    const project = await Project.findOne({ workdayId: req.params.id })
    if (!project) throw new ApiError(404, 'Project Not Found')

    if (project.attributes.has(name)) {
        throw new ApiError(409, 'Duplicate Key')
    }

    project.attributes.set(name, value)
    await services.validateProjectTypeAttributes(project)
    await project.save()

    return res.status(200).json({ name, value })
})

router.put('/:id/attributes/:name', validateRequestBody(
    z.object({
        name: z.string(),
        value: z.union([z.string(), z.number(), z.boolean()])
    })
), async (req, res) => {
    const old_name = req.params.name as string
    const { name, value } = req.body

    const project = await Project.findOne({ workdayId: req.params.id })
    if (!project) throw new ApiError(404, 'Project Not Found')

    if (!project.attributes.has(old_name)) {
        throw new ApiError(404, 'Attribute Not Found')
    }

    project.attributes.delete(old_name)
    project.attributes.set(name, value)
    await services.validateProjectTypeAttributes(project)
    await project.save()

    return res.status(200).json({ name, value })
})

router.delete('/:id/attributes/:name', async (req, res) => {
    const project = await services.findProject(req.params.id)
    if (!project.attributes.has(req.params.name)) {
        throw new ApiError(404, 'Attribute Not Found')
    }

    project.attributes.delete(req.params.name)
    await project.save()
    res.status(200).send('Attribute deleted.')
})

export default router
