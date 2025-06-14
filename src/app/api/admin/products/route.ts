import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
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

export async function POST(request: NextRequest) {
  try {
    // Check if admin access is enabled
    if (!isAdminEnabled()) {
      return NextResponse.json({ success: false, error: 'Admin access is not enabled' }, { status: 403 });
    }

    await connectDB();
    
    const contentType = request.headers.get('content-type') || '';
    let body: any;
    let imageData: Buffer | null = null;
    let imageMimetype: string | null = null;
    let imageFilename: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      // Handle form data with file upload
      const formData = await request.formData();
      
      // Extract form fields
      body = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: formData.get('price') as string,
        category: formData.get('category') as string,
        available_on: JSON.parse(formData.get('available_on') as string || '[]'),
        links: JSON.parse(formData.get('links') as string || '[]'),
        image_url: formData.get('image_url') as string,
      };

      // Handle image file
      const imageFile = formData.get('image_file') as File;
      if (imageFile && imageFile.size > 0) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(imageFile.type)) {
          return NextResponse.json(
            { success: false, error: 'Invalid image type. Only JPEG, PNG, and WebP are allowed.' },
            { status: 400 }
          );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (imageFile.size > maxSize) {
          return NextResponse.json(
            { success: false, error: 'Image size too large. Maximum size is 5MB.' },
            { status: 400 }
          );
        }

        // Convert file to buffer
        const arrayBuffer = await imageFile.arrayBuffer();
        imageData = Buffer.from(arrayBuffer);
        imageMimetype = imageFile.type;
        imageFilename = imageFile.name;
      }
    } else {
      // Handle JSON data
      body = await request.json();
    }

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
    const productData: any = {
      name,
      description,
      price: Number(price),
      category: categoryDoc._id,
      available_on: available_on || [],
      links: links || [],
    };

    // Add image data if uploaded, otherwise use image_url
    if (imageData) {
      productData.image_data = imageData;
      productData.image_mimetype = imageMimetype;
      productData.image_filename = imageFilename;
    } else if (image_url) {
      productData.image_url = image_url;
    }

    const product = new Product(productData);
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

export async function DELETE(request: NextRequest) {
  try {
    // Check if admin access is enabled
    if (!isAdminEnabled()) {
      return NextResponse.json({ success: false, error: 'Admin access is not enabled' }, { status: 403 });
    }

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