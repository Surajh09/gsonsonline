import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';

// Development-only check
function isDevelopment() {
  return process.env.NODE_ENV === 'development' || 
         process.env.VERCEL_ENV === 'development' ||
         process.env.NODE_ENV !== 'production';
}

export async function POST(request: NextRequest) {
  // Block access in production
  if (!isDevelopment()) {
    return NextResponse.json(
      { success: false, message: 'Admin endpoints are not available in production' },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    
    const body = await request.json();
    const { name, description, price, category, available_on, links, image_url } = body;

    // Validate input
    if (!name || !description || !price || !category) {
      return NextResponse.json(
        { success: false, error: 'Name, description, price, and category are required' },
        { status: 400 }
      );
    }

    // Find category by name or ID
    let categoryDoc;
    if (typeof category === 'string' && category.length === 24) {
      // Assume it's an ObjectId
      categoryDoc = await Category.findById(category);
    } else {
      // Assume it's a category name
      categoryDoc = await Category.findOne({ name: category });
    }

    if (!categoryDoc) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if product already exists
    const existingProduct = await Product.findOne({ name });
    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product already exists' },
        { status: 409 }
      );
    }

    // Create new product
    const product = new Product({
      name,
      description,
      price: Number(price),
      category: categoryDoc._id,
      available_on: available_on || [],
      links: links || [],
      image_url: image_url || null
    });

    const savedProduct = await product.save();

    // Update category item count
    const productCount = await Product.countDocuments({ category: categoryDoc._id });
    await Category.findByIdAndUpdate(categoryDoc._id, { no_of_items: productCount });

    // Populate category info for response
    const populatedProduct = await Product.findById(savedProduct._id).populate('category', 'name description');

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct
    });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Block access in production
  if (!isDevelopment()) {
    return NextResponse.json(
      { success: false, message: 'Admin endpoints are not available in production' },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    const products = await Product.find({})
      .populate('category', 'name')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Product.countDocuments({});
    
    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Block access in production
  if (!isDevelopment()) {
    return NextResponse.json(
      { success: false, message: 'Admin endpoints are not available in production' },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const categoryId = product.category;
    const deletedProduct = await Product.findByIdAndDelete(productId);

    // Update category item count
    const productCount = await Product.countDocuments({ category: categoryId });
    await Category.findByIdAndUpdate(categoryId, { no_of_items: productCount });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
      data: deletedProduct
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
} 