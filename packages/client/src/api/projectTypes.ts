import { apiFetch } from './client.js'
import type { ProjectType } from '@/types/api'

export async function getProjectTypes(): Promise<ProjectType[]> {
    return apiFetch<ProjectType[]>('/api/project-types')
}

export async function getProjectType(name: string): Promise<ProjectType> {
    return apiFetch<ProjectType>(`/api/project-types/${name}`)
}
