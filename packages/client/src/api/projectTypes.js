import { apiFetch } from './client.js';

export async function getProjectTypes() {
    return apiFetch('/api/project-types');
}

export async function getProjectType(name) {
    return apiFetch(`/api/project-types/${name}`);
}
