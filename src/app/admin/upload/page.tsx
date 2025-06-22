'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Plus, X, AlertCircle, CheckCircle, Package, Tag, Shield, Image as ImageIcon, Trash2, Edit, ChevronDown, ChevronUp, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { Carousel } from 'react-responsive-carousel';

interface Category {
  _id: string;
  name: string;
  description: string;
  no_of_items: number;
}

interface ProductForm {
  _id?: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  category: string;
  available_on: string[];
  links: { platform: string; url: string }[];
  images: File[];
}

interface CategoryForm {
  name: string;
  description: string;
}

interface CategoryProducts {
  [key: string]: {
    _id: string;
    name: string;
    products: Array<{
      _id: string;
      name: string;
      description: string;
      price: number;
      image_url?: string;
      images?: Array<{
        data: Buffer;
        mimetype: string;
        filename: string;
      }>;
    }>;
  };
}

interface GroupedProducts {
  [category: string]: Array<{
    _id: string;
    name: string;
    price: number;
    category: {
      _id: string;
      name: string;
    };
  }>;
}

const ImageCarousel = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToNext = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      setTimeout(() => setIsTransitioning(false), 500);
    }
  };

  const goToPrevious = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
      setTimeout(() => setIsTransitioning(false), 500);
    }
  };

  return (
    <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
      <div
        className={`absolute inset-0 flex transition-transform duration-500 ease-in-out ${
          isTransitioning ? 'opacity-50' : ''
        }`}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className="min-w-full h-full flex-shrink-0"
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        ))}
      </div>
      
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow hover:bg-white transition-colors"
      >
        <ChevronLeft className="h-6 w-6 text-gray-800" />
      </button>
      
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow hover:bg-white transition-colors"
      >
        <ChevronRight className="h-6 w-6 text-gray-800" />
      </button>
      
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default function AdminUploadPage() {
  const [activeTab, setActiveTab] = useState<'product' | 'category'>('product');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const router = useRouter();

  // Image upload state
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [useImageUpload, setUseImageUpload] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Product form state
  const [productForm, setProductForm] = useState<ProductForm>({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: '',
    available_on: [],
    links: [],
    images: []
  });

  // Category form state
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({
    name: '',
    description: ''
  });

  // Platform options
  const platformOptions = ['Amazon', 'Flipkart', 'Meesho', 'Myntra', 'Ajio', 'Nykaa', 'BigBasket', 'Swiggy', 'Zomato', 'Other'];

  // Category products state
  const [categoryProducts, setCategoryProducts] = useState<CategoryProducts>({});
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Grouped products state
  const [groupedProducts, setGroupedProducts] = useState<GroupedProducts>({});

  // Fetch products for editing
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
        organizeProductsByCategory(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ADMIN_ENABLED !== 'true') {
      router.push('/');
      return;
    }
    
    setIsAuthorized(true);
    fetchCategories();
    fetchProducts();
    fetchProductsByCategory();
  }, [router]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProductsByCategory = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const categoriesData = await response.json();
      
      if (categoriesData.success) {
        const productsMap: CategoryProducts = {};
        
        for (const category of categoriesData.data) {
          const productsResponse = await fetch(`/api/products?category=${category._id}`);
          const productsData = await productsResponse.json();
          
          if (productsData.success) {
            productsMap[category._id] = {
              _id: category._id,
              name: category.name,
              products: productsData.data
            };
          }
        }
        
        setCategoryProducts(productsMap);
      }
    } catch (error) {
      console.error('Error fetching products by category:', error);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate each file
    const validFiles = files.filter(file => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!allowedTypes.includes(file.type)) {
        showMessage('error', `Invalid type for ${file.name}. Only JPEG, PNG, and WebP are allowed.`);
        return false;
      }
      
      if (file.size > maxSize) {
        showMessage('error', `${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      
      return true;
    });

    setSelectedImages(prev => [...prev, ...validFiles]);
    setProductForm(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles]
    }));
    
    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setProductForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateProductForm = (): string | null => {
    if (!productForm.name.trim()) return 'Product name is required';
    if (!productForm.description.trim()) return 'Product description is required';
    if (!productForm.price.trim()) return 'Product price is required';
    if (isNaN(Number(productForm.price)) || Number(productForm.price) <= 0) return 'Price must be a valid positive number';
    if (!productForm.category) return 'Category is required';
    
    // Validate image requirement
    if (useImageUpload && selectedImages.length === 0 && !productForm.image_url.trim()) {
      return 'Please upload images or provide an image URL';
    }
    
    // Validate links
    for (const link of productForm.links) {
      if (!link.platform.trim()) return 'All link platforms must be specified';
      if (!link.url.trim()) return 'All link URLs must be specified';
      try {
        new URL(link.url);
      } catch {
        return `Invalid URL format for ${link.platform}`;
      }
    }
    
    return null;
  };

  const validateCategoryForm = (): string | null => {
    if (!categoryForm.name.trim()) return 'Category name is required';
    if (!categoryForm.description.trim()) return 'Category description is required';
    return null;
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateProductForm();
    if (validationError) {
      showMessage('error', validationError);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('description', productForm.description);
      formData.append('price', productForm.price);
      formData.append('category', productForm.category);
      formData.append('available_on', JSON.stringify(productForm.available_on));
      formData.append('links', JSON.stringify(productForm.links));
      
      if (productForm.image_url) {
        formData.append('image_url', productForm.image_url);
      }
      
      // Append multiple images
      productForm.images.forEach((file, index) => {
        formData.append(`images`, file);
      });

      // Add product ID if in edit mode
      if (isEditMode && productForm._id) {
        formData.append('_id', productForm._id);
      }

      const response = await fetch('/api/admin/products', {
        method: isEditMode ? 'PUT' : 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', `Product ${isEditMode ? 'updated' : 'created'} successfully!`);
        setProductForm({
          name: '',
          description: '',
          price: '',
          image_url: '',
          category: '',
          available_on: [],
          links: [],
          images: []
        });
        setSelectedImages([]);
        setImagePreviews([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchProducts(); // Refresh products list
      } else {
        showMessage('error', data.message || `Failed to ${isEditMode ? 'update' : 'create'} product`);
      }
    } catch (error) {
      showMessage('error', 'Network error. Please try again.');
      console.error('Error handling product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: any) => {
    setIsEditMode(true);
    setProductForm({
      _id: product._id,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image_url: product.image_url || '',
      category: product.category._id,
      available_on: product.available_on,
      links: product.links,
      images: []
    });
    
    // Reset image states
    setSelectedImages([]);
    setImagePreviews([]);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Product deleted successfully!');
        fetchProducts();
        fetchProductsByCategory();
      } else {
        showMessage('error', data.message || 'Failed to delete product');
      }
    } catch (error) {
      showMessage('error', 'Network error. Please try again.');
      console.error('Error deleting product:', error);
    }
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setProductForm({
      name: '',
      description: '',
      price: '',
      image_url: '',
      category: '',
      available_on: [],
      links: [],
      images: []
    });
    setSelectedImages([]);
    setImagePreviews([]);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateCategoryForm();
    if (validationError) {
      showMessage('error', validationError);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryForm),
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Category created successfully!');
        setCategoryForm({
          name: '',
          description: ''
        });
        fetchCategories(); // Refresh categories list
      } else {
        showMessage('error', data.message || 'Failed to create category');
      }
    } catch (error) {
      showMessage('error', 'Network error. Please try again.');
      console.error('Error creating category:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPlatform = (platform: string) => {
    if (!productForm.available_on.includes(platform)) {
      setProductForm(prev => ({
        ...prev,
        available_on: [...prev.available_on, platform]
      }));
    }
  };

  const removePlatform = (platform: string) => {
    setProductForm(prev => ({
      ...prev,
      available_on: prev.available_on.filter(p => p !== platform)
    }));
  };

  const addLink = () => {
    setProductForm(prev => ({
      ...prev,
      links: [...prev.links, { platform: '', url: '' }]
    }));
  };

  const removeLink = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const updateLink = (index: number, field: 'platform' | 'url', value: string) => {
    setProductForm(prev => ({
      ...prev,
      links: prev.links.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const organizeProductsByCategory = (products: any[]) => {
    const grouped = products.reduce((acc: GroupedProducts, product) => {
      const categoryName = product.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(product);
      return acc;
    }, {});

    // Sort products within each category by name
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    setGroupedProducts(grouped);
  };

  // Show loading or unauthorized message while checking authorization
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600">This page is only available in development mode.</p>
        </div>
      </div>
    );
  }

  const renderCategorizedProducts = () => (
    <div className="mt-8 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Existing Products</h3>
      <div className="bg-white rounded-lg shadow divide-y">
        {Object.entries(groupedProducts).map(([category, products]) => (
          <div key={category} className="overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium text-gray-900">{category} ({products.length})</span>
              {expandedCategories.includes(category) ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            {expandedCategories.includes(category) && (
              <div className="divide-y">
                {products.map(product => (
                  <div
                    key={product._id}
                    className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-500">₹{product.price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Edit product"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this product?')) {
                            handleDeleteProduct(product._id);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('product')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'product'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('category')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'category'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Categories
          </button>
        </div>

        {activeTab === 'product' ? (
          <div className="space-y-8">
            {/* Product Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h2>
              
              {/* Image Preview Carousel */}
              {imagePreviews.length > 0 && (
                <div className="mb-6">
                  <ImageCarousel images={imagePreviews} />
                </div>
              )}

              <form onSubmit={handleProductSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                      placeholder="Enter price"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                {/* Description with Carousel Preview */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                    rows={4}
                    placeholder="Enter product description"
                  />
                  {/* Description Preview Carousel */}
                  {productForm.description && (
                    <div className="mt-4 border rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Description Preview</h3>
                      <Carousel
                        showArrows={true}
                        showThumbs={false}
                        infiniteLoop={true}
                        autoPlay={true}
                        interval={5000}
                        className="bg-gray-50 rounded-lg"
                      >
                        {productForm.description.split('\n\n').map((paragraph, index) => (
                          <div key={index} className="p-6">
                            <p className="text-gray-800">{paragraph}</p>
                          </div>
                        ))}
                      </Carousel>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image
                    </label>
                    
                    {/* Image Upload Toggle */}
                    <div className="flex items-center mb-3">
                      <button
                        type="button"
                        onClick={() => setUseImageUpload(true)}
                        className={`px-3 py-1 rounded-l-lg text-sm ${
                          useImageUpload
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Upload Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseImageUpload(false)}
                        className={`px-3 py-1 rounded-r-lg text-sm ${
                          !useImageUpload
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Image URL
                      </button>
                    </div>

                    {useImageUpload ? (
                      /* Image Upload Section */
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          {selectedImages.length > 0 && imagePreviews.length > 0 && (
                            <div className="w-20 h-20 border-2 border-gray-200 rounded-lg overflow-hidden">
                              <img
                                src={imagePreviews[0]}
                                alt="Selected"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              ref={fileInputRef}
                              onChange={handleImageSelect}
                              className="hidden"
                              multiple
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 flex items-center"
                            >
                              <ImageIcon className="h-4 w-4 mr-2" />
                              {selectedImages.length > 0 ? 'Change Images' : 'Select Images'}
                            </button>
                            {selectedImages.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedImages([]);
                                  setImagePreviews([]);
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                  }
                                }}
                                className="ml-2 text-red-500 hover:text-red-700 px-3 py-2 text-sm flex items-center"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove All
                              </button>
                            )}
                          </div>
                        </div>
                        {selectedImages.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <p><strong>Files:</strong> {selectedImages.map(file => file.name).join(', ')}</p>
                            <p><strong>Sizes:</strong> {selectedImages.map(file => (file.size / 1024 / 1024).toFixed(2) + ' MB').join(', ')}</p>
                            <p><strong>Types:</strong> {selectedImages.map(file => file.type).join(', ')}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-500">
                          Supported formats: JPEG, PNG, WebP. Maximum size: 5MB.
                        </p>
                      </div>
                    ) : (
                      /* Image URL Section */
                      <div>
                        <input
                          type="url"
                          value={productForm.image_url}
                          onChange={(e) => setProductForm(prev => ({ ...prev, image_url: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                          placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                        />
                        {productForm.image_url && (
                          <div className="mt-2">
                            <img
                              src={productForm.image_url}
                              alt="Preview"
                              className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Available Platforms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Platforms
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {platformOptions.map((platform) => (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => addPlatform(platform)}
                        disabled={productForm.available_on.includes(platform)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          productForm.available_on.includes(platform)
                            ? 'bg-purple-100 text-purple-700 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {productForm.available_on.map((platform) => (
                      <span
                        key={platform}
                        className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {platform}
                        <button
                          type="button"
                          onClick={() => removePlatform(platform)}
                          className="ml-2 text-purple-500 hover:text-purple-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Purchase Links */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Purchase Links
                    </label>
                    <button
                      type="button"
                      onClick={addLink}
                      className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-700 flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Link
                    </button>
                  </div>
                  <div className="space-y-3">
                    {productForm.links.map((link, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <select
                          value={link.platform}
                          onChange={(e) => updateLink(index, 'platform', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Select platform</option>
                          {platformOptions.map((platform) => (
                            <option key={platform} value={platform}>
                              {platform}
                            </option>
                          ))}
                        </select>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateLink(index, 'url', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                          placeholder="Enter purchase URL"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeLink(index)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isEditMode ? 'Updating Product...' : 'Creating Product...'}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {isEditMode ? 'Update Product' : 'Create Product'}
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Products by Category */}
            <div className="bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 p-6 border-b">
                Products by Category
              </h2>
              
              <div className="divide-y">
                {Object.values(categoryProducts).map((category) => (
                  <div key={category._id} className="p-4">
                    <button
                      onClick={() => toggleCategory(category._id)}
                      className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span className="font-medium text-gray-900">{category.name}</span>
                      {expandedCategories.includes(category._id) ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                    
                    {expandedCategories.includes(category._id) && (
                      <div className="mt-2 space-y-2">
                        {category.products.map((product) => (
                          <div
                            key={product._id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              {/* Product Image */}
                              <div className="h-10 w-10 bg-gray-200 rounded-lg overflow-hidden">
                                {product.images?.[0]?.data || product.image_url ? (
                                  <img
                                    src={product.image_url || `/api/images/${product._id}?index=0`}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-gray-200">
                                    <ImageIcon className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Product Info */}
                              <div>
                                <h3 className="font-medium text-gray-900">{product.name}</h3>
                                <p className="text-sm text-gray-500">₹{product.price.toLocaleString()}</p>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this product?')) {
                                    handleDeleteProduct(product._id);
                                  }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Category Form */
          <form onSubmit={handleCategorySubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                placeholder="Enter category name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                placeholder="Enter category description"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Category...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Create Category
                </>
              )}
            </button>
          </form>
        )}

        {/* Existing Categories Display */}
        {categories.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div key={category._id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">{category.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  <p className="text-xs text-purple-600 mt-2">
                    {category.no_of_items} {category.no_of_items === 1 ? 'product' : 'products'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Multiple Image Upload Section */}
        <div className="space-y-3">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            ref={fileInputRef}
            onChange={handleImageSelect}
            className="hidden"
            multiple
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 flex items-center"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Add Images
          </button>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add the categorized products list */}
        {renderCategorizedProducts()}
      </div>
    </div>
  );
} 