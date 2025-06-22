import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  _id: string;
  name: string;
  description: string;
  available_on: string[];
  links: {
    platform: string;
    url: string;
  }[];
  price: number;
  category: mongoose.Types.ObjectId;
  image_url?: string;
  image_data?: Buffer;
  image_mimetype?: string;
  image_filename?: string;
  images: Array<{
    data: Buffer;
    mimetype: string;
    filename: string;
  }>;
  created_at: Date;
  updated_at: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  available_on: [{
    type: String,
    trim: true
  }],
  links: [{
    platform: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    }
  }],
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required']
  },
  image_url: {
    type: String,
    trim: true
  },
  image_data: {
    type: Buffer
  },
  image_mimetype: {
    type: String
  },
  image_filename: {
    type: String
  },
  images: [{
    data: {
      type: Buffer,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Create indexes for better search performance
ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ created_at: -1 });

// Add a pre-save hook to handle legacy image_url
ProductSchema.pre('save', function (next) {
  // If there's an image_url but no images, set it as the legacy image_url only
  if (this.image_url && (!this.images || this.images.length === 0)) {
    this.images = [];
  }
  next();
});

const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product; 