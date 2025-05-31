import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
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
    const { name, description } = body;

    // Validate input
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category already exists' },
        { status: 409 }
      );
    }

    // Create new category
    const category = new Category({
      name,
      description: description || `Explore our ${name} collection`,
      no_of_items: 0
    });

    const savedCategory = await category.save();

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      data: savedCategory
    });

  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
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
    const categories = await Category.find({}).sort({ name: 1 });
    
    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
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
    const categoryId = searchParams.get('id');

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const deletedCategory = await Category.findByIdAndDelete(categoryId);
    
    if (!deletedCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
      data: deletedCategory
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
} 