import { Router } from 'express'
import validateRequestBody from '../middleware/validator.js'
import { requireAdmin } from '../middleware/auth.js'
import prisma from '../prisma.js'
import {
    nameSchema,
    engagementTypeSchema
} from '@proj/shared'

const router = Router();

router.get('/', async (req, res) => {
    const engagements = await prisma.engagementType.findMany();
    res.status(200).json(engagements);
});

router.post('/', requireAdmin, validateRequestBody(engagementTypeSchema), async (req, res) => {
    const name = req.body.name;
    const newProjectType = await prisma.engagementType.create({ data: { name } })
    res.status(201).json(newProjectType);
});

router.get('/:name', async (req, res) => {
    const name = req.params.name;
    const engagementType = await prisma.engagementType.findUnique({ where: { name } });
    res.status(200).json(engagementType)
});

router.put('/:name', requireAdmin, validateRequestBody(nameSchema), async (req, res) => {
    const oldName = req.params.name as string;
    const newName = req.body.name;
    const engagementType = await prisma.engagementType.update({ where: { name: oldName }, data: { name: newName } });
    res.status(200).json(engagementType);
});

router.delete('/:name', requireAdmin, async (req, res) => {
    const name = req.params.name as string;
    const engagementType = await prisma.engagementType.delete({ where: { name } });
    return res.status(200).json(engagementType);
});

export default router;
