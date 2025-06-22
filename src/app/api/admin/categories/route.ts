import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';

// Helper function to check if admin access is enabled
const isAdminEnabled = () => {
  return process.env.NEXT_PUBLIC_ADMIN_ENABLED === 'true';
};

export async function GET(request: NextRequest) {
  try {
    // Check if admin access is enabled
    if (!isAdminEnabled()) {
      return NextResponse.json({ success: false, error: 'Admin access is not enabled' }, { status: 403 });
    }

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

export async function POST(request: NextRequest) {
  try {
    // Check if admin access is enabled
    if (!isAdminEnabled()) {
      return NextResponse.json({ success: false, error: 'Admin access is not enabled' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { name, description } = body;

    // Validate input
    if (!name || !description) {
      return NextResponse.json(
        { success: false, error: 'Name and description are required' },
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
      description,
      no_of_items: 0
    });

    await category.save();

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if admin access is enabled
    if (!isAdminEnabled()) {
      return NextResponse.json({ success: false, error: 'Admin access is not enabled' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has products
    if (category.no_of_items > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category with existing products' },
        { status: 400 }
      );
    }

    await Category.findByIdAndDelete(categoryId);

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
} 