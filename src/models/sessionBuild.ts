import mongoose, { Schema, Document } from 'mongoose';

interface ISessionBuild extends Document {
    id: String;
    components: { type: string; modelName: string }[];
    total_price: number;
    created_at: Date;
    expires_at: Date;
    ai_generated: boolean;
}

const SessionBuildSchema: Schema = new Schema({
    id: { type: String, required: true },
    components: [
        {
            type: { type: String, required: true },
            modelName: { type: String, required: true },
        },
    ],
    total_price: { type: Number, required: true },
    created_at: { type: Date, default: Date.now },
    expires_at: { type: Date, required: true },
    ai_generated: { type: Boolean, default: false },
});

export default mongoose.model<ISessionBuild>(
    'session_builds',
    SessionBuildSchema
);
