import { apiFetch } from './client.js'
import type { ProjectType } from '@/types/api'
import type { ProjectTypeInput } from '@proj/shared'

export async function getProjectTypes(): Promise<ProjectType[]> {
    return apiFetch<ProjectType[]>('/api/project-types')
}

export async function getProjectType(name: string): Promise<ProjectType> {
    return apiFetch<ProjectType>(`/api/project-types/${name}`)
}

export async function createProjectType(data: ProjectTypeInput): Promise<ProjectType> {
    return apiFetch<ProjectType>('/api/project-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
}

export async function renameProjectType(oldName: string, newName: string): Promise<ProjectType> {
    return apiFetch<ProjectType>(`/api/project-types/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
    })
}

export async function addAttributeDef(typeName: string, data: AttributeDefInput): Promise<void> {
    return apiFetch(`/api/project-types/${encodeURIComponent(typeName)}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
}

export async function deleteAttributeDef(typeName: string, label: string): Promise<void> {
    return apiFetch(`/api/project-types/${encodeURIComponent(typeName)}/attributes/${encodeURIComponent(label)}`, {
        method: 'DELETE',
    })
}
