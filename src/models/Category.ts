import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  _id: string;
  name: string;
  description: string;
  no_of_items: number;
  created_at: Date;
  updated_at: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Category description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  no_of_items: {
    type: Number,
    default: 0,
    min: [0, 'Number of items cannot be negative']
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Note: No need for explicit name index since unique: true already creates one

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema); 