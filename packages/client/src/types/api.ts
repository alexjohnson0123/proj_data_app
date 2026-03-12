// Temporary API types — will be replaced by @proj/shared types in Phase 3

export interface AttributeDefinition {
    label: string
    dataType: 'number' | 'string' | 'date'
    required?: boolean
}

export interface ProjectType {
    _id: string
    name: string
    attributes: AttributeDefinition[]
}

export interface Project {
    workdayId: string
    name?: string
    client?: string
    sphere?: string
    description?: string
    startDate?: string
    projectType?: ProjectType
    attributes?: Record<string, unknown>
}

export interface ProjectsMeta {
    clients: string[]
    spheres: string[]
}
