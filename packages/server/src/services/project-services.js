import ApiError from "../errors/api-error.js";
import { Project, ProjectTypeDefinition } from "../models.js";

export async function validateProjectTypeAttributes(project) {
    if (project.attributes.size === 0) return;

    if (!project.projectType) {
        throw new ApiError(400, 'Project Type Validation Failed');
    }

    const projectTypeDefinition = await ProjectTypeDefinition.findById(project.projectType);
    if (!projectTypeDefinition) throw new ApiError(404, 'Project Type Not Found');

    for (const [name, value] of project.attributes.entries()) {
        const defAttribute = projectTypeDefinition.attributes.find(a => a.label === name);

        if (!defAttribute || defAttribute.dataType !== typeof value) {
            throw new ApiError(400, 'Attribute Validation Failed');
        }
    }
}

export async function findProject(id) {
    const project = await Project.findOne({ workdayId: id });
    if (project === null) {
        throw new ApiError(404, 'Project Not Found');
    }
    return project;
}

export async function updateProjectType(id, projectTypeId, clearAttributes) {
    const project = await findProject(id);
    const projectType = await ProjectTypeDefinition.findById(projectTypeId);
    if (!projectType) throw new ApiError(404, "Project Type Not Found");

    if (project.attributes.size > 0) {
        if (!clearAttributes) {
            const attributes = Object.fromEntries(project.attributes.entries());
            throw new ApiError(409, "Warning: Updating project type will delete attribute data", attributes);
        } else {
            project.attributes.clear();
        }
    }

    project.projectType = projectTypeId;
    await project.save();

    return project;
}

