import { Router } from 'express';
import { ProjectTypeDefinition } from '../models.js';
import ApiError from '../errors/api-error.js';
import validateRequestBody from '../middleware/validator.js';
import requireAdmin from '../middleware/require-admin.js';
import { z } from 'zod';

const router = Router();

const attributeSchema = z.object({
    label: z.string(),
    dataType: z.string(),
    required: z.boolean().optional()
});

const projectTypeDefinitionSchema = z.object({
    name: z.string(),
    attributes: z.array(attributeSchema).optional()
});

router.get('/', async (req, res) => {
    const projectTypes = await ProjectTypeDefinition.find();
    res.status(200).json(projectTypes);
});

router.post('/', requireAdmin, validateRequestBody(projectTypeDefinitionSchema), async (req, res) => {
    const projectTypeName = req.body.name;
    const projectTypeAttributes = req.body.attributes ?? [];
    const newProjectType = await ProjectTypeDefinition.create({ name: projectTypeName, attributes: projectTypeAttributes });
    res.status(201).json(newProjectType);
});

router.get('/:name', async (req, res) => {
    const name = req.params.name;
    const projectType = await ProjectTypeDefinition.findOne({ name: name });
    if (!projectType) throw new ApiError(404, "Project Type definition not found");
    res.status(200).json(projectType);
});

router.put('/:name', requireAdmin, async () => {

});

router.delete('/:name', requireAdmin, async () => {

});

router.post('/:name/attributes', requireAdmin, validateRequestBody(attributeSchema), async (req, res) => {
    const projectTypeName = req.params.name;
    const attribute = req.body;
    const result = await ProjectTypeDefinition.updateOne(
        { name: projectTypeName },
        { $addToSet: { attributes: attribute } }
    );

    if (result.matchedCount === 0) {
        throw new ApiError(404, 'Not Found');
    }

    res.status(201).json(attribute);
});

router.put('/:name/attributes/:label', requireAdmin, validateRequestBody(attributeSchema), async (req, res) => {

});

router.delete('/:name/attributes/:label', requireAdmin, async (req, res) => {

});

export default router;
