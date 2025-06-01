import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    console.log('Image API - Requested ID:', id);
    
    const product = await Product.findById(id);
    console.log('Image API - Product found:', !!product);
    console.log('Image API - Has image_data:', !!product?.image_data);
    console.log('Image API - Image data length:', product?.image_data?.length);
    console.log('Image API - Image mimetype:', product?.image_mimetype);
    
    if (!product || !product.image_data) {
      console.log('Image API - No product or image data found');
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }

    console.log('Image API - Serving image successfully');
    // Return the image with proper headers
    return new NextResponse(product.image_data, {
      status: 200,
      headers: {
        'Content-Type': product.image_mimetype || 'image/jpeg',
        'Content-Length': product.image_data.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Disposition': `inline; filename="${product.image_filename || 'image'}"`,
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to serve image' },
      { status: 500 }
    );
  }
} 