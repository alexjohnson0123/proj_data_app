import { apiFetch } from './client.js';

export async function getProjects({ q, client, sphere, projectType, attr } = {}) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (client) params.set('client', client);
    if (sphere) params.set('sphere', sphere);
    if (projectType) params.set('projectType', projectType);
    if (attr) {
        for (const [label, value] of Object.entries(attr)) {
            if (value !== undefined && value !== '') params.set(`attr[${label}]`, value);
        }
    }
    const qs = params.toString();
    return apiFetch(`/api/projects${qs ? `?${qs}` : ''}`);
}

export async function getProject(id) {
    return apiFetch(`/api/projects/${id}`);
}

export async function getProjectsMeta() {
    return apiFetch('/api/projects/meta');
}

export async function assignProjectType(id, projectTypeId, clearAttributes) {
    return apiFetch(`/api/projects/${id}/project-type`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectTypeId, clearAttributes }),
    });
}

export async function addAttribute(id, name, value) {
    return apiFetch(`/api/projects/${id}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, value }),
    });
}

export async function updateAttribute(id, oldName, name, value) {
    return apiFetch(`/api/projects/${id}/attributes/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, value }),
    });
}
