import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import createApp from '../src/app.js';
import prisma from '../src/prisma.js'
import dotenv from 'dotenv'
dotenv.config();

declare module 'vitest' {
    interface Assertion<T = any> {
        toHaveStatus(status: number): T;
    }
}

const app = createApp((req, res, next) => { next(); });
const adminApp = createApp((req, res, next) => { req.user = { roles: ['admin'] }; next(); });

beforeAll(() => {
    expect.extend({
        toHaveStatus(res: any, expected: number) {
            const pass = res.status === expected;
            return {
                pass,
                message: () => `Expected status ${expected}, got ${res.status}\nBody: ${JSON.stringify(res.body, null, 2)}`
            };
        }
    });
});

async function clearDb() {
    await prisma.attributeValue.deleteMany();
    await prisma.project.deleteMany();
    await prisma.attributeDefinition.deleteMany();
    await prisma.projectType.deleteMany();
}

afterEach(clearDb);

async function createProjects(k: number) {
    await prisma.project.createMany({
        data: Array.from({ length: k }, (_, i) => ({
            workdayId: `PROJ-${i}`,
            name: `Project Name ${i}`,
            client: `Client Name ${i}`,
            sphere: `Sphere ${i}`,
            description: `Description ${i}`
        }))
    });
}

describe('Projects', () => {
    describe('GET /', () => {
        beforeEach(async () => { await createProjects(10); });

        it('Should return all projects', async () => {
            const res = await request(app).get('/api/projects');
            expect(res).toHaveStatus(200);
            expect(res.body.length).toBe(10);
            expect(res.body[0]).toHaveProperty('workdayId');
        });

        it('Should return the project with name "Project Name 5"', async () => {
            const res = await request(app).get('/api/projects?q=Project Name 5');
            expect(res).toHaveStatus(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0]).toHaveProperty('name');
            expect(res.body[0].name).toBe('Project Name 5');
        });

        it('Should filter by client', async () => {
            const res = await request(app).get('/api/projects?client=Client Name 3');
            expect(res).toHaveStatus(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].client).toBe('Client Name 3');
        });

        it('Should filter by sphere', async () => {
            const res = await request(app).get('/api/projects?sphere=Sphere 3');
            expect(res).toHaveStatus(200);
            expect(res.body).toHaveLength(1);
        });
    });

    describe('GET / (Dynamic attribute filters)', () => {
        let venueTypeId: number;
        let seatCountId: number;
        let projectId: number;

        beforeEach(async () => {
            const venue = await prisma.projectType.create({
                data: {
                    name: 'Venue',
                    attributeDefs: {
                        create: [
                            { label: 'Seat Count', dataType: 'number' },
                            { label: 'Venue Type', dataType: 'string' }
                        ]
                    }
                },
                include: { attributeDefs: true }
            });
            venueTypeId = venue.id;
            seatCountId = venue.attributeDefs[0].id;
            const venueTypeAttrId = venue.attributeDefs[1].id;

            await createProjects(10);
            await prisma.project.update({
                where: { workdayId: 'PROJ-5' },
                data: {
                    attributeValues: {
                        create: { attributeDefinitionId: seatCountId, valueNumber: 5000 }
                    }
                }
            });
            await prisma.project.update({
                where: { workdayId: 'PROJ-6' },
                data: {
                    attributeValues: {
                        create: [
                            { attributeDefinitionId: seatCountId, valueNumber: 5000 },
                            { attributeDefinitionId: venueTypeAttrId, valueString: "Hockey Arena" }
                        ]
                    }
                }
            });
        });

        it('Should return project with Seat Count == 5000', async () => {
            const res = await request(app).get('/api/projects?attr=Seat Count:5000');
            expect(res).toHaveStatus(200);
            expect(res.body).toHaveLength(2);
        });

        it('Should return an empty list', async () => {
            const res = await request(app).get('/api/projects?attr=Seat Count:5001');
            expect(res).toHaveStatus(200);
            expect(res.body).toHaveLength(0);
        });
    });

    describe('GET /meta', () => {
        it('Should return all clients and spheres', async () => {
            await createProjects(10);

            const res = await request(app).get('/api/projects/meta');
            expect(res).toHaveStatus(200);
            expect(res.body).toHaveProperty('clients');
            expect(res.body.clients).toHaveLength(10);
            expect(res.body.clients).toContain('Client Name 5');
            expect(res.body).toHaveProperty('spheres');
            expect(res.body.spheres).toHaveLength(10);
            expect(res.body.spheres).toContain('Sphere 5');
        })
    });

    describe('GET /:id', () => {
        beforeEach(async () => { await createProjects(10); });

        it('Should return the matching project', async () => {
            const res = await request(app).get('/api/projects/PROJ-5');
            expect(res).toHaveStatus(200);
            expect(res.body).toHaveProperty('workdayId');
            expect(res.body.workdayId).toBe('PROJ-5');
        });

        it('Should return 404 when project does not exist', async () => {
            const res = await request(app).get('/api/projects/PROJ-missing');
            expect(res).toHaveStatus(404);
        });
    });

    describe('PUT /:id/project-type', () => {
        let venueTypeId: number;
        let residentialTypeId: number;

        beforeEach(async () => {
            await prisma.project.create({
                data: { workdayId: 'PROJ-ID', name: 'Project Name', client: 'Client Name', sphere: 'Sphere', description: 'Description' }
            });

            const venue = await prisma.projectType.create({
                data: {
                    name: 'Venue',
                    attributeDefs: {
                        create: [
                            { label: 'Seat Count', dataType: 'number' },
                            { label: 'Venue Type', dataType: 'string' }
                        ]
                    }
                }
            });
            venueTypeId = venue.id;

            const residential = await prisma.projectType.create({ data: { name: 'Residential' } });
            residentialTypeId = residential.id;
        });

        it('Should update the project type', async () => {
            const res = await request(app).put('/api/projects/PROJ-ID/project-type')
                .send({ projectTypeId: venueTypeId });
            expect(res).toHaveStatus(200);

            const project = await prisma.project.findUnique({ where: { workdayId: 'PROJ-ID' }, include: { projectType: true } });
            expect(project?.projectType?.name).toBe('Venue');
        });

        it('Should return 404 when project does not exist', async () => {
            const res = await request(app).put('/api/projects/PROJ-MISSING/project-type')
                .send({ projectTypeId: venueTypeId });
            expect(res).toHaveStatus(404);
        });

        it('Should return 409 when project has existing attributes', async () => {
            const seatCountDef = await prisma.attributeDefinition.findFirst({
                where: { label: 'Seat Count', projectTypeId: venueTypeId }
            });
            await prisma.project.update({
                where: { workdayId: 'PROJ-ID' },
                data: {
                    projectTypeId: venueTypeId, attributeValues: {
                        create: [{
                            attributeDefinitionId: seatCountDef!.id, valueNumber: 100
                        }]
                    }
                }
            });

            const res = await request(app).put('/api/projects/PROJ-ID/project-type')
                .send({ projectTypeId: residentialTypeId });
            expect(res).toHaveStatus(409);

            const project = await prisma.project.findUnique({ where: { workdayId: 'PROJ-ID' }, include: { attributeValues: true } });
            expect(project?.projectTypeId).toBe(venueTypeId);
            expect(project?.attributeValues).toHaveLength(1);
        });

        it('Should update project type when clearAttributes is true', async () => {
            const seatCountDef = await prisma.attributeDefinition.findFirst({
                where: { label: 'Seat Count', projectTypeId: venueTypeId }
            });
            await prisma.project.update({
                where: { workdayId: 'PROJ-ID' },
                data: {
                    projectTypeId: venueTypeId, attributeValues: {
                        create: [{
                            attributeDefinitionId: seatCountDef!.id, valueNumber: 100
                        }]
                    }
                }
            });

            const res = await request(app).put('/api/projects/PROJ-ID/project-type')
                .send({ projectTypeId: residentialTypeId, clearAttributes: true });
            expect(res).toHaveStatus(200);

            const project = await prisma.project.findUnique({ where: { workdayId: 'PROJ-ID' }, include: { attributeValues: true } });
            expect(project?.projectTypeId).toBe(residentialTypeId);
            expect(project?.attributeValues).toHaveLength(0);
        });
    });

    describe('POST /:id/attributes', () => {
        let venueTypeId: number;

        beforeEach(async () => {
            const venue = await prisma.projectType.create({
                data: {
                    name: 'Venue',
                    attributeDefs: {
                        create: [
                            { label: 'Seat Count', dataType: 'number' },
                            { label: 'Venue Type', dataType: 'string' }
                        ]
                    }
                }
            });
            venueTypeId = venue.id;

            await prisma.project.create({
                data: {
                    workdayId: 'PROJ-ID', name: 'Project Name', client: 'Client Name', sphere: 'Sphere', description: 'Description',
                    projectTypeId: venueTypeId
                }
            });
        });

        it('Should add the attribute to the project', async () => {
            const res = await request(app).post('/api/projects/PROJ-ID/attributes')
                .send({ name: 'Seat Count', value: 5000 });
            expect(res).toHaveStatus(200);

            const av = await prisma.attributeValue.findFirst({
                where: { project: { workdayId: 'PROJ-ID' }, attributeDef: { label: 'Seat Count' } }
            });
            expect(av?.valueNumber).toBe(5000);
        });

        it('Should return 400 when attribute value does not match the defined data type', async () => {
            const res = await request(app).post('/api/projects/PROJ-ID/attributes')
                .send({ name: 'Seat Count', value: 'Five Thousand' });
            expect(res).toHaveStatus(400);

            const count = await prisma.attributeValue.count({ where: { project: { workdayId: 'PROJ-ID' } } });
            expect(count).toBe(0);
        });

        it('Should return 409 when attribute name already exists on the project', async () => {
            const seatCountDef = await prisma.attributeDefinition.findFirst({
                where: { label: 'Seat Count', projectTypeId: venueTypeId }
            });
            await prisma.project.update({
                where: { workdayId: 'PROJ-ID' },
                data: { attributeValues: { create: [{ attributeDefinitionId: seatCountDef!.id, valueNumber: 5000 }] } }
            });

            const res = await request(app).post('/api/projects/PROJ-ID/attributes').send({ name: 'Seat Count', value: 6000 });
            expect(res).toHaveStatus(409);

            const count = await prisma.attributeValue.count({ where: { project: { workdayId: 'PROJ-ID' } } });
            expect(count).toBe(1);
        });
    });

    describe('PUT /:id/attributes/:name', () => {
        let venueTypeId: number;
        let seatCountId: number;
        let projectId: number;

        beforeEach(async () => {
            const venue = await prisma.projectType.create({
                data: {
                    name: 'Venue',
                    attributeDefs: {
                        create: [
                            { label: 'Seat Count', dataType: 'number' },
                            { label: 'Venue Type', dataType: 'string' }
                        ]
                    }
                },
                include: { attributeDefs: true }
            });
            venueTypeId = venue.id;
            seatCountId = venue.attributeDefs[0].id;

            const project = await prisma.project.create({
                data: {
                    workdayId: 'PROJ-ID', name: 'Project Name', client: 'Client Name', sphere: 'Sphere', description: 'Description',
                    projectTypeId: venueTypeId,
                    attributeValues: {
                        create: {
                            attributeDefinitionId: seatCountId, valueNumber: 1000
                        }
                    }
                }
            });
            projectId = project.id;
        });

        it('Should change the attribute value', async () => {
            const res = await request(app).put('/api/projects/PROJ-ID/attributes/Seat Count')
                .send({ value: 5000 })
            expect(res).toHaveStatus(200);

            const count = await prisma.attributeValue.count({ where: { projectId, attributeDefinitionId: seatCountId, valueNumber: 5000 } })
            expect(count).toBe(1);
        });

        it('Should return 400 when value is incorrect type', async () => {
            const res = await request(app).put('/api/projects/PROJ-ID/attributes/Seat Count')
                .send({ value: "Five Thousand" })
            expect(res).toHaveStatus(400);
        });

        it('Should return 404 project is not found', async () => {
            const res = await request(app).put('/api/projects/PROJ-MISSING/attributes/Seat Count')
                .send({ value: 5000 })
            expect(res).toHaveStatus(404);
        });

        it('Should return 404 attribute name is not found', async () => {
            const res = await request(app).put('/api/projects/PROJ-ID/attributes/MISSING')
                .send({ value: 5000 })
            expect(res).toHaveStatus(404);
        });

    });

    describe('DELETE /:id/attributes/:name', () => {
        let venueTypeId: number;
        let seatCountId: number;
        let projectId: number;

        beforeEach(async () => {
            const venue = await prisma.projectType.create({
                data: {
                    name: 'Venue',
                    attributeDefs: {
                        create: [
                            { label: 'Seat Count', dataType: 'number' },
                            { label: 'Venue Type', dataType: 'string' }
                        ]
                    }
                },
                include: { attributeDefs: true }
            });
            venueTypeId = venue.id;
            seatCountId = venue.attributeDefs[0].id;

            const project = await prisma.project.create({
                data: {
                    workdayId: 'PROJ-ID', name: 'Project Name', client: 'Client Name', sphere: 'Sphere', description: 'Description',
                    projectTypeId: venueTypeId,
                    attributeValues: {
                        create: {
                            attributeDefinitionId: seatCountId, valueNumber: 1000
                        }
                    }
                }
            });
            projectId = project.id;
        });
        it('Should delete the attribute value', async () => {
            const res = await request(app).delete('/api/projects/PROJ-ID/attributes/Seat Count');
            expect(res).toHaveStatus(200);

            const count = await prisma.attributeValue.count();
            expect(count).toBe(0);
        });

        it('Should return 404 project is not found', async () => {
            const res = await request(app).delete('/api/projects/PROJ-MISSING/attributes/Seat Count')
            expect(res).toHaveStatus(404);
        });

        it('Should return 404 attribute name is not found', async () => {
            const res = await request(app).delete('/api/projects/PROJ-ID/attributes/MISSING')
            expect(res).toHaveStatus(404);
        });
    });
});

describe('Project Types', () => {
    describe('GET /', () => {
        it('Should return all project types', async () => {
            const names = ['Venues', 'Residential', 'Municipality'];
            await Promise.all(names.map(name => prisma.projectType.create({ data: { name } })));

            const res = await request(app).get('/api/project-types');
            expect(res).toHaveStatus(200);
            expect(res.body).toHaveLength(3);
            expect(res.body.map((pt: any) => pt.name)).toEqual(expect.arrayContaining(names));
        });
    });

    describe('GET /:name', () => {
        beforeEach(async () => {
            const names = ['Venues', 'Residential', 'Municipality'];
            await Promise.all(names.map(name => prisma.projectType.create({ data: { name } })));
        });
        it('Should return the project type with matching name', async () => {
            const res = await request(app).get('/api/project-types/Venues');
            expect(res).toHaveStatus(200);
            expect(res.body).toHaveProperty('name');
            expect(res.body.name).toBe('Venues');
        });

        it('Should return 404 Project Type Not Found', async () => {
            const res = await request(app).get('/api/project-types/MISSING');
            expect(res).toHaveStatus(404);
        });
    });

    describe('POST /', () => {
        it('Should create the project type', async () => {
            const res = await request(adminApp).post('/api/project-types')
                .send({ name: 'Venues' });
            expect(res).toHaveStatus(201);

            const types = await prisma.projectType.findMany();
            expect(types).toHaveLength(1);
            expect(types[0].name).toBe('Venues');
        });

        it('Should create the project type with attributes', async () => {
            const payload = {
                name: 'Venues',
                attributes: [
                    { label: 'Seat Count', dataType: 'number' },
                    { label: 'Venue Type', dataType: 'string' }
                ]
            };

            const res = await request(adminApp).post('/api/project-types').send(payload);
            expect(res).toHaveStatus(201);

            const pt = await prisma.projectType.findUnique({ where: { name: 'Venues' }, include: { attributeDefs: true } });
            expect(pt?.attributeDefs).toHaveLength(2);
            expect(pt?.attributeDefs[0].label).toBe('Seat Count');
            expect(pt?.attributeDefs[1].label).toBe('Venue Type');
        });

        it('Should return 400 when request body is invalid', async () => {
            const res = await request(adminApp).post('/api/project-types')
                .send({});
            expect(res).toHaveStatus(400);
        });

        it('Should return 409 when project type name already exists', async () => {
            await prisma.projectType.create({ data: { name: 'Venues' } });
            const res = await request(adminApp).post('/api/project-types')
                .send({ name: 'Venues' });
            expect(res).toHaveStatus(409);
        });

        it('Should return 403 when not run as admin', async () => {
            const res = await request(app).post('/api/project-types');
            expect(res).toHaveStatus(403);
        });
    });

    describe('PUT /:name', () => {
        let venueId: number;
        beforeEach(async () => {
            const names = ['Venues', 'Residential', 'Municipality'];
            const projTypes = await Promise.all(names.map(name => prisma.projectType.create({ data: { name } })));
            venueId = projTypes[0].id;
        });

        it('Should update the project type', async () => {
            const res = await request(adminApp).put('/api/project-types/Venues')
                .send({ name: 'Updated Name' });
            expect(res).toHaveStatus(200);

            const count = await prisma.projectType.count({ where: { id: venueId, name: 'Updated Name' } });
            expect(count).toBe(1);
        });

        it('Should return 403 when not run as admin', async () => {
            const res = await request(app).put('/api/project-types/Venues');
            expect(res).toHaveStatus(403);
        })
    });

    describe('DELETE /:name', () => {
        let venueId: number;
        beforeEach(async () => {
            const names = ['Venues', 'Residential', 'Municipality'];
            const projTypes = await Promise.all(names.map(name => prisma.projectType.create({ data: { name } })));
            venueId = projTypes[0].id;
        });

        it('Should delete the project type', async () => {
            const res = await request(adminApp).delete('/api/project-types/Venues')
            expect(res).toHaveStatus(200);

            const count = await prisma.projectType.count({ where: { id: venueId } });
            expect(count).toBe(0);
        })

        it('Should return 403 when not run as admin', async () => {
            const res = await request(app).delete('/api/project-types/Venues');
            expect(res).toHaveStatus(403);
        })
    });

    describe('POST /:name/attributes', () => {
        beforeEach(async () => {
            await prisma.projectType.create({ data: { name: 'Venues' } });
        });

        it('Should add the attribute to the project type', async () => {
            const res = await request(adminApp).post('/api/project-types/Venues/attributes')
                .send({ label: 'Seat Count', dataType: 'number' });
            expect(res).toHaveStatus(201);
        });

        it('Should return 404 when project type does not exist', async () => {
            const res = await request(adminApp).post('/api/project-types/Missing Type/attributes')
                .send({ label: 'Seat Count', dataType: 'number' });
            expect(res).toHaveStatus(404);
        });

        it('Should return 403 when not run as admin', async () => {
            const res = await request(app).post('/api/project-types/Venues/attributes');
            expect(res).toHaveStatus(403);
        });
    });

    describe('PUT /:name/attributes/:label', () => {
        let venueId: number;
        let seatCountId: number;
        beforeEach(async () => {
            const projectType = await prisma.projectType.create({
                data: {
                    name: 'Venues',
                    attributeDefs: { create: { label: 'Seat Count', dataType: 'number' } }
                },
                include: { attributeDefs: true }
            });
            venueId = projectType.id;
            seatCountId = projectType.attributeDefs[0].id;
        });

        it('Should update the attribute definition', async () => {
            const res = await request(adminApp).put('/api/project-types/Venues/attributes/Seat Count')
                .send({ label: 'Updated Label' });
            expect(res).toHaveStatus(200);

            const count = await prisma.attributeDefinition.count({ where: { id: seatCountId, label: 'Updated Label' } });
            expect(count).toBe(1);
        });

        it('Should return 403 when not run as admin', async () => {
            const res = await request(app).put('/api/project-types/Venues/attributes/Seat Count');
            expect(res).toHaveStatus(403);
        });
    });

    describe('DELETE /:name/attributes/:label', () => {
        let venueId: number;
        let seatCountId: number;
        beforeEach(async () => {
            const projectType = await prisma.projectType.create({
                data: {
                    name: 'Venues',
                    attributeDefs: { create: { label: 'Seat Count', dataType: 'number' } }
                },
                include: { attributeDefs: true }
            });
            venueId = projectType.id;
            seatCountId = projectType.attributeDefs[0].id;
        });

        it('Should delete the attribute definition', async () => {
            const res = await request(adminApp).delete('/api/project-types/Venues/attributes/Seat Count');
            expect(res).toHaveStatus(200);

            const count = await prisma.attributeDefinition.count({ where: { id: seatCountId } });
            expect(count).toBe(0);
        });

        it('Should return 403 when not run as admin', async () => {
            const res = await request(app).delete('/api/project-types/Venues/attributes/Seat Count');
            expect(res).toHaveStatus(403);
        });
    });
});