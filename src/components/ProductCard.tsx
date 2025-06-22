import Link from 'next/link';
import { ExternalLink, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  image_data?: Buffer;
  image_mimetype?: string;
  image_filename?: string;
  images?: Array<{
    data: Buffer;
    mimetype: string;
    filename: string;
  }>;
  available_on: string[];
  links: { platform: string; url: string }[];
  category: {
    _id: string;
    name: string;
  };
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  // Determine image source - prioritize uploaded image over URL
  const getImageSrc = () => {
    if (!imageError) {
      if (product.images && product.images.length > 0) {
        return `/api/images/${product._id}?index=0`;
      } else if (product.image_data) {
        return `/api/images/${product._id}`;
      } else if (product.image_url) {
        return product.image_url;
      }
    }
    return null;
  };

  const imageSrc = getImageSrc();

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
      <Link href={`/products/${product._id}`} className="block">
        {/* Product Image */}
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {imageSrc && !imageError ? (
            <div className="relative w-full h-full">
              <img
                src={imageSrc}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => {
                  console.log('Image failed to load:', imageSrc);
                  setImageError(true);
                }}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
              <ShoppingCart className="h-16 w-16 text-purple-400" />
            </div>
          )}
          
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span
              onClick={(e) => e.stopPropagation()}
              className="bg-white/90 backdrop-blur-sm text-purple-700 px-2 py-1 rounded-full text-xs font-medium"
            >
              {product.category.name}
            </span>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 
            className="font-semibold text-gray-900 mb-2 overflow-hidden group-hover:text-purple-600 transition-colors"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {product.name}
          </h3>
          
          <p 
            className="text-gray-600 text-sm mb-3 overflow-hidden"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {product.description}
          </p>

          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-purple-600">
              ₹{product.price.toLocaleString()}
            </span>
          </div>

          {/* Available Platforms */}
          {product.available_on && product.available_on.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Available on:</p>
              <div className="flex flex-wrap gap-1">
                {product.available_on.slice(0, 3).map((platform, index) => (
                  <span
                    key={index}
                    className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs"
                  >
                    {platform}
                  </span>
                ))}
                {product.available_on.length > 3 && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                    +{product.available_on.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Action Buttons - Outside the Link to prevent nested links */}
      <div className="p-4 pt-0">
        {product.links && product.links.length > 0 && (
          <div className="space-y-1">
            {product.links.slice(0, 2).map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center text-sm font-medium"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Buy on {link.platform}
              </a>
            ))}
            {product.links.length > 2 && (
              <Link
                href={`/products/${product._id}`}
                className="w-full bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center text-sm font-medium"
              >
                View All Options ({product.links.length})
              </Link>
            )}
          </div>
        )}
        
        {(!product.links || product.links.length === 0) && (
          <Link
            href={`/products/${product._id}`}
            className="w-full bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center text-sm font-medium"
          >
            View Details
          </Link>
        )}
      </div>
    </div>
  );
} 