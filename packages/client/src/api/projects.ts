import { apiFetch } from './client.js'
import type { Project, ProjectsMeta } from '@/types/api'

interface ProjectFilters {
    q?: string
    client?: string
    sphere?: string
    projectType?: string
    attr?: Record<string, string>
}

export async function getProjects(filters: ProjectFilters = {}): Promise<Project[]> {
    const { q, client, sphere, projectType, attr } = filters
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (client) params.set('client', client)
    if (sphere) params.set('sphere', sphere)
    if (projectType) params.set('projectType', projectType)
    if (attr) {
        for (const [label, value] of Object.entries(attr)) {
            if (value !== undefined && value !== '') params.set(`attr[${label}]`, value)
        }
    }
    const qs = params.toString()
    return apiFetch<Project[]>(`/api/projects${qs ? `?${qs}` : ''}`)
}

export async function getProject(id: string): Promise<Project> {
    return apiFetch<Project>(`/api/projects/${id}`)
}

export async function getProjectsMeta(): Promise<ProjectsMeta> {
    return apiFetch<ProjectsMeta>('/api/projects/meta')
}

export async function assignProjectType(id: string, projectTypeId: string, clearAttributes?: boolean): Promise<Project> {
    return apiFetch<Project>(`/api/projects/${id}/project-type`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectTypeId, clearAttributes }),
    })
}

export async function addAttribute(id: string, name: string, value: string | number): Promise<{ name: string; value: string | number }> {
    return apiFetch(`/api/projects/${id}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, value }),
    })
}

export async function updateAttribute(id: string, oldName: string, name: string, value: string | number): Promise<{ name: string; value: string | number }> {
    return apiFetch(`/api/projects/${id}/attributes/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, value }),
    })
}
