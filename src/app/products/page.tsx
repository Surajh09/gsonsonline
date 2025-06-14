'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { Search, Filter, ChevronLeft, ChevronRight, Grid3X3, List, ExternalLink, ShoppingCart, X } from 'lucide-react';
import Link from 'next/link';

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
  };
}

interface Category {
  _id: string;
  name: string;
  description: string;
  no_of_items: number;
}

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 100000 });
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  
  const searchParams = useSearchParams();

  // Available platforms for filtering
  const availablePlatforms = ['Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Nykaa', 'Meesho'];
  
  // Price range constants
  const MIN_PRICE = 0;
  const MAX_PRICE = 100000;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const search = searchParams?.get('search') || '';
      const category = searchParams?.get('category') || '';
      setSearchQuery(search);
      setSelectedCategory(category);
    }
  }, [searchParams, mounted]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [searchQuery, selectedCategory, currentPage, priceRange, selectedPlatforms]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12'
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      
      if (data.success) {
        let filteredProducts = data.data;
        
        // Client-side filtering for price range
        if (priceRange.min || priceRange.max) {
          filteredProducts = filteredProducts.filter((product: Product) => {
            const price = product.price;
            const min = priceRange.min ? parseFloat(priceRange.min.toString()) : 0;
            const max = priceRange.max ? parseFloat(priceRange.max.toString()) : Infinity;
            return price >= min && price <= max;
          });
        }
        
        // Client-side filtering for platforms
        if (selectedPlatforms.length > 0) {
          filteredProducts = filteredProducts.filter((product: Product) => {
            return selectedPlatforms.some(platform => 
              product.available_on.includes(platform)
            );
          });
        }
        
        setProducts(filteredProducts);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    setShowMobileFilters(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setPriceRange({ min: 0, max: 100000 });
    setSelectedPlatforms([]);
    setCurrentPage(1);
  };

  const getImageSrc = (product: Product) => {
    if (product.image_data) {
      return `/api/images/${product._id}`;
    } else if (product.image_url) {
      return product.image_url;
    }
    return null;
  };

  // List view component
  const ProductListItem = ({ product }: { product: Product }) => {
    const imageSrc = getImageSrc(product);
    
    // Debug logging for list view
    console.log('List view - Product:', product.name);
    console.log('List view - Has image_data:', !!product.image_data);
    console.log('List view - Has image_url:', !!product.image_url);
    console.log('List view - Image src:', imageSrc);
    
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        <Link href={`/products/${product._id}`} className="block">
          <div className="flex flex-col sm:flex-row">
            {/* Product Image */}
            <div className="w-full sm:w-48 h-48 sm:h-32 bg-gray-100 flex-shrink-0">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onLoad={() => {
                    console.log('List view - Image loaded successfully:', imageSrc);
                  }}
                  onError={(e) => {
                    console.error('List view - Image failed to load:', imageSrc);
                    console.error('List view - Error details:', e);
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              
              <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 ${imageSrc ? 'hidden' : ''}`}>
                <ShoppingCart className="h-8 w-8 text-purple-400" />
              </div>
            </div>

            {/* Product Info */}
            <div className="flex-1 p-4 min-w-0">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                <div className="flex-1 min-w-0">
                  <span className="inline-block bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium mb-2">
                    {product.category.name}
                  </span>
                  <h3 className="font-semibold text-gray-900 mb-2 hover:text-purple-600 transition-colors truncate">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>
                </div>
                <div className="text-left sm:text-right sm:ml-4 flex-shrink-0">
                  <span className="text-xl sm:text-2xl font-bold text-purple-600">
                    ₹{product.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Available Platforms */}
              {product.available_on && product.available_on.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Available on:</p>
                  <div className="flex flex-wrap gap-1">
                    {product.available_on.slice(0, 4).map((platform, index) => (
                      <span
                        key={index}
                        className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs"
                      >
                        {platform}
                      </span>
                    ))}
                    {product.available_on.length > 4 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        +{product.available_on.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="px-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            {product.links && product.links.length > 0 ? (
              <>
                {product.links.slice(0, 2).map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center text-sm font-medium"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {link.platform}
                  </a>
                ))}
                {product.links.length > 2 && (
                  <Link
                    href={`/products/${product._id}`}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center text-sm font-medium"
                  >
                    +{product.links.length - 2} more
                  </Link>
                )}
              </>
            ) : (
              <Link
                href={`/products/${product._id}`}
                className="w-full bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center text-sm font-medium"
              >
                View Details
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Filter Sidebar Component
  const FilterSidebar = ({ isMobile = false }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 ${isMobile ? 'h-full' : 'sticky top-8'}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {isMobile && (
          <button
            onClick={() => setShowMobileFilters(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
        <form onSubmit={handleSearch}>
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </form>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Categories</label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <button
            onClick={() => handleCategoryChange('')}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedCategory === '' 
                ? 'bg-purple-100 text-purple-700 font-medium' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => handleCategoryChange(category._id)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === category._id 
                  ? 'bg-purple-100 text-purple-700 font-medium' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {category.name} ({category.no_of_items})
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Price Range</label>
        <div className="px-2">
          {/* Price Display */}
          <div className="flex justify-between text-sm text-gray-600 mb-4">
            <span>₹{priceRange.min.toLocaleString()}</span>
            <span>₹{priceRange.max.toLocaleString()}</span>
          </div>
          
          {/* Dual Range Slider */}
          <div className="relative">
            {/* Track */}
            <div className="h-2 bg-gray-200 rounded-lg relative">
              {/* Active Range */}
              <div 
                className="absolute h-2 bg-purple-500 rounded-lg"
                style={{
                  left: `${(priceRange.min / MAX_PRICE) * 100}%`,
                  width: `${((priceRange.max - priceRange.min) / MAX_PRICE) * 100}%`
                }}
              />
            </div>
            
            {/* Min Range Input */}
            <input
              type="range"
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={1000}
              value={priceRange.min}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value <= priceRange.max) {
                  setPriceRange(prev => ({ ...prev, min: value }));
                }
              }}
              className="absolute top-0 w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
              style={{ zIndex: 1 }}
            />
            
            {/* Max Range Input */}
            <input
              type="range"
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={1000}
              value={priceRange.max}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= priceRange.min) {
                  setPriceRange(prev => ({ ...prev, max: value }));
                }
              }}
              className="absolute top-0 w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
              style={{ zIndex: 2 }}
            />
          </div>
          
          {/* Manual Input Fields */}
          <div className="flex gap-2 mt-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Min Price</label>
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  if (value <= priceRange.max && value >= MIN_PRICE) {
                    setPriceRange(prev => ({ ...prev, min: value }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Max Price</label>
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || MAX_PRICE;
                  if (value >= priceRange.min && value <= MAX_PRICE) {
                    setPriceRange(prev => ({ ...prev, max: value }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Platforms */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Available On</label>
        <div className="space-y-2">
          {availablePlatforms.map((platform) => (
            <label key={platform} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(platform)}
                onChange={() => handlePlatformToggle(platform)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{platform}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={clearAllFilters}
        className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
      >
        Clear All Filters
      </button>
    </div>
  );

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50"></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Range Slider Styles */}
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        
        .slider-thumb::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        
        .slider-thumb::-webkit-slider-track {
          background: transparent;
        }
        
        .slider-thumb::-moz-range-track {
          background: transparent;
        }
        
        .slider-thumb {
          background: transparent;
        }
      `}</style>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <FilterSidebar />
          </div>

          {/* Products Section */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filter Toggle and View Toggle */}
            <div className="flex items-center justify-between mb-6">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </button>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1 ml-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Grid View"
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="List View"
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-gray-600">
                  {loading ? 'Loading...' : `${products.length} products found`}
                </p>
              </div>
            </div>

            {/* Products Display */}
            {loading ? (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                : "space-y-4"
              }>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={viewMode === 'grid' 
                    ? "bg-white rounded-lg shadow-md p-4 animate-pulse"
                    : "bg-white rounded-lg shadow-md p-4 animate-pulse h-32"
                  }>
                    <div className={viewMode === 'grid' 
                      ? "bg-gray-300 h-48 rounded-lg mb-4"
                      : "flex"
                    }>
                      {viewMode === 'list' && (
                        <>
                          <div className="bg-gray-300 w-48 h-24 rounded-lg mr-4 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <div className="bg-gray-300 h-4 rounded mb-2"></div>
                            <div className="bg-gray-300 h-3 rounded mb-4"></div>
                            <div className="bg-gray-300 h-6 rounded"></div>
                          </div>
                        </>
                      )}
                      {viewMode === 'grid' && (
                        <>
                          <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                          <div className="bg-gray-300 h-4 rounded mb-2"></div>
                          <div className="bg-gray-300 h-3 rounded mb-4"></div>
                          <div className="bg-gray-300 h-6 rounded"></div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <ProductListItem key={product._id} product={product} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-lg ${
                            currentPage === page
                              ? 'bg-purple-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <button
                  onClick={clearAllFilters}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-[9999] bg-black bg-opacity-50">
          <div className="absolute right-0 top-0 h-full w-80 bg-white overflow-y-auto shadow-2xl">
            <FilterSidebar isMobile={true} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
} 