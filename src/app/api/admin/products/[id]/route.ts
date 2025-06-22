import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { isAdminEnabled } from '@/lib/admin';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const params = await context.params;
    const product = await Product.findById(params.id).populate('category', 'name description');
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check if admin access is enabled
    if (!isAdminEnabled()) {
      return NextResponse.json({ success: false, error: 'Admin access is not enabled' }, { status: 403 });
    }

    await connectDB();
    const params = await context.params;

    // Find the product
    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Store category ID before deletion
    const categoryId = product.category;

    // Delete the product
    await Product.findByIdAndDelete(params.id);

    // Update category item count
    const productCount = await Product.countDocuments({ category: categoryId });
    await Category.findByIdAndUpdate(categoryId, { no_of_items: productCount });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
} 