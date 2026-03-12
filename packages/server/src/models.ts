import mongoose, { Document } from 'mongoose'

export interface IAttributeDefinition {
    label: string
    dataType: 'number' | 'string' | 'date'
    required: boolean
}

export interface IProjectTypeDefinition extends Document {
    name: string
    attributes: IAttributeDefinition[]
}

export interface IProject extends Document {
    workdayId: string
    name?: string
    client?: string
    sphere?: string
    description?: string
    startDate?: Date
    projectType?: mongoose.Types.ObjectId
    attributes: Map<string, unknown>
}

const projectTypeDefinitionSchema = new mongoose.Schema<IProjectTypeDefinition>({
    name: { type: String, required: true, unique: true },
    attributes: [{
        label: String,
        dataType: {
            type: String,
            enum: ['number', 'string', 'date']
        },
        required: { type: Boolean, default: false }
    }]
})

export const ProjectTypeDefinition = mongoose.model<IProjectTypeDefinition>('ProjectTypeDefinition', projectTypeDefinitionSchema)

const projectSchema = new mongoose.Schema<IProject>({
    workdayId: { type: String, required: true, unique: true },
    name: String,
    client: String,
    sphere: String,
    description: String,
    startDate: Date,
    projectType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectTypeDefinition'
    },
    attributes: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
})

export const Project = mongoose.model<IProject>('Project', projectSchema)
