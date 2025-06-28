import mongoose, { Schema, Document } from 'mongoose';

// Interface for a single component in a build
interface IComponent {
    type: string;
    modelName: string;
    price: number;
}


interface IBuild {
    buildId: string;
    components: IComponent[];
    totalPrice: number;
    createdAt: Date;
    expiresAt: Date;
    aiGenerated: boolean;
}

// Interface for the session document
export interface ISessionBuild extends Document {
    sessionId: string;
    builds: IBuild[];
}

// Schema for the build
const BuildSchema: Schema = new Schema({
    buildId: { type: String, required: true },
    components: [
        {
            type: { type: String, required: true },
            modelName: { type: String, required: true },
            price: { type: Number, required: true },
        },
    ],
    totalPrice: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    aiGenerated: { type: Boolean, default: false },
});

// Schema for the session build
const SessionBuildSchema: Schema = new Schema(
    {
        sessionId: { type: String, required: true, unique: true },
        builds: [BuildSchema],
    },
    { collection: 'session_builds' } 
);

export default mongoose.model<ISessionBuild>('SessionBuild', SessionBuildSchema);
