'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Plus, X, AlertCircle, CheckCircle, Package, Tag, Shield, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Category {
  _id: string;
  name: string;
  description: string;
  no_of_items: number;
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  image_url: string;
  category: string;
  available_on: string[];
  links: { platform: string; url: string }[];
}

interface CategoryForm {
  name: string;
  description: string;
}

export default function AdminUploadPage() {
  const [activeTab, setActiveTab] = useState<'product' | 'category'>('product');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [useImageUpload, setUseImageUpload] = useState(true); // Toggle between upload and URL
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Product form state
  const [productForm, setProductForm] = useState<ProductForm>({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: '',
    available_on: [],
    links: []
  });

  // Category form state
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({
    name: '',
    description: ''
  });

  // Platform options
  const platformOptions = ['Amazon', 'Flipkart', 'Meesho', 'Myntra', 'Ajio', 'Nykaa', 'BigBasket', 'Swiggy', 'Zomato', 'Other'];

  useEffect(() => {
    // Check if running on localhost/development
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' ||
       window.location.hostname === '' ||
       process.env.NODE_ENV === 'development');
    
    if (!isLocalhost) {
      // Redirect to home page if not on localhost
      router.push('/');
      return;
    }
    
    setIsAuthorized(true);
    fetchCategories();
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

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Image handling functions
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showMessage('error', 'Invalid image type. Only JPEG, PNG, and WebP are allowed.');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        showMessage('error', 'Image size too large. Maximum size is 5MB.');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateProductForm = (): string | null => {
    if (!productForm.name.trim()) return 'Product name is required';
    if (!productForm.description.trim()) return 'Product description is required';
    if (!productForm.price.trim()) return 'Product price is required';
    if (isNaN(Number(productForm.price)) || Number(productForm.price) <= 0) return 'Price must be a valid positive number';
    if (!productForm.category) return 'Category is required';
    
    // Validate image requirement
    if (useImageUpload && !selectedImage && !productForm.image_url.trim()) {
      return 'Please upload an image or provide an image URL';
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
      let response;
      
      if (useImageUpload && selectedImage) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append('name', productForm.name);
        formData.append('description', productForm.description);
        formData.append('price', productForm.price);
        formData.append('category', productForm.category);
        formData.append('available_on', JSON.stringify(productForm.available_on));
        formData.append('links', JSON.stringify(productForm.links));
        formData.append('image_file', selectedImage);
        
        response = await fetch('/api/admin/products', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Use JSON for URL-based images
        response = await fetch('/api/admin/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...productForm,
            price: Number(productForm.price)
          }),
        });
      }

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Product created successfully!');
        setProductForm({
          name: '',
          description: '',
          price: '',
          image_url: '',
          category: '',
          available_on: [],
          links: []
        });
        removeImage(); // Clear image
        fetchCategories(); // Refresh categories to update item counts
      } else {
        showMessage('error', data.message || 'Failed to create product');
      }
    } catch (error) {
      showMessage('error', 'Network error. Please try again.');
      console.error('Error creating product:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Upload Panel</h1>
          <p className="text-lg text-gray-600">Add new products and categories to your catalogue</p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('product')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'product'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Package className="h-5 w-5 inline mr-2" />
                Add Product
              </button>
              <button
                onClick={() => setActiveTab('category')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'category'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Tag className="h-5 w-5 inline mr-2" />
                Add Category
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'product' ? (
              /* Product Form */
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                    placeholder="Enter product description"
                    required
                  />
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
                          {selectedImage && imagePreview && (
                            <div className="w-20 h-20 border-2 border-gray-200 rounded-lg overflow-hidden">
                              <img
                                src={imagePreview}
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
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 flex items-center"
                            >
                              <ImageIcon className="h-4 w-4 mr-2" />
                              {selectedImage ? 'Change Image' : 'Select Image'}
                            </button>
                            {selectedImage && (
                              <button
                                type="button"
                                onClick={removeImage}
                                className="ml-2 text-red-500 hover:text-red-700 px-3 py-2 text-sm flex items-center"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                        {selectedImage && (
                          <div className="text-sm text-gray-600">
                            <p><strong>File:</strong> {selectedImage.name}</p>
                            <p><strong>Size:</strong> {(selectedImage.size / 1024 / 1024).toFixed(2)} MB</p>
                            <p><strong>Type:</strong> {selectedImage.type}</p>
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
                      Creating Product...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Create Product
                    </>
                  )}
                </button>
              </form>
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
          </div>
        </div>

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
      </div>
    </div>
  );
} 