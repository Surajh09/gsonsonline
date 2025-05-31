import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';

// Helper function to check if admin access is enabled
const isAdminEnabled = () => {
  return process.env.NEXT_PUBLIC_ADMIN_ENABLED === 'true';
};

export async function POST(request: Request) {
  try {
    // Check if admin access is enabled
    if (!isAdminEnabled()) {
      return NextResponse.json({ success: false, error: 'Admin access is not enabled' }, { status: 403 });
    }

    await connectDB();
    
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const category = formData.get('category') as string;
    const available_on = JSON.parse(formData.get('available_on') as string);
    const links = JSON.parse(formData.get('links') as string);
    const imageFile = formData.get('image') as File | null;

    // Validate required fields
    if (!name || !description || !price || !category) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    // Create product
    const product = new Product({
      name,
      description,
      price,
      category,
      available_on,
      links,
      image_url: imageFile ? `/api/images/${Date.now()}` : null
    });

    await product.save();

    // Update category count
    await Category.findByIdAndUpdate(category, { $inc: { no_of_items: 1 } });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Check if admin access is enabled
    if (!isAdminEnabled()) {
      return NextResponse.json({ success: false, error: 'Admin access is not enabled' }, { status: 403 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const category = formData.get('category') as string;
    const available_on = JSON.parse(formData.get('available_on') as string);
    const links = JSON.parse(formData.get('links') as string);
    const imageFile = formData.get('image') as File | null;

    // Validate required fields
    if (!name || !description || !price || !category) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    // Update product
    const product = await Product.findByIdAndUpdate(
      id,
      {
        name,
        description,
        price,
        category,
        available_on,
        links,
        image_url: imageFile ? `/api/images/${Date.now()}` : undefined
      },
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Check if admin access is enabled
    if (!isAdminEnabled()) {
      return NextResponse.json({ success: false, error: 'Admin access is not enabled' }, { status: 403 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Update category count
    await Category.findByIdAndUpdate(product.category, { $inc: { no_of_items: -1 } });

    // Delete product
    await Product.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete product' }, { status: 500 });
  }
} 