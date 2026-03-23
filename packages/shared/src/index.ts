import { z } from 'zod';

const dataTypeSchema = z.enum(['string', 'number', 'date']);

export const attributeDefSchema = z.object({
    label: z.string(),
    dataType: dataTypeSchema,
});
export type AttributeDefInput = z.infer<typeof attributeDefSchema>;

export const projectTypeSchema = z.object({
    name: z.string(),
    attributes: z.array(attributeDefSchema).optional()
});
export type ProjectTypeInput = z.infer<typeof projectTypeSchema>;

export const changeProjectTypeSchema = z.object({
    projectTypeId: z.number(),
    clearAttributes: z.boolean().optional()
}).strict()
export type ChangeProjectTypeInput = z.infer<typeof changeProjectTypeSchema>;

const value = z.union([z.string(), z.number(), z.boolean()])

export const valueSchema = z.object({ value });
export type ValueInput = z.infer<typeof valueSchema>;

export const attributeValueSchema = z.object({
    name: z.string(),
    value
});
export type AttributeValueInput = z.infer<typeof attributeValueSchema>;

export const nameSchema = z.object({ name: z.string() });
export type NameInput = z.infer<typeof nameSchema>;

export const engagementTypeSchema = z.object({ name: z.string() });
export type EngagementTypeInput = z.infer<typeof engagementTypeSchema>;