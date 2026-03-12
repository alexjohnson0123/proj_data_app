import request from 'supertest'
import createApp from '../src/app.js'
import { DBConnect, DBClose, DBClear } from '../src/start-database.js'
import { Project, ProjectTypeDefinition } from '../src/models.js'
import dotenv from 'dotenv';

const app = createApp((req, res, next) => {
    next();
});
const adminApp = createApp((req, res, next) => {
    req.user = { roles: ['admin'] };
    next();
});

beforeAll(async () => {
    dotenv.config();
    await DBConnect();

    expect.extend({
        toHaveStatus(res, expected) {
            const pass = res.status === expected;

            return {
                pass,
                message: () => `Expected status ${expected}, got ${res.status}\nBody: ${JSON.stringify(res.body, null, 2)}`
            };
        }
    });
});
afterEach(DBClear);
afterAll(DBClose);

async function createProjects(k) {
    const projects = [];
    for (let i = 0; i < k; i++) {
        const project = await Project.create({
            workdayId: `PROJ-${i}`,
            name: `Project Name ${i}`,
            client: `Client Name ${i}`,
            sphere: `Sphere ${i}`,
            description: `Description ${i}`
        });
        projects.push(project);
    }
    return projects;
}

describe('Projects', () => {
    describe('GET /', () => {
        beforeEach(async () => {
            await createProjects(10);
        });

        it('Should return all projects', async () => {
            const res = await request(app).get('/api/projects');

            expect(res).toHaveStatus(200);
            expect(res.body.length).toBe(10);
            expect(res.body[0]).toHaveProperty('workdayId');
        });
    });

    describe('GET /:id', () => {
        beforeEach(async () => {
            await createProjects(10);
        });

        it('Should return the matching project', async () => {
            const res = await request(app).get(`/api/projects/PROJ-5`);

            expect(res).toHaveStatus(200);
            expect(res.body).toHaveProperty('workdayId');
            expect(res.body.workdayId).toBe('PROJ-5');
        });

        it('Should return 404 when project does not exist', async () => {
            const res = await request(app).get('/api/projects/PROJ-missing');
            expect(res).toHaveStatus(404);
        });
    });

    describe('PUT /:id', () => {

    });

    describe('PUT /:id/project-type', () => {
        beforeEach(async () => {
            await Project.create({
                workdayId: `PROJ-ID`,
                name: `Project Name`,
                client: `Client Name`,
                sphere: `Sphere`,
                description: `Description`
            });

            await ProjectTypeDefinition.create({
                name: 'Venue',
                attributes: [
                    {
                        label: 'Seat Count',
                        dataType: 'number'
                    },
                    {
                        label: 'Venue Type',
                        dataType: 'string'
                    }
                ]
            });

            await ProjectTypeDefinition.create({ name: 'Residential' });
        });

        it('Should update the project type', async () => {
            const projectType = await ProjectTypeDefinition.findOne({ name: 'Venue' });
            const payload = {
                projectTypeId: projectType.id
            }

            const res = await request(app).put('/api/projects/PROJ-ID/project-type').send(payload);
            expect(res).toHaveStatus(200);

            const project = await Project.findOne({ workdayId: 'PROJ-ID' }).populate('projectType');
            expect(project).toHaveProperty('projectType');
            expect(project.projectType.name).toBe('Venue');
        });

        it('Should return 404 when project does not exist', async () => {
            const payload = {
                projectTypeId: "000000000000000000000000"
            }

            const res = await request(app).put('/api/projects/PROJ-MISSING/project-type').send(payload);
            expect(res).toHaveStatus(404);
        });

        it('Should return 409 when project has existing attributes', async () => {
            const venueType = await ProjectTypeDefinition.findOne({ name: 'Venue' });
            const residentialType = await ProjectTypeDefinition.findOne({ name: 'Residential' });
            const project = await Project.findOne({ workdayId: 'PROJ-ID' });
            project.projectType = venueType._id;
            project.attributes.set("Seat Count", 100);
            await project.save();

            const payload = {
                projectTypeId: residentialType._id
            }

            const res = await request(app).put('/api/projects/PROJ-ID/project-type').send(payload);
            expect(res).toHaveStatus(409);
            const updatedProject = await Project.findOne({ workdayId: 'PROJ-ID' });
            expect(updatedProject).toHaveProperty('projectType');
            expect(updatedProject.projectType).toEqual(venueType._id);
            expect(updatedProject.attributes.size).toBe(1);
        });

        it('Should update project type when clearAttributes is true', async () => {
            const venueType = await ProjectTypeDefinition.findOne({ name: 'Venue' });
            const residentialType = await ProjectTypeDefinition.findOne({ name: 'Residential' });
            const project = await Project.findOne({ workdayId: 'PROJ-ID' });
            project.projectType = venueType._id;
            project.attributes.set("Seat Count", 100);
            await project.save();

            const payload = {
                projectTypeId: residentialType.id,
                clearAttributes: true
            }

            const res = await request(app).put('/api/projects/PROJ-ID/project-type').send(payload);
            expect(res).toHaveStatus(200);
            const updatedProject = await Project.findOne({ workdayId: 'PROJ-ID' });
            expect(updatedProject).toHaveProperty('projectType');
            expect(updatedProject.projectType).toEqual(residentialType._id);
            expect(updatedProject.attributes.size).toBe(0);
        });
    });

    describe('POST /:id/attributes', () => {
        beforeEach(async () => {
            const projType = await ProjectTypeDefinition.create({
                name: 'Venue',
                attributes: [
                    {
                        label: 'Seat Count',
                        dataType: 'number'
                    },
                    {
                        label: 'Venue Type',
                        dataType: 'string'
                    }
                ]
            });

            await Project.create({
                workdayId: `PROJ-ID`,
                name: `Project Name`,
                client: `Client Name`,
                sphere: `Sphere`,
                description: `Description`,
                projectType: projType.id
            });
        });

        it('Should add the attribute to the project', async () => {
            const payload = {
                name: 'Seat Count',
                value: 5000
            }

            const res = await request(app).post('/api/projects/PROJ-ID/attributes').send(payload);
            expect(res).toHaveStatus(200);

            const project = await Project.findOne({ workdayId: 'PROJ-ID' });
            expect(project.attributes.size).toBe(1);
            expect(project.attributes.get('Seat Count')).toBe(5000);
        });

        it('Should return 400 when attribute value does not match the defined data type', async () => {
            const payload = {
                name: 'Seat Count',
                value: 'Five Thousand'
            }

            const res = await request(app).post('/api/projects/PROJ-ID/attributes').send(payload);
            expect(res).toHaveStatus(400);

            const project = await Project.findOne({ workdayId: 'PROJ-ID' });
            expect(project.attributes.size).toBe(0);
        });

        it('Should return 409 when attribute name already exists on the project', async () => {
            const proj = await Project.findOne({ workdayId: 'PROJ-ID' });
            proj.attributes.set('Seat Count', 5000);
            await proj.save();
            const payload = {
                name: 'Seat Count',
                value: 6000
            }

            const res = await request(app).post('/api/projects/PROJ-ID/attributes').send(payload);
            expect(res).toHaveStatus(409);

            const project = await Project.findOne({ workdayId: 'PROJ-ID' });
            expect(project.attributes.size).toBe(1);
        });
    });

    describe('PUT /:id/attributes/:name', () => {

    });

    describe('DELETE /:id/attributes/:name', () => {

    });
});

describe('Project Types', () => {
    describe('GET /', () => {
        it('Should return all project types', async () => {
            const projectTypeNames = ['Venues', 'Residential', 'Municipality']
            await ProjectTypeDefinition.insertMany(
                projectTypeNames.map(name => ({ name }))
            );

            const res = await request(app).get('/api/project-types');
            expect(res).toHaveStatus(200);

            expect(res.body).toHaveLength(3);
            expect(res.body.map(pt => pt.name)).toEqual(expect.arrayContaining(projectTypeNames));
        });
    });

    describe('POST /', () => {
        it('Should create the project type', async () => {
            const payload = { name: 'Venues' };

            const res = await request(adminApp)
                .post('/api/project-types')
                .send(payload);

            expect(res).toHaveStatus(201);

            const projectTypesInDb = await ProjectTypeDefinition.find();

            // Check project type is created
            expect(projectTypesInDb).toHaveLength(1);
            expect(projectTypesInDb[0].name).toBe('Venues');

            // Check attribute list exists and is empty
            expect(projectTypesInDb[0].attributes).toEqual([]);
        });

        it('Should create the project type with attributes', async () => {
            const payload = {
                name: 'Venues',
                attributes: [
                    {
                        label: 'Seat Count',
                        dataType: 'number'
                    },
                    {
                        label: 'Venue Type',
                        dataType: 'string'
                    }
                ]
            }

            const res = await request(adminApp)
                .post('/api/project-types')
                .send(payload);

            expect(res).toHaveStatus(201);

            const projectTypesInDb = await ProjectTypeDefinition.find();
            expect(projectTypesInDb).toHaveLength(1);
            expect(projectTypesInDb[0].name).toBe('Venues');
            expect(projectTypesInDb[0].attributes).toHaveLength(2);

            expect(projectTypesInDb[0].attributes[0].label).toBe('Seat Count');
            expect(projectTypesInDb[0].attributes[0].dataType).toBe('number');

            expect(projectTypesInDb[0].attributes[1].label).toBe('Venue Type');
            expect(projectTypesInDb[0].attributes[1].dataType).toBe('string');
        });

        it('Should return 400 when request body is invalid', async () => {
            const res = await request(adminApp).post('/api/project-types')
                .send({});
            expect(res).toHaveStatus(400);
        });

        it('Should return 409 when project type name already exists', async () => {
            await ProjectTypeDefinition.create({ name: 'Venues' });
            const res = await request(adminApp)
                .post('/api/project-types')
                .send({ name: 'Venues' });
            expect(res).toHaveStatus(409);
        });

        it('Should return 403 when not run as admin', async () => {
            const res = await request(app)
                .post('/api/project-types')
            expect(res).toHaveStatus(403);
        });
    });

    describe('GET /:name', () => {

    });

    describe('PUT /:name', () => {

    });

    describe('DELETE /:name', () => {

    });

    describe('POST /:name/attributes', () => {
        beforeEach(async () => {
            await ProjectTypeDefinition.create({ name: 'Venues' });
        });

        it('Should add the attribute to the project type', async () => {
            const payload = {
                label: 'Seat Count',
                dataType: 'number'
            }
            const res = await request(adminApp)
                .post('/api/project-types/Venues/attributes')
                .send(payload);
            expect(res).toHaveStatus(201);
        });

        it('Should return 404 when project type does not exist', async () => {
            const payload = {
                label: 'Seat Count',
                dataType: 'number'
            }
            const res = await request(adminApp)
                .post('/api/project-types/Missing Type/attributes')
                .send(payload);
            expect(res).toHaveStatus(404);
        });

        it('Should return 403 when not run as admin', async () => {
            const res = await request(app)
                .post('/api/project-types/Missing Type/attributes')
            expect(res).toHaveStatus(403);
        })
    });

    describe('PUT /:name/attributes', () => {

    });

    describe('DELETE /:name/attributes', () => {

    });
});
