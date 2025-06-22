import mongoose, { Document, Schema } from 'mongoose';

export interface IInsight extends Document {
    product_id: mongoose.Types.ObjectId;
    event_type: 'view' | 'link_click';
    platform?: string;
    created_at: Date;
}

const InsightSchema = new Schema<IInsight>({
    product_id: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required']
    },
    event_type: {
        type: String,
        enum: ['view', 'link_click'],
        required: [true, 'Event type is required']
    },
    platform: {
        type: String,
        trim: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Create indexes for better query performance
InsightSchema.index({ product_id: 1 });
InsightSchema.index({ event_type: 1 });
InsightSchema.index({ created_at: -1 });

const Insight = mongoose.models.Insight || mongoose.model<IInsight>('Insight', InsightSchema);

export default Insight; 