import type { DataType } from '@proj/shared'

export interface AttributeDefinition {
    id: number
    label: string
    dataType: DataType
    required: boolean
    projectTypeId: number
}

export interface ProjectType {
    id: number
    name: string
    attributeDefs: AttributeDefinition[]
}

export interface AttributeValue {
    id: number
    projectId: number
    attributeDefinitionId: number
    valueString: string | null
    valueNumber: number | null
    valueDate: string | null
}

export interface Project {
    id: number
    workdayId: string
    name: string | null
    client: string | null
    sphere: string | null
    region: string | null
    description: string | null
    startDate: string | null
    projectTypeId: number | null
    projectType: ProjectType | null
    attributeValues?: AttributeValue[]
}

export interface ProjectsMeta {
    clients: string[]
    spheres: string[]
}
