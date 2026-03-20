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
