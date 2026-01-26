import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import {
  createProduct,
  clearError,
  clearSuccess,
} from '@/redux/features/products/productSlice';
import supplierService from '@/services/supplierService';
import categoryService from '@/services/categoryService';

const ProductCreationModal = ({ isOpen, onClose, onProductCreated, supplierId }) => {
  const dispatch = useDispatch();

  // Redux state
  const loading = useSelector((state) => state.products?.loading || false);
  const error = useSelector((state) => state.products?.error || null);
  const success = useSelector((state) => state.products?.success || false);
  const user = useSelector((state) => state.login?.user || null);
  const token = useSelector((state) => state.login?.token || null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    supplier: supplierId || '',
    batchNumber: '',
    manufacturingDate: '',
    reorderLevel: 10,
    hsnNumber: '',
    quantity: 0,
    unit: 'none',
    unitType: 'single'
  });

  // Fetch suppliers and categories
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const fileInputRef = useRef(null);

  // File upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    // Reset form when modal opens and set default supplier if provided
    if (isOpen) {
      const defaultFormData = {
        name: '',
        description: '',
        price: '',
        category: '',
        supplier: supplierId || '',
        batchNumber: '',
        manufacturingDate: '',
        reorderLevel: 10,
        hsnNumber: '',
        quantity: 0,
        unit: 'none',
        unitType: 'single'
      };

      setFormData(defaultFormData);
      setFormErrors({});
      setUploadProgress(0);
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [isOpen, supplierId]);

  useEffect(() => {
    if (success) {
      // Close modal and notify parent
      onClose();
      dispatch(clearSuccess());
    }
  }, [success, onClose, dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!isOpen || !token) return;
      
      try {
        setLoadingSuppliers(true);
        const data = await supplierService.getAllSuppliers();
        setSuppliers(data.suppliers || []);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, [isOpen, token]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!isOpen || !token) return;
      
      try {
        setLoadingCategories(true);
        const categoriesData = await categoryService.getAllCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [isOpen, token]);

  // Image compression function
  const compressImage = (file, maxSizeMB = 1, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;
        const maxWidth = 1200;
        const maxHeight = 1200;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }));
          },
          'image/jpeg',
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Enhanced file upload handler
  const handleFileUpload = async (file) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      let fileToUpload = file;

      if (file.size > 1024 * 1024) {
        console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        fileToUpload = await compressImage(file);
        console.log(`Compressed file size: ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`);
      }

      const formDataUpload = new FormData();
      formDataUpload.append('image', fileToUpload);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/upload/image`,
        formDataUpload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            setUploadProgress(progress);
          },
        }
      );
      setUploading(false);
      return response.data.imageUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      setUploading(false);
      const message = error.response?.data?.message || "Failed to upload image";
      throw new Error(message);
    }
  };

  const validateForm = () => {
    const errors = {};

    // Required fields validation
    if (!formData.name?.trim()) errors.name = "Product name is required";
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0)
      errors.price = "Valid price is required";
    if (!formData.category?.trim()) errors.category = "Category is required";
    if (!formData.supplier) errors.supplier = "Supplier is required";
    if (!formData.batchNumber?.trim()) errors.batchNumber = "Batch number is required";
    if (!formData.manufacturingDate) errors.manufacturingDate = "Manufacturing date is required";
    if (!formData.hsnNumber?.trim()) errors.hsnNumber = "HSN number is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Get current date in YYYYMMDD format
      const now = new Date();
      const dateStr = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0')
      ].join('');

      // Get first 3 letters of product name and supplier name
      const productPrefix = formData.name.trim().substring(0, 3).toUpperCase().padEnd(3, 'X');
      const selectedSupplier = suppliers.find(s => s._id === formData.supplier);
      const supplierPrefix = selectedSupplier?.name.substring(0, 3).toUpperCase().padEnd(3, 'X') || 'XXX';

      // Get the manually entered batch number
      const batchNumber = formData.batchNumber.trim().toUpperCase();

      // Generate the product ID
      const productId = `${dateStr}-${productPrefix}-${supplierPrefix}-${batchNumber}`;

      // Prepare product data
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        category: formData.category.trim(),
        quantity: Number(formData.quantity),
        supplier: formData.supplier,
        batchNumber: batchNumber,
        manufacturingDate: formData.manufacturingDate ? new Date(formData.manufacturingDate).toISOString() : new Date().toISOString(),
        reorderLevel: Number(formData.reorderLevel || 10),
        unit: formData.unit || 'piece',
        hsnNumber: formData.hsnNumber.trim(),
        unitType: formData.unitType || 'single',
        ...(formData.image && { image: formData.image }),
        ...(productId && { productId }),
      };

      console.log('Creating product:', productData);

      const response = await dispatch(createProduct(productData)).unwrap();
      console.log('Product created successfully:', response);

      // Notify parent component about the new product
      if (onProductCreated) {
        onProductCreated(response);
      }

    } catch (error) {
      console.error('Failed to create product:', error);
      setFormErrors(prev => ({
        ...prev,
        submit: error.message || 'Failed to create product'
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {supplierId ? 'Add Product for Inward' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter product name"
              />
              {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product description"
              />
            </div>

            {/* Price, Category, and Supplier */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {formErrors.price && <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select category</option>
                  {loadingCategories ? (
                    <option>Loading categories...</option>
                  ) : (
                    categories.map((category) => (
                      <option key={category.id || category._id} value={category.id || category._id}>
                        {category.name}
                      </option>
                    ))
                  )}
                </select>
                {formErrors.category && <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier *</label>
                <select
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.supplier ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={supplierId && loadingSuppliers}
                >
                  <option value="">Select supplier</option>
                  {loadingSuppliers ? (
                    <option>Loading suppliers...</option>
                  ) : suppliers.length > 0 ? (
                    suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No suppliers available</option>
                  )}
                </select>
                {supplierId && (
                  <p className="text-sm text-gray-500 mt-1">
                    Pre-selected from inward form
                  </p>
                )}
                {formErrors.supplier && <p className="text-red-500 text-sm mt-1">{formErrors.supplier}</p>}
              </div>
            </div>

            {/* Batch Number and Manufacturing Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Batch Number *
                </label>
                <input
                  type="text"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.batchNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter batch number"
                />
                {formErrors.batchNumber && <p className="text-red-500 text-sm mt-1">{formErrors.batchNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Manufacturing Date *
                </label>
                <input
                  type="date"
                  value={formData.manufacturingDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.manufacturingDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.manufacturingDate && <p className="text-red-500 text-sm mt-1">{formErrors.manufacturingDate}</p>}
              </div>
            </div>

            {/* HSN Number and Reorder Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  HSN Number *
                </label>
                <input
                  type="text"
                  value={formData.hsnNumber}
                  onChange={(e) => setFormData({ ...formData, hsnNumber: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.hsnNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g. 85183000"
                />
                {formErrors.hsnNumber && <p className="text-red-500 text-sm mt-1">{formErrors.hsnNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reorder Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="10"
                />
              </div>
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unit
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">Pieces (PCS)</option>
                  <option value="liter">Liters (L)</option>
                  <option value="kilogram">Kilograms (KG)</option>
                </select>
              </div>
            </div>

            {/* Error Display */}
            {formErrors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 font-medium">{formErrors.submit}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-2000 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:bg-blue-300"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Product'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductCreationModal;
