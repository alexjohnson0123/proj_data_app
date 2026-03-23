import { apiFetch } from './client.js'
import type { EngagementType } from '@/types/api'

export async function getEngagementTypes(): Promise<EngagementType[]> {
    return apiFetch<EngagementType[]>('/api/engagements')
}

export async function createEngagementType(name: string): Promise<EngagementType> {
    return apiFetch<EngagementType>('/api/engagements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    })
}

export async function renameEngagementType(oldName: string, newName: string): Promise<EngagementType> {
    return apiFetch<EngagementType>(`/api/engagements/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
    })
}

export async function deleteEngagementType(name: string): Promise<EngagementType> {
    return apiFetch<EngagementType>(`/api/engagements/${encodeURIComponent(name)}`, {
        method: 'DELETE',
    })
}
