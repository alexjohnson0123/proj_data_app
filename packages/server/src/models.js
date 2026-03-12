import mongoose from 'mongoose'

const projectTypeDefinitionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    attributes: [{
        label: String,
        dataType: {
            type: String,
            enum: [
                'number',
                'string',
                'date',
            ]
        },
        required: { type: Boolean, default: false }
    }]
});

export const ProjectTypeDefinition = mongoose.model('ProjectTypeDefinition', projectTypeDefinitionSchema);

const projectSchema = new mongoose.Schema({
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
});

export const Project = mongoose.model("Project", projectSchema);
