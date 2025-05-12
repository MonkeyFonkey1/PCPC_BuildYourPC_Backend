import mongoose, { Schema, Document } from 'mongoose';

export interface IComponent extends Document {
    type: string;
    brand: string;
    modelName: string;
    socket?: string;
    price: number;
    specs: Required<{
        [key: string]: any; // Allow dynamic keys for different component specs
        memoryType?: string; 
        gpuSlot?: string;
        sataPorts?: number;
        nvmeSlots?: number;
        wattage?: number;
    }>;
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
