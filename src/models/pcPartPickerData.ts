import mongoose, { Schema, Document } from 'mongoose';

interface IPcPartPickerData extends Document {
    type: string;
    data: Record<string, any>;
    fetched_at: Date;
}

const PcPartPickerDataSchema: Schema = new Schema({
    type: { type: String, required: true },
    data: { type: Object, required: true },
    fetched_at: { type: Date, default: Date.now },
});

export default mongoose.model<IPcPartPickerData>(
    'PcPartPickerData', // Name of the model
    PcPartPickerDataSchema, // Schema
    'pcpartpicker_data' // Explicitly set the collection name
);
