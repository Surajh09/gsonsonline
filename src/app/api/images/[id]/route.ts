import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const index = parseInt(searchParams.get('index') || '0');

    console.log('Requested product ID:', id);
    console.log('Requested image index:', index);

    await connectDB();

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Try to get image from images array first
    if (product.images && product.images.length > index) {
      const image = product.images[index];
      if (image.data) {
        // Validate mime type
        if (!ALLOWED_MIME_TYPES.includes(image.mimetype)) {
          console.log('Invalid mime type:', image.mimetype);
          return NextResponse.json(
            { success: false, error: 'Invalid image type' },
            { status: 415 }
          );
        }

        return new NextResponse(image.data, {
          status: 200,
          headers: {
            'Content-Type': image.mimetype,
            'Content-Length': image.data.length.toString(),
            'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
            'Content-Disposition': `inline; filename="${image.filename}"`,
          },
        });
      }
    }

    // Fallback to legacy image_data if available
    if (product.image_data) {
      const mimetype = product.image_mimetype || 'image/jpeg';
      if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
        console.log('Invalid legacy mime type:', mimetype);
        return NextResponse.json(
          { success: false, error: 'Invalid image type' },
          { status: 415 }
        );
      }

      return new NextResponse(product.image_data, {
        status: 200,
        headers: {
          'Content-Type': mimetype,
          'Content-Length': product.image_data.length.toString(),
          'Cache-Control': 'public, max-age=31536000',
          'Content-Disposition': `inline; filename="${product.image_filename || 'image'}"`,
        },
      });
    }

    // Fallback to image_url if available
    if (product.image_url) {
      return NextResponse.redirect(product.image_url);
    }

    return NextResponse.json(
      { success: false, error: 'Image not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to serve image' },
      { status: 500 }
    );
  }
} 