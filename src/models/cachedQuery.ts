import mongoose, { Schema, Document } from 'mongoose';

interface ICachedQuery extends Document {
    query_type: string;
    query_params: Record<string, any>;
    results: Record<string, any>[];
    timestamp: Date;
}

const CachedQuerySchema: Schema = new Schema({
    query_type: { type: String, required: true },
    query_params: { type: Object, required: true },
    results: { type: Array, required: true },
    timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<ICachedQuery>(
    'cached_queries',
    CachedQuerySchema
);
