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

    // Better error handling for JSON parsing
    let body;
    try {
      const text = await request.text();
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Request body is empty. Please provide categories and products data.' },
          { status: 400 }
        );
      }
      body = JSON.parse(text);
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json(
        { success: false, message: 'Invalid JSON format' },
        { status: 400 }
      );
    }

    const { categories, products, clearExisting = false } = body;

    // Validate input
    if (!categories || !products || !Array.isArray(categories) || !Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format. Expected categories and products arrays.' },
        { status: 400 }
      );
    }

    // Clear existing data if requested
    if (clearExisting) {
      await Product.deleteMany({});
      await Category.deleteMany({});
    }

    // Insert categories first
    const categoryResults = [];
    const categoryMap = new Map(); // To map category names to IDs

    for (const categoryData of categories) {
      try {
        // Check if category already exists
        const existingCategory = await Category.findOne({ name: categoryData.name });

        if (!existingCategory) {
          const category = new Category({
            name: categoryData.name,
            description: categoryData.description || `Explore our ${categoryData.name} collection`,
            no_of_items: 0 // Will be updated after products are inserted
          });

          const savedCategory = await category.save();
          categoryResults.push(savedCategory);
          categoryMap.set(categoryData.name, savedCategory._id);
        } else {
          categoryResults.push(existingCategory);
          categoryMap.set(categoryData.name, existingCategory._id);
        }
      } catch (error) {
        console.error(`Error creating category ${categoryData.name}:`, error);
      }
    }

    // Insert products
    const productResults = [];

    for (const productData of products) {
      try {
        // Get category ID from map
        const categoryId = categoryMap.get(productData.category);

        if (!categoryId) {
          console.error(`Category not found for product: ${productData.name}`);
          continue;
        }

        // Check if product already exists
        const existingProduct = await Product.findOne({ name: productData.name });

        if (!existingProduct) {
          const product = new Product({
            name: productData.name,
            description: productData.description,
            price: Number(productData.price),
            category: categoryId,
            available_on: productData.available_on || [],
            links: productData.links || [],
            image_url: productData.image_url || null
          });

          const savedProduct = await product.save();
          productResults.push(savedProduct);
        }
      } catch (error) {
        console.error(`Error creating product ${productData.name}:`, error);
      }
    }

    // Update category item counts
    for (const [categoryName, categoryId] of categoryMap) {
      console.log(`Updating count for category: ${categoryName}`);
      const productCount = await Product.countDocuments({ category: categoryId });
      await Category.findByIdAndUpdate(categoryId, { no_of_items: productCount });
    }

    return NextResponse.json({
      success: true,
      message: 'Database populated successfully',
      data: {
        categoriesCreated: categoryResults.length,
        productsCreated: productResults.length,
        categories: categoryResults,
        products: productResults
      }
    });

  } catch (error) {
    console.error('Error populating database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to populate database' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Block access in production
  if (!isDevelopment()) {
    return NextResponse.json(
      { success: false, message: 'Admin endpoints are not available in production' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Populate API endpoint',
    usage: {
      method: 'POST',
      endpoint: '/api/admin/populate',
      description: 'Populate database with categories and products',
      body: {
        categories: [
          {
            name: 'string (required)',
            description: 'string (optional)'
          }
        ],
        products: [
          {
            name: 'string (required)',
            description: 'string (required)',
            price: 'number (required)',
            category: 'string (required) - category name',
            available_on: 'array of strings (optional)',
            links: 'array of objects (optional)',
            image_url: 'string (optional)'
          }
        ],
        clearExisting: 'boolean (optional, default: false)'
      }
    }
  });
} 