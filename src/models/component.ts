import mongoose, { Schema, Document } from 'mongoose';

interface IComponent extends Document {
    type: string;
    brand: string;
    modelName: string;
    socket?: string;
    price: number;
    specs: Record<string, any>;
    timestamp: Date;
}

const ComponentSchema: Schema = new Schema({
    type: { type: String, required: true },
    brand: { type: String, required: true },
    modelName: { type: String, required: true },
    socket: { type: String },
    price: { type: Number, required: true },
    specs: { type: Object, required: true },
    timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<IComponent>('Component', ComponentSchema);
