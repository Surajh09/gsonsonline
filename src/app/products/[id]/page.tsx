'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, ShoppingCart, Star, Share2, Heart } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  image_data?: any;
  available_on: string[];
  links: { platform: string; url: string }[];
  category: {
    _id: string;
    name: string;
    description?: string;
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setProduct(data.data);
      } else {
        setError(data.error || 'Product not found');
      }
    } catch (err) {
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const getImageSrc = () => {
    if (!product) return null;
    if (product.image_data) {
      return `/api/images/${product._id}`;
    } else if (product.image_url) {
      return product.image_url;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/products"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const imageSrc = getImageSrc();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-purple-600">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-purple-600">Products</Link>
          <span>/</span>
          <Link href={`/categories/${product.category._id}`} className="hover:text-purple-600">
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-purple-600 hover:text-purple-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Image */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                
                {/* Fallback Image */}
                <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 ${imageSrc ? 'hidden' : ''}`}>
                  <ShoppingCart className="h-24 w-24 text-purple-400" />
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Category Badge */}
              <Link
                href={`/categories/${product.category._id}`}
                className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
              >
                {product.category.name}
              </Link>

              {/* Product Name */}
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

              {/* Price */}
              <div className="text-4xl font-bold text-purple-600">
                ₹{product.price.toLocaleString()}
              </div>

              {/* Description */}
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>

              {/* Available Platforms */}
              {product.available_on && product.available_on.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Available on:</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.available_on.map((platform, index) => (
                      <span
                        key={index}
                        className="bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Purchase Options */}
              {product.links && product.links.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Options:</h3>
                  <div className="space-y-3">
                    {product.links.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center font-medium"
                      >
                        <ExternalLink className="h-5 w-5 mr-2" />
                        Buy on {link.platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
                  <Heart className="h-5 w-5" />
                  <span>Add to Wishlist</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
                  <Share2 className="h-5 w-5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">More from {product.category.name}</h2>
          <div className="text-center py-8 text-gray-500">
            <p>Related products will be shown here</p>
            <Link
              href={`/categories/${product.category._id}`}
              className="inline-block mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              View All {product.category.name} Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 