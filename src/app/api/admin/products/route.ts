import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { isAdminEnabled } from '@/lib/admin';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

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
    let images: Array<{ data: Buffer; mimetype: string; filename: string }> = [];

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

      // Handle multiple image files
      const imageFiles = formData.getAll('images') as File[];
      
      for (const imageFile of imageFiles) {
        if (imageFile && imageFile.size > 0) {
          // Validate file type
          if (!ALLOWED_MIME_TYPES.includes(imageFile.type)) {
            return NextResponse.json(
              { success: false, error: `Invalid type for ${imageFile.name}. Only JPEG, PNG, and WebP are allowed.` },
              { status: 400 }
            );
          }

          // Validate file size (max 5MB)
          const maxSize = 5 * 1024 * 1024; // 5MB
          if (imageFile.size > maxSize) {
            return NextResponse.json(
              { success: false, error: `${imageFile.name} is too large. Maximum size is 5MB.` },
              { status: 400 }
            );
          }

          // Convert file to buffer
          const arrayBuffer = await imageFile.arrayBuffer();
          images.push({
            data: Buffer.from(arrayBuffer),
            mimetype: imageFile.type,
            filename: imageFile.name
          });
        }
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

    // Add image data
    if (images.length > 0) {
      productData.images = images;
      // For backward compatibility, also set the first image as the main image
      productData.image_data = images[0].data;
      productData.image_mimetype = images[0].mimetype;
      productData.image_filename = images[0].filename;
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

export async function PUT(request: NextRequest) {
  try {
    // Check if admin access is enabled
    if (!isAdminEnabled()) {
      return NextResponse.json({ success: false, error: 'Admin access is not enabled' }, { status: 403 });
    }

    await connectDB();
    
    const contentType = request.headers.get('content-type') || '';
    let body: any;
    let images: Array<{ data: Buffer; mimetype: string; filename: string }> = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      body = {
        _id: formData.get('_id') as string,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: formData.get('price') as string,
        category: formData.get('category') as string,
        available_on: JSON.parse(formData.get('available_on') as string || '[]'),
        links: JSON.parse(formData.get('links') as string || '[]'),
        image_url: formData.get('image_url') as string,
      };

      // Handle multiple image files
      const imageFiles = formData.getAll('images') as File[];
      
      for (const imageFile of imageFiles) {
        if (imageFile && imageFile.size > 0) {
          // Validate file type
          if (!ALLOWED_MIME_TYPES.includes(imageFile.type)) {
            return NextResponse.json(
              { success: false, error: `Invalid type for ${imageFile.name}. Only JPEG, PNG, and WebP are allowed.` },
              { status: 400 }
            );
          }

          // Validate file size (max 5MB)
          const maxSize = 5 * 1024 * 1024; // 5MB
          if (imageFile.size > maxSize) {
            return NextResponse.json(
              { success: false, error: `${imageFile.name} is too large. Maximum size is 5MB.` },
              { status: 400 }
            );
          }

          // Convert file to buffer
          const arrayBuffer = await imageFile.arrayBuffer();
          images.push({
            data: Buffer.from(arrayBuffer),
            mimetype: imageFile.type,
            filename: imageFile.name
          });
        }
      }
    } else {
      body = await request.json();
    }

    const { _id, name, description, price, category, available_on, links, image_url } = body;

    // Validate input
    if (!_id || !name || !description || !price || !category) {
      return NextResponse.json(
        { success: false, error: 'ID, name, description, price, and category are required' },
        { status: 400 }
      );
    }

    // Find the product
    const existingProduct = await Product.findById(_id);
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Find category
    let categoryDoc;
    if (typeof category === 'string' && category.length === 24) {
      categoryDoc = await Category.findById(category);
    } else {
      categoryDoc = await Category.findOne({ name: category });
    }

    if (!categoryDoc) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Update product
    const updateData: any = {
      name,
      description,
      price: Number(price),
      category: categoryDoc._id,
      available_on: available_on || [],
      links: links || [],
    };

    // Update images
    if (images.length > 0) {
      updateData.images = images;
      // For backward compatibility, also set the first image as the main image
      updateData.image_data = images[0].data;
      updateData.image_mimetype = images[0].mimetype;
      updateData.image_filename = images[0].filename;
      updateData.image_url = undefined; // Clear image_url if using uploaded images
    } else if (image_url) {
      updateData.image_url = image_url;
      updateData.images = []; // Clear images if using image_url
      updateData.image_data = undefined;
      updateData.image_mimetype = undefined;
      updateData.image_filename = undefined;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      _id,
      updateData,
      { new: true }
    ).populate('category', 'name description');

    // Update category item counts if category changed
    if (existingProduct.category.toString() !== categoryDoc._id.toString()) {
      const oldCategoryCount = await Product.countDocuments({ category: existingProduct.category });
      const newCategoryCount = await Product.countDocuments({ category: categoryDoc._id });
      
      await Category.findByIdAndUpdate(existingProduct.category, { no_of_items: oldCategoryCount });
      await Category.findByIdAndUpdate(categoryDoc._id, { no_of_items: newCategoryCount });
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
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