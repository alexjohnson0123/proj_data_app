import { Router } from 'express';
import { Project } from '../models.js';
import ApiError from '../errors/api-error.js';
import * as services from '../services/project-services.js';
import validateRequestBody from '../middleware/validator.js';
import z from 'zod';

const router = Router();

function castAttrValue(value) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    const num = Number(value);
    if (!isNaN(num) && String(value).trim() !== '') return num;
    return value;
}

// Return all projects with optional search/filter
router.get('/', async (req, res) => {
    const { q, client, sphere, projectType } = req.query;
    const attrFilters = req.query.attr ?? {};

    const filter = {};

    if (q) {
        const regex = new RegExp(q, 'i');
        filter.$or = [
            { name: regex },
            { client: regex },
            { sphere: regex },
            { description: regex },
        ];
    }

    if (client) filter.client = client;
    if (sphere) filter.sphere = sphere;
    if (projectType) filter.projectType = projectType;

    for (const [label, value] of Object.entries(attrFilters)) {
        filter[`attributes.${label}`] = castAttrValue(value);
    }

    const projects = await Project.find(filter).populate('projectType', 'name');
    res.status(200).json(projects);
});

// Return distinct client/sphere values for filter dropdowns
router.get('/meta', async (req, res) => {
    const [clients, spheres] = await Promise.all([
        Project.distinct('client'),
        Project.distinct('sphere'),
    ]);
    res.status(200).json({
        clients: clients.filter(Boolean).sort(),
        spheres: spheres.filter(Boolean).sort(),
    });
});

// Return a project by id
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const project = await Project.findOne({ workdayId: id }).populate('projectType');
    if (!project) throw new ApiError(404, 'Project Not Found');
    res.status(200).json(project);
});

// Update project instance
router.put('/:id', validateRequestBody(
    z.object({
        // TODO: insert mutable fields
    }).strict()
), async (req, res) => {
    const id = req.params.id;
    const fields = req.body;

    const updated = await Project.findOneAndUpdate({ workdayId: id }, fields,
        { returnDocument: 'after' }
    );
    if (!updated) throw new ApiError(404, 'Project Not Found');

    res.status(200).json(updated);
});

router.put('/:id/project-type', validateRequestBody(
    z.object({ projectTypeId: z.string(), clearAttributes: z.boolean().optional() }).strict()
), async (req, res) => {
    const id = req.params.id;
    const { projectTypeId, clearAttributes } = req.body;

    const updated = await services.updateProjectType(id, projectTypeId, clearAttributes);

    res.status(200).json(updated)
});

router.post('/:id/attributes', validateRequestBody(
    z.object({
        name: z.string(),
        value: z.union([z.string(), z.number(), z.boolean()])
    })
), async (req, res) => {
    const id = req.params.id;
    const { name, value } = req.body;

    const project = await Project.findOne({ workdayId: id });
    if (!project) throw new ApiError(404, 'Project Not Found');

    if (project.attributes.has(name)) {
        throw new ApiError(409, 'Duplicate Key');
    }

    project.attributes.set(name, value);
    await services.validateProjectTypeAttributes(project);
    await project.save();

    return res.status(200).json({ name, value });
});

router.put('/:id/attributes/:name', validateRequestBody(
    z.object({
        name: z.string(),
        value: z.union([z.string(), z.number(), z.boolean()])
    })
), async (req, res) => {
    const id = req.params.id;
    const old_name = req.params.name
    const { name, value } = req.body;

    const project = await Project.findOne({ workdayId: id });
    if (!project) throw new ApiError(404, 'Project Not Found');

    if (!project.attributes.has(old_name)) {
        throw new ApiError(404, 'Attribute Not Found');
    }

    project.attributes.delete(old_name);
    project.attributes.set(name, value);
    await services.validateProjectTypeAttributes(project);
    await project.save();

    return res.status(200).json({ name, value });
});

router.delete('/:id/attributes/:name', async (req, res) => {
    const id = req.params.id
    const attribute_name = req.params.name

    const project = services.findProject(id);
    if (!attribute_name in project.attributes) {
        throw new ApiError(404, 'Attribute Not Found');
    }

    project.attributes.delete(attribute_name);
    await project.save()
    res.status(200).send('Attribute deleted.')
});

export default router;
