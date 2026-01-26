import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from 'axios';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  clearError,
  clearSuccess,
} from '@/redux/features/products/productSlice';
import supplierService from '@/services/supplierService';
import categoryService from '@/services/categoryService';

const ProductManagement = () => {
  const dispatch = useDispatch();

  // Redux state
  const products = useSelector((state) => state.products?.items || []);
  const pagination = useSelector((state) => state.products?.pagination || {});
  const loading = useSelector((state) => state.products?.loading || false);
  const error = useSelector((state) => state.products?.error || null);
  const success = useSelector((state) => state.products?.success || false);
  const user = useSelector((state) => state.login?.user || null);
  const token = useSelector((state) => state.login?.token || null);

  // Ensure products is always an array
  const safeProducts = Array.isArray(products) ? products : [];
  
  // Add additional debugging
  console.log('Products state:', products);
  console.log('Safe products:', safeProducts);
  console.log('Is products array:', Array.isArray(products));

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formStep, setFormStep] = useState('basic'); // 'basic' or 'advanced'
  const [formData, setFormData] = useState({
    // Basic Info (shown first)
    name: "",
    category: "",
    supplier: "",
    batchNumber: "",
    
    // Inventory Details
    quantity: "",
    price: "",
    unitType: "single",
    
    // Advanced (shown after basic)
    description: "",
    image: "",
    hsnNumber: "",
    manufacturingDate: "",
    reorderLevel: 10,
    quantityPerUnit: "",
    unitsInStock: ""
  });
  
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  
  // Fetch suppliers for the dropdown
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  
  // Fetch categories for the dropdown
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
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

    if (token) {
      fetchCategories();
    }
  }, [token]);

  useEffect(() => {
    const fetchSuppliers = async () => {
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

    if (token) {
      fetchSuppliers();
    }
  }, [token]);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [formErrors, setFormErrors] = useState({});
  const [, forceUpdate] = useState({}); // For forcing re-renders

  // Display mode state (list or grid)
  const [displayMode, setDisplayMode] = useState("list"); // "list" or "grid"

  // File upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Dashboard stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    outOfStock: 0,
    lowStock: 0,
    totalValue: 0,
  });

  // Calculate dashboard stats when products change
  useEffect(() => {
    if (safeProducts.length > 0) {
      const totalProducts = safeProducts.length;
      const outOfStock = safeProducts.filter(p => p.quantity === 0).length;
      const lowStock = safeProducts.filter(p => p.quantity > 0 && p.quantity <= 10).length;
      const totalValue = safeProducts.reduce((sum, product) => sum + (product.price * (product.quantity || 0)), 0);
      
      setStats({
        totalProducts,
        outOfStock,
        lowStock,
        totalValue
      });
    }
  }, [safeProducts]);

  // --- UTILITY FUNCTIONS ---

  // Image compression function
  const compressImage = (file, maxSizeMB = 1, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
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

        // Draw and compress
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

  // --- HOOKS ---

  // 1. Fetch all products once when authenticated (without pagination parameters)
  useEffect(() => {
    if (token) {
      // Fetch all products without pagination parameters for client-side pagination
      dispatch(fetchProducts());
    }
  }, [dispatch, token]);

  // 2. Handle successful operations by closing modal and resetting form
  useEffect(() => {
    if (success) {
      setShowModal(false);
      resetForm();
      dispatch(clearSuccess());
    }
  }, [success, dispatch]);

  // 3. Auto-clear global errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // 4. Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, sortBy, sortOrder]);

  // --- DATA PROCESSING ---

  // Enhanced filtering and sorting logic
  const filteredProducts = useMemo(() => {
    return safeProducts
      .filter((product) => {
        if (!product) return false;
        
        const matchesSearch =
          product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.productId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
          !categoryFilter || (product.category && product.category._id ? product.category._id === categoryFilter : product.category === categoryFilter);
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (!a || !b) return 0;
        
        let aVal, bVal;
        
        switch (sortBy) {
          case "price":
            aVal = a.price || 0;
            bVal = b.price || 0;
            break;
          case "quantity":
            aVal = a.quantity || 0;
            bVal = b.quantity || 0;
            break;
          case "category":
            aVal = (a.category && a.category.name) ? a.category.name.toLowerCase() : (typeof a.category === 'string' ? a.category.toLowerCase() : "");
            bVal = (b.category && b.category.name) ? b.category.name.toLowerCase() : (typeof b.category === 'string' ? b.category.toLowerCase() : "");
            break;
          default:
            aVal = a[sortBy]?.toString().toLowerCase() || "";
            bVal = b[sortBy]?.toString().toLowerCase() || "";
        }
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        }
        
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
  }, [safeProducts, searchTerm, categoryFilter, sortBy, sortOrder]);

  // Pagination logic - Fixed implementation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  // Pagination helper functions
  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getPaginationRange = () => {
    const maxPageNumbersToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageNumbersToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPageNumbersToShow - 1);

    if (endPage - startPage + 1 < maxPageNumbersToShow) {
      startPage = Math.max(1, endPage - maxPageNumbersToShow + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const visiblePageNumbers = getPaginationRange();

  // --- HANDLER FUNCTIONS ---

  const validateForm = () => {
    const errors = {};
    
    // Required fields validation
    if (!formData.name?.trim()) errors.name = "Product name is required";
    
    // Price validation
    const price = Number(formData.price);
    if (isNaN(price) || price <= 0) {
      errors.price = "Valid price is required";
    }
    
    // HSN Number validation
    if (!formData.hsnNumber?.trim()) {
      errors.hsnNumber = "HSN Number is required";
    } else if (!/^\d{4,8}$/.test(formData.hsnNumber.trim())) {
      errors.hsnNumber = "HSN Number must be 4-8 digits";
    }
    
    // Unit validation - for single pieces, unit should be set to 'none'
    if (!formData.unit && formData.unitType !== 'single') {
      errors.unit = "Unit is required";
    }
    
    // Category validation
    if (!formData.category?.trim()) {
      errors.category = "Category is required";
    }
    
    // Quantity validation
    const quantity = Number(formData.quantity);
    if (isNaN(quantity) || quantity < 0) {
      errors.quantity = "Valid quantity is required";
    }
    
    // Reorder level validation
    const reorderLevel = Number(formData.reorderLevel);
    if (isNaN(reorderLevel) || reorderLevel <= 0) {
      errors.reorderLevel = "Reorder level must be a positive number";
    }
    
    // Description validation
    if (!formData.description?.trim()) {
      errors.description = "Description is required";
    }
    
    // Supplier validation
    if (!formData.supplier) {
      errors.supplier = "Supplier is required";
    } else if (typeof formData.supplier === 'object') {
      // If supplier is an object, ensure it has _id
      if (!formData.supplier._id) {
        errors.supplier = "Invalid supplier selected";
      }
    }
    
    // Batch number validation
    if (!formData.batchNumber?.trim()) {
      errors.batchNumber = "Batch number is required";
    }
    
    // Manufacturing date validation
    if (!formData.manufacturingDate) {
      errors.manufacturingDate = "Manufacturing date is required";
    } else if (new Date(formData.manufacturingDate) > new Date()) {
      errors.manufacturingDate = "Manufacturing date cannot be in the future";
    }
    
    setFormErrors(errors);
    console.log('Form validation errors:', errors);
    return Object.keys(errors).length === 0;
  };

  // Enhanced file upload handler with compression
  const handleFileUpload = async (file) => {
    setUploading(true);
    setUploadProgress(0);
    
    try {
      let fileToUpload = file;
      
      // Check if file size is greater than 1MB and compress if needed
      if (file.size > 1024 * 1024) {
        console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        fileToUpload = await compressImage(file);
        console.log(`Compressed file size: ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`);
      }

      const formData = new FormData();
      formData.append('image', fileToUpload);

      const response = await axios.post(
        "https://server-ims-2d0e.onrender.com/api/upload/image"||"http://localhost:5000/api/upload/image",
        formData,
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setFormErrors({});

    console.log('=== PRODUCT FORM SUBMISSION STARTED ===');
    console.log('Form data:', formData);
    console.log('Editing product:', editingProduct);

    // Validate form
    const errors = {};

    // Required field validations
    if (!formData.name) errors.name = "Product name is required";
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0)
      errors.price = "Valid price is required";
    if (!formData.category) errors.category = "Category is required";
    if (!formData.supplier) errors.supplier = "Supplier is required";
    if (!formData.batchNumber) errors.batchNumber = "Batch number is required";
    if (!formData.manufacturingDate) errors.manufacturingDate = "Manufacturing date is required";
    if (!formData.hsnNumber || !/^\d{4,8}$/.test(formData.hsnNumber))
      errors.hsnNumber = "Valid HSN number (4-8 digits) is required";

    console.log('Form validation errors:', errors);

    // Calculate quantity based on unit type
    let quantity = 0;
    let displayQuantity = 0;
    let quantityPerUnit = null;
    let unitsInStock = null;

    if (formData.unitType === 'single') {
      // For single pieces, use unitQuantity as is
      if (!formData.unitQuantity || isNaN(formData.unitQuantity) || parseInt(formData.unitQuantity) < 0) {
        errors.quantity = "Valid quantity is required";
      }
      quantity = parseInt(formData.unitQuantity || 0);
      displayQuantity = quantity;
    }
    else if (formData.unitType === 'container' || formData.unitType === 'packet') {
      // For containers and packets, validate and calculate total quantity
      if (!formData.quantityPerUnit || isNaN(formData.quantityPerUnit) || parseFloat(formData.quantityPerUnit) <= 0) {
        errors.quantity = "Valid quantity per unit is required";
      }
      if (!formData.unitsInStock || isNaN(formData.unitsInStock) || parseInt(formData.unitsInStock) < 0) {
        errors.quantity = "Valid number of units is required";
      }

      quantityPerUnit = parseFloat(formData.quantityPerUnit || 0);
      unitsInStock = parseInt(formData.unitsInStock || 0);
      displayQuantity = quantityPerUnit * unitsInStock;
      quantity = displayQuantity;

      // Convert to base units if needed (liters to ml, kg to g)
      if (formData.unit === 'liter' || formData.unit === 'kilogram') {
        quantity = Math.round(displayQuantity * 1000);
      }
    }
    else if (formData.unitType === 'bulk') {
      // For bulk items, validate and use unitQuantity
      if (!formData.unitQuantity || isNaN(formData.unitQuantity) || parseFloat(formData.unitQuantity) <= 0) {
        errors.quantity = "Valid quantity is required";
      }
      displayQuantity = parseFloat(formData.unitQuantity || 0);
      quantity = displayQuantity;

      // Convert to base units if needed (liters to ml, kg to g)
      if (formData.unit === 'liter' || formData.unit === 'kilogram') {
        quantity = Math.round(displayQuantity * 1000);
      }
    }

    console.log('Calculated quantity:', {
      unitType: formData.unitType,
      unit: formData.unit,
      displayQuantity,
      quantity,
      errors: Object.keys(errors)
    });

    // If there are validation errors, stop submission
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      console.log('Form validation failed - stopping submission');
      return;
    }

    console.log('Form validation passed - proceeding with API call');

    try {
      // Get supplier details for product ID generation
      const selectedSupplier = suppliers.find(s => s._id === formData.supplier);
      if (!selectedSupplier) {
        throw new Error('Selected supplier not found');
      }

      // Get current date in YYYYMMDD format
      const now = new Date();
      const dateStr = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0')
      ].join('');

      // Get first 3 letters of product name and supplier name
      const productPrefix = formData.name.trim().substring(0, 3).toUpperCase().padEnd(3, 'X');
      const supplierPrefix = selectedSupplier.name.substring(0, 3).toUpperCase().padEnd(3, 'X');

      // Get the manually entered batch number
      const batchNumber = formData.batchNumber.trim().toUpperCase();

      // Generate the product ID using the format: YYYYMMDD-PPP-SSS-BBBBBB
      // Where:
      // - YYYYMMDD is the current date
      // - PPP is first 3 letters of product name
      // - SSS is first 3 letters of supplier name
      // - BBBBBB is the batch number
      const productId = `${dateStr}-${productPrefix}-${supplierPrefix}-${batchNumber}`;

      // Prepare the product data with proper types and required fields
      const productData = {
        // Required fields
        name: formData.name.trim(),
        price: Number(formData.price),
        category: formData.category.trim(),
        quantity: quantity, // Always use the calculated base quantity
        supplier: formData.supplier,
        batchNumber: batchNumber,
        unit: formData.unit || 'piece',
        hsnNumber: formData.hsnNumber.trim(),
        manufacturingDate: formData.manufacturingDate ? new Date(formData.manufacturingDate).toISOString() : new Date().toISOString(),
        
        // Optional fields with defaults
        description: formData.description ? formData.description.trim() : '',
        reorderLevel: Number(formData.reorderLevel || 10),
        unitType: formData.unitType || 'single',
        
        // Conditional fields
        ...(formData.image && { image: formData.image }),
        ...(productId && { productId }),
        
        // Unit-specific fields
        ...(formData.unitType === 'container' || formData.unitType === 'packet' 
          ? {
              quantityPerUnit: quantityPerUnit,
              unitsInStock: unitsInStock,
              unitQuantity: displayQuantity
            } 
          : {
              unitQuantity: displayQuantity
            }
        ),
        ...(formData.containerType && { containerType: formData.containerType })
      };
      
      // Clean up undefined or empty values
      Object.keys(productData).forEach(key => {
        if (productData[key] === undefined || productData[key] === '') {
          delete productData[key];
        }
      });

      console.log('Final product data before submission:', JSON.stringify(productData, null, 2));

      console.log('===FINAL PRODUCT DATA TO SEND ===');
      console.log('Product data:', JSON.stringify(productData, null, 2));
      console.log('Required fields check:');
      console.log('- name:', !!productData.name);
      console.log('- price:', !!productData.price, typeof productData.price);
      console.log('- category:', !!productData.category);
      console.log('- supplier:', !!productData.supplier);
      console.log('- batchNumber:', !!productData.batchNumber);
      console.log('- manufacturingDate:', !!productData.manufacturingDate);
      console.log('- unit:', !!productData.unit);
      console.log('- hsnNumber:', !!productData.hsnNumber);

      // Validate product data before sending
      if (!productData.name) {
        throw new Error("Product name is required");
      }
      if (!productData.category) {
        throw new Error("Product category is required");
      }
      if (productData.price <= 0) {
        throw new Error("Product price must be greater than 0");
      }
      if (productData.quantity < 0) {
        throw new Error("Product quantity cannot be negative");
      }
      if (!productData.supplier) {
        throw new Error("Supplier is required");
      }
      if (!productData.batchNumber) {
        throw new Error("Batch number is required");
      }
      if (!productData.unit) {
        throw new Error("Unit is required");
      }
      if (!productData.hsnNumber) {
        throw new Error("HSN number is required");
      }

      // Cleanup is now done right after creating the productData object

      console.log('Submitting product data:', productData);

      let response;
      if (editingProduct) {
        console.log('Updating existing product:', editingProduct._id);
        response = await dispatch(
          updateProduct({
            id: editingProduct._id,
            productData
          })
        ).unwrap();
      } else {
        console.log('Creating new product');
        response = await dispatch(createProduct(productData)).unwrap();
      }
      
      console.log('Server response:', response);

      console.log('Product saved successfully');

      // Close modal and reset form on success
      setShowModal(false);
      resetForm();

    } catch (error) {
      console.error("Failed to save product:", error);
      
      // Log the full error for debugging
      console.group('Error Details');
      console.log('Error object:', error);
      console.log('Error name:', error.name);
      console.log('Error message:', error.message);
      console.log('Error payload:', error);
      console.groupEnd();

      let errorMessage = "An error occurred while saving the product.";
      let fieldErrors = {};

      // Check if this is an error object from Redux
      if (error && typeof error === 'object') {
        const { message, errors, status } = error;
        
        if (message) {
          errorMessage = message;
        }
        
        // Handle validation errors
        if (errors && Array.isArray(errors) && errors.length > 0) {
          // If errors is an array of error messages
          errorMessage = errors.map(err => {
            if (typeof err === 'string') return err;
            if (err.msg) return err.msg;
            return JSON.stringify(err);
          }).join('\n');
        } else if (errors && typeof errors === 'object') {
          // If errors is an object with field names as keys
          fieldErrors = {};
          Object.entries(errors).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              fieldErrors[key] = value.join(', ');
            } else if (typeof value === 'string') {
              fieldErrors[key] = value;
            } else if (value && value.message) {
              fieldErrors[key] = value.message;
            } else {
              fieldErrors[key] = 'Invalid value';
            }
          });
          errorMessage = 'Please fix the following errors:';
        }
      } 
      // Handle Axios errors
      else if (error.response) {
        // Server responded with an error status
        const { status, data } = error.response;
        console.error('Server error response:', { status, data });

        // Handle specific status codes
        if (status === 400 || status === 422) {
          errorMessage = data?.message || "Please check your input.";
          
          // Handle validation errors
          if (data?.errors) {
            if (Array.isArray(data.errors)) {
              // If errors is an array
              errorMessage = data.errors.join('\n');
            } else if (typeof data.errors === 'object') {
              // If errors is an object with field names as keys
              fieldErrors = data.errors;
              errorMessage = 'Please fix the following errors:';
              console.log('Field errors:', fieldErrors);
            }
          }
        } else if (status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (status === 403) {
          errorMessage = "You don't have permission to perform this action.";
        } else if (status === 404) {
          errorMessage = "The requested resource was not found.";
        } else if (status === 409) {
          errorMessage = data?.message || "A product with these details already exists.";
        } else if (status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else {
          errorMessage = data?.message || `Error (${status}). Please try again.`;
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage = "No response from server. Please check your connection and try again.";
      } else if (error.name === 'ValidationError' || error.name === 'TypeError') {
        // Client-side validation or type error
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        // String error message
        errorMessage = error;
      }

      // Ensure we only set string values in formErrors
      const safeFieldErrors = {};
      Object.entries(fieldErrors).forEach(([key, value]) => {
        safeFieldErrors[key] = String(value);
      });

      // Set the error message in the form
      setFormErrors(prev => ({
        ...prev,
        ...safeFieldErrors,
        submit: errorMessage || 'An unknown error occurred',
      }));

      // Log the final error message
      console.error('Error message shown to user:', errorMessage);
      console.error('Field errors:', fieldErrors);
      
      // Force a re-render to clear any React state issues
      forceUpdate();
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: "", 
      description: "", 
      image: "", 
      price: "", 
      category: "", 
      unitType: "single",
      unit: 'none', // Set default unit for single pieces
      quantity: "",
      unitQuantity: "",
      supplier: "",
      batchNumber: "",
      manufacturingDate: "",
      reorderLevel: 10,
      hsnNumber: ""
    });
    setEditingProduct(null);
    setFormErrors({});
    setUploadProgress(0);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    
    // Ensure we have the correct supplier ID
    const supplierId = typeof product.supplier === 'object' 
      ? product.supplier._id 
      : product.supplier || '';
    
    const manufacturingSource = product.manufacturingDate || product.expiryDate || "";
    
    // Convert quantity to display units if needed
    let displayQuantity = product.quantity || 0;
    let unit = product.unit || 'none';
    let unitType = product.unitType || 'single';

    // For single pieces, always use none unit regardless of stored unit
    if (unitType === 'single') {
      unit = 'none';
    } else if (unit === 'liter' || unit === 'kilogram') {
      displayQuantity = (product.quantity / 1000).toFixed(2);
    }

    setFormData({
      name: product.name,
      description: product.description || "",
      image: product.image,
      price: product.price.toString(),
      category: product.category?._id || product.category || "",
      unitType: unitType,
      unit: unit,
      unitQuantity: displayQuantity.toString(),
      supplier: supplierId,
      batchNumber: product.batchNumber || "",
      manufacturingDate: manufacturingSource ? new Date(manufacturingSource).toISOString().split('T')[0] : "",
      reorderLevel: product.reorderLevel || 10,
      hsnNumber: product.hsnNumber || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      try {
        await dispatch(deleteProduct(id)).unwrap();
        // Success message could be added here
      } catch (error) {
        console.error("Failed to delete product:", error);

        let errorMessage = "Failed to delete product. Please try again.";

        if (error.response) {
          const status = error.response.status;
          const serverMessage = error.response.data?.message || error.response.data?.error;

          switch (status) {
            case 401:
              errorMessage = "Authentication failed. Please log in again.";
              break;
            case 403:
              errorMessage = "You don't have permission to delete this product.";
              break;
            case 404:
              errorMessage = "Product not found.";
              break;
            case 409:
              errorMessage = serverMessage || "Cannot delete product that is referenced elsewhere.";
              break;
            case 500:
              errorMessage = "Server error. Please try again later.";
              break;
            default:
              errorMessage = serverMessage || `Delete failed (${status}). Please try again.`;
          }
        } else if (error.request) {
          errorMessage = "Network error. Please check your connection and try again.";
        }

        alert(errorMessage);

        // Log detailed error for debugging
        console.error("Product delete error details:", {
          message: error.message,
          response: error.response,
          request: error.request,
          config: error.config
        });
      }
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { text: "Out of Stock", color: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300" };
    if (quantity <= 10) return { text: "Low Stock", color: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300" };
    return { text: "In Stock", color: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300" };
  };

  const canModify = user?.role === "superadmin" || user?.role === "stockmanager";

  // Grid view product card component
  const ProductCard = ({ product }) => {
    const stockStatus = getStockStatus(product.quantity || 0);
    
    return (
      <div className="bg-gray-100 dark:bg-slate-800 rounded-lg shadow-sm border border-gray-300 dark:border-slate-700 transition-colors duration-300 overflow-hidden hover:shadow-md transition-shadow">
        <div 
          className="cursor-pointer"
          onClick={() => handleProductClick(product)}
        >
          <div className="relative h-48 w-full">
            <img
              src={product.image || "https://placehold.co/300x300?text=No+Image"}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = "https://placehold.co/300x300?text=No+Image" }}
            />
            <div className="absolute top-2 right-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                {stockStatus.text}
              </span>
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-lg mb-1 truncate">
              {product.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">ID: {product._id.slice(-6)}</p>
            
            <div className="flex items-center justify-between mb-3">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                {(() => {
                  if (product.category?.name) {
                    return product.category.name;
                  } else if (typeof product.category === 'string') {
                    // Find category by ID from the categories array
                    const category = categories.find(cat => cat.id === product.category);
                    return category?.name || product.category || 'No Category';
                  } else if (product.category) {
                    return product.category;
                  } else {
                    return 'No Category';
                  }
                })()}
              </span>
              <span className="font-semibold text-blue-700">
                ₹{product.price.toLocaleString()}
              </span>
            </div>
            
            <p className="text-gray-700 dark:text-slate-300 text-sm line-clamp-2 h-10 mb-4">
              {product.description || "No description"}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  <span className="font-medium">{product.unit === 'liter' ? (product.quantity / 1000).toFixed(2) : 
                                           product.unit === 'kilogram' ? (product.quantity / 1000).toFixed(2) : 
                                           product.quantity || 0}</span>
                  <span className="ml-1 text-gray-500">
                    {product.unit === 'liter' ? 'L' : 
                     product.unit === 'kilogram' ? 'KG' : 
                     product.unit === 'none' ? 'PCS' : 
                     'PCS'}
                  </span>
                </span>
              </div>
              
              {canModify && (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(product);
                    }}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 p-1.5 rounded transition-colors"
                    title="Edit Product"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(product._id, product.name);
                    }}
                    className="bg-red-100 hover:bg-red-200 text-red-700 p-1.5 rounded transition-colors"
                    title="Delete Product"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Quick add product function
  const handleQuickAdd = (supplier) => {
    setFormData({
      name: `${supplier.name} Product`,
      supplier: supplier._id,
      batchNumber: `BATCH-${new Date().getTime().toString().slice(-6)}`,
      unitType: "single",
      quantity: 1,
      price: 0,
      category: "",
      description: "",
      image: "",
      hsnNumber: "",
      manufacturingDate: new Date().toISOString().split('T')[0],
      reorderLevel: 10
    });
    setShowModal(true);
  };

  return (
    <div className="p-4 sm:p-6 bg-blue-50 dark:bg-slate-900 min-h-screen transition-colors duration-300">
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-3 rounded mb-4 flex items-center justify-between">
          <span className="text-sm sm:text-base">❌ {error}</span>
          <button
            onClick={() => dispatch(clearError())}
            className="text-red-500 hover:text-red-700 ml-2 sm:ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="bg-gray-100 rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-blue-700">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 rounded-full bg-blue-100 text-blue-700 mr-3 sm:mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.totalProducts}</h2>
              <p className="text-xs sm:text-sm text-gray-600 truncate">Total Products</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 rounded-full bg-red-100 text-red-600 mr-3 sm:mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.outOfStock}</h2>
              <p className="text-xs sm:text-sm text-gray-600 truncate">Out of Stock</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 rounded-full bg-yellow-100 text-yellow-600 mr-3 sm:mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.lowStock}</h2>
              <p className="text-xs sm:text-sm text-gray-600 truncate">Low Stock</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 rounded-full bg-green-100 text-green-600 mr-3 sm:mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">₹{stats.totalValue.toLocaleString()}</h2>
              <p className="text-xs sm:text-sm text-gray-600 truncate">Total Inventory Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gray-100 rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2 sm:gap-3">
              <span className="bg-blue-700 p-1.5 sm:p-2 rounded-lg text-white text-sm sm:text-base">📦</span>
              <span className="truncate">Product Management</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
              Manage your product catalog - {safeProducts.length} products total
              {filteredProducts.length !== safeProducts.length && (
                <span className="text-blue-700 font-medium"> ({filteredProducts.length} filtered)</span>
              )}
            </p>
          </div>
          {canModify && (
            <div className="flex gap-2">
              <button 
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Product
              </button>
              <span className="mx-2 text-gray-500 self-center">or quick add from:</span>
              {suppliers.slice(0, 3).map(supplier => (
                <button
                  key={supplier._id}
                  onClick={() => handleQuickAdd(supplier)}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 text-sm"
                  title={`Quick add ${supplier.name} product`}
                >
                  {supplier.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-100 rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Search Products
            </label>
            <input
              type="text"
              placeholder="Search by name, description, product ID, or MongoDB ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              disabled={loadingCategories}
            >
              <option value="">All Categories</option>
              {loadingCategories ? (
                <option>Loading categories...</option>
              ) : (
                categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="quantity">Quantity</option>
              <option value="category">Category</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        {/* Display Mode Toggle */}
        <div className="mt-4 pt-4 border-t border-gray-300 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center justify-center sm:justify-start space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">View:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDisplayMode("list")}
                className={`p-1.5 sm:p-2 rounded-md ${displayMode === "list" ? "bg-blue-700 text-white" : "text-gray-500 dark:text-slate-400"}`}
                title="List View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setDisplayMode("grid")}
                className={`p-1.5 sm:p-2 rounded-md ${displayMode === "grid" ? "bg-blue-700 text-white" : "text-gray-500 dark:text-slate-400"}`}
                title="Grid View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Display - List or Grid */}
      {loading && safeProducts.length === 0 ? (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-orange-600"></div>
          <span className="ml-3 sm:ml-4 text-sm sm:text-base text-gray-600">Loading products...</span>
        </div>
      ) : !loading && filteredProducts.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="text-gray-400 text-4xl sm:text-6xl mb-4">📦</div>
          <p className="text-gray-600 text-base sm:text-lg">No products found</p>
          {(searchTerm || categoryFilter) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("");
              }}
              className="mt-3 sm:mt-4 text-blue-700 hover:text-blue-800 underline text-sm sm:text-base"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : displayMode === "list" ? (
        /* List View */
        <div className="bg-gray-100 rounded-lg shadow-sm overflow-hidden mb-4 sm:mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-50 border-b">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-slate-100">Product</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-slate-100">Category</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-slate-100">Price</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-slate-100">Quantity</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-slate-100">Status</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-slate-100">Description</th>
                  {canModify && <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-900 dark:text-slate-100">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems.map((product) => {
                  const stockStatus = getStockStatus(product.quantity || 0);
                  return (
                    <tr key={product._id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div
                          className="flex items-center gap-3 sm:gap-4 cursor-pointer"
                          onClick={() => handleProductClick(product)}
                        >
                          <img
                            src={product.image || "https://placehold.co/48x48?text=No+Image"}
                            alt={product.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border hover:scale-105 transition-transform"
                            onError={(e) => { e.target.src = "https://placehold.co/48x48?text=No+Image" }}
                          />
                          <div className="min-w-0 flex-1">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-slate-100 hover:text-blue-700 transition-colors text-sm sm:text-base truncate">
                                {product.name}
                              </p>
                              {product.productId && (
                                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{product.productId}</p>
                              )}
                              <p className="text-xs text-gray-400 dark:text-slate-500">ID: {product._id.slice(-6)}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs sm:text-sm font-medium">
                          {(() => {
                            if (product.category?.name) {
                              return product.category.name;
                            } else if (typeof product.category === 'string') {
                              // Find category by ID from the categories array
                              const category = categories.find(cat => cat.id === product.category);
                              return category?.name || product.category || 'No Category';
                            } else if (product.category) {
                              return product.category;
                            } else {
                              return 'No Category';
                            }
                          })()}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span className="font-semibold text-blue-700 text-sm sm:text-base">
                          ₹{product.price.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900 dark:text-slate-100 text-sm sm:text-base">
                            {product.unit === 'liter' ? (product.quantity / 1000).toFixed(2) : 
                             product.unit === 'kilogram' ? (product.quantity / 1000).toFixed(2) : 
                             product.quantity || 0}
                          </span>
                          <span className="ml-1 text-gray-500 text-sm">
                            {product.unit === 'liter' ? 'L' : 
                             product.unit === 'kilogram' ? 'KG' : 
                             product.unit === 'none' ? 'PCS' : 
                             'PCS'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <p className="text-gray-700 dark:text-slate-300 max-w-xs truncate text-xs sm:text-sm">
                          {product.description || "No description"}
                        </p>
                      </td>
                      {canModify && (
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(product);
                              }}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-800 p-1.5 sm:p-2 rounded-lg transition-colors"
                              title="Edit Product"
                            >✏️</button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(product._id, product.name);
                              }}
                              className="bg-red-100 hover:bg-red-200 text-red-700 p-1.5 sm:p-2 rounded-lg transition-colors"
                              title="Delete Product"
                            >🗑️</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {currentItems.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Pagination Controls - Fixed Implementation */}
      {filteredProducts.length > itemsPerPage && (
        <div className="bg-gray-100 rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Results Info */}
            <div className="text-sm text-gray-700 dark:text-slate-300">
              Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(indexOfLastItem, filteredProducts.length)}
              </span>{" "}
              of <span className="font-medium">{filteredProducts.length}</span> results
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center space-x-1">
              {/* First Page Button */}
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 text-sm rounded-md ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-gray-700 dark:text-slate-300 border border-gray-300 hover:bg-blue-50"
                }`}
                title="First Page"
              >
                &#171;
              </button>

              {/* Previous Button */}
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 text-sm rounded-md ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-gray-700 dark:text-slate-300 border border-gray-300 hover:bg-blue-50"
                }`}
                title="Previous Page"
              >
                &#8249;
              </button>
              
              {/* First Page if not in visible range */}
              {visiblePageNumbers[0] > 1 && (
                <>
                  <button
                    onClick={() => paginate(1)}
                    className="px-3 py-2 text-sm rounded-md bg-gray-100 text-gray-700 dark:text-slate-300 border border-gray-300 hover:bg-blue-50"
                  >
                    1
                  </button>
                  {visiblePageNumbers[0] > 2 && (
                    <span className="px-2 py-2 text-sm text-gray-500 dark:text-slate-400">...</span>
                  )}
                </>
              )}
              
              {/* Page Numbers */}
              {visiblePageNumbers.map((number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`px-3 py-2 text-sm rounded-md ${
                    currentPage === number
                      ? "bg-blue-800 text-white"
                      : "bg-gray-100 text-gray-700 dark:text-slate-300 border border-gray-300 hover:bg-blue-50"
                  }`}
                >
                  {number}
                </button>
              ))}
              
              {/* Last Page if not in visible range */}
              {visiblePageNumbers[visiblePageNumbers.length - 1] < totalPages && (
                <>
                  {visiblePageNumbers[visiblePageNumbers.length - 1] < totalPages - 1 && (
                    <span className="px-2 py-2 text-sm text-gray-500 dark:text-slate-400">...</span>
                  )}
                  <button
                    onClick={() => paginate(totalPages)}
                    className="px-3 py-2 text-sm rounded-md bg-gray-100 text-gray-700 dark:text-slate-300 border border-gray-300 hover:bg-blue-50"
                  >
                    {totalPages}
                  </button>
                </>
              )}
              
              {/* Next Button */}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 text-sm rounded-md ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-gray-700 dark:text-slate-300 border border-gray-300 hover:bg-blue-50"
                }`}
                title="Next Page"
              >
                &#8250;
              </button>

              {/* Last Page Button */}
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 text-sm rounded-md ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-gray-700 dark:text-slate-300 border border-gray-300 hover:bg-blue-50"
                }`}
                title="Last Page"
              >
                &#187;
              </button>
            </div>
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center justify-center mt-4 pt-4 border-t">
            <label className="text-sm text-gray-700 dark:text-slate-300 mr-2">Items per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                // Note: Since itemsPerPage is const, you'd need to make it state
                // const [itemsPerPage, setItemsPerPage] = useState(10);
                // setItemsPerPage(Number(e.target.value));
                // setCurrentPage(1);
              }}
              className="px-2 py-1 text-sm border border-gray-300 rounded-md"
              disabled // Disabled since itemsPerPage is const - remove this if you make it state
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Product Details</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >✕</button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Image */}
                <div>
                  <img
                    src={selectedProduct.image || "https://placehold.co/400x400?text=No+Image"}
                    alt={selectedProduct.name}
                    className="w-full h-80 object-cover rounded-lg border"
                    onError={(e) => { e.target.src = "https://placehold.co/400x400?text=No+Image"; }}
                  />
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                  {/* Product ID */}
                  {selectedProduct.productId && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Product ID</p>
                      <p className="text-md font-mono text-gray-900 dark:text-slate-100">
                        {selectedProduct.productId}
                      </p>
                    </div>
                  )}
                  
                  {/* Supplier Info */}
                  {selectedProduct.supplier && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Supplier</p>
                      <p className="text-md text-gray-900 dark:text-slate-100">
                        {selectedProduct.supplier.name || 'N/A'}
                      </p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                      {selectedProduct.name}
                    </h3>
                    <p className="text-gray-600">ID: {selectedProduct._id}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Category</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {(() => {
                          if (selectedProduct.category?.name) {
                            return selectedProduct.category.name;
                          } else if (typeof selectedProduct.category === 'string') {
                            // Find category by ID from the categories array
                            const category = categories.find(cat => cat.id === selectedProduct.category);
                            return category?.name || selectedProduct.category || 'No Category';
                          } else if (selectedProduct.category) {
                            return selectedProduct.category;
                          } else {
                            return 'No Category';
                          }
                        })()}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Quantity</p>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                          {selectedProduct.unit === 'liter' ? (selectedProduct.quantity / 1000).toFixed(2) :
                           selectedProduct.unit === 'kilogram' ? (selectedProduct.quantity / 1000).toFixed(2) :
                           selectedProduct.quantity || 0}
                        </span>
                        <span className="ml-1 text-gray-500 text-lg">
                          {selectedProduct.unit === 'liter' ? 'L' :
                           selectedProduct.unit === 'kilogram' ? 'KG' :
                           selectedProduct.unit === 'none' ? 'PCS' :
                           'PCS'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Batch Number</p>
                      <p className="text-lg font-semibold text-blue-800">
                        {selectedProduct.batchNumber || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Manufacturing Date</p>
                      <p className="text-lg font-semibold text-blue-800">
                        {(() => {
                          const manufacturingDate = selectedProduct.manufacturingDate || selectedProduct.expiryDate;
                          return manufacturingDate ? new Date(manufacturingDate).toLocaleDateString() : 'N/A';
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Category</p>
                      <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-lg font-medium">
                        {(() => {
                          if (selectedProduct.category?.name) {
                            return selectedProduct.category.name;
                          } else if (typeof selectedProduct.category === 'string') {
                            // Find category by ID from the categories array
                            const category = categories.find(cat => cat.id === selectedProduct.category);
                            return category?.name || selectedProduct.category || 'No Category';
                          } else if (selectedProduct.category) {
                            return selectedProduct.category;
                          } else {
                            return 'No Category';
                          }
                        })()}
                      </span>
                    </div>
                    
                    {selectedProduct.supplier && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Supplier</p>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="font-semibold text-blue-800">
                            {selectedProduct.supplier.name || 'N/A'}
                          </p>
                          {selectedProduct.supplier.contactPerson && (
                            <p className="text-sm text-gray-600 mt-1">
                              Contact: {selectedProduct.supplier.contactPerson}
                            </p>
                          )}
                          {selectedProduct.supplier.phone && (
                            <p className="text-sm text-gray-600">
                              Phone: {selectedProduct.supplier.phone}
                            </p>
                          )}
                          {selectedProduct.supplier.email && (
                            <p className="text-sm text-blue-600 truncate">
                              {selectedProduct.supplier.email}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                      <p className="text-sm text-gray-600 mb-2">Inventory Information</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Reorder Level</p>
                          <p className="font-semibold">{selectedProduct.reorderLevel || 10}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Added On</p>
                          <p className="font-semibold">
                            {selectedProduct.createdAt ? new Date(selectedProduct.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Stock Status</p>
                    {(() => {
                      const stockStatus = getStockStatus(selectedProduct.quantity || 0);
                      return (
                        <span className={`px-3 py-2 rounded-full text-lg font-medium ${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      );
                    })()}
                  </div>

                  {canModify && (
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => {
                          handleEdit(selectedProduct);
                          setShowDetailModal(false);
                          setSelectedProduct(null);
                        }}
                        className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                      >
                        ✏️ Edit Product
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(selectedProduct._id, selectedProduct.name);
                          setShowDetailModal(false);
                          setSelectedProduct(null);
                        }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                      >
                        🗑️ Delete Product
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mt-8 pt-6 border-t">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">Description</h4>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed text-lg">
                  {selectedProduct.description || "No description available for this product."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showModal && canModify && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${formErrors.name ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Enter product name"
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${formErrors.description ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Enter product description"
                />
                {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Product Image</label>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          try {
                            const imageUrl = await handleFileUpload(file);
                            setFormData({ ...formData, image: imageUrl });
                          } catch (error) {
                            alert("Upload failed: " + error.message);
                          }
                        }
                      }}
                      accept="image/*"
                      disabled={uploading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                    />
                    {uploading && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-800 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{uploadProgress}% uploaded</p>
                      </div>
                    )}
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                      Images larger than 1MB will be automatically compressed
                    </p>
                  </div>
                  {(formData.image || uploading) && (
                    <div className="relative">
                      <img
                        src={formData.image || "https://placehold.co/80x80?text=Uploading..."}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg border"
                        onError={(e) => { e.target.src = "https://placehold.co/80x80?text=Error"; }}
                      />
                      {uploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Price, Category, and Quantity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 ${formErrors.price ? "border-red-500" : "border-gray-300"}`}
                    placeholder="0.00"
                  />
                  {formErrors.price && <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>}
                </div>
                {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${formErrors.category ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Select category</option>
                  {loadingCategories ? (
                    <option>Loading categories...</option>
                  ) : (
                    categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  )}
                </select>
                {formErrors.category && <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>}
              </div>
              
              {/* Supplier */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Supplier *</label>
                <div>
                  <select
                    value={formData.supplier || ''}
                    onChange={(e) => {
                      const supplierId = e.target.value;
                      setFormData(prev => ({ ...prev, supplier: supplierId }));
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                      formErrors.supplier ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={loadingSuppliers}
                  >
                    <option value="">Select supplier</option>
                    {loadingSuppliers ? (
                      <option>Loading suppliers...</option>
                    ) : suppliers.length > 0 ? (
                      suppliers.map((supplier) => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.name} {supplier.contactPerson ? `(${supplier.contactPerson})` : ''}
                        </option>
                      ))
                    ) : (
                      <option disabled>No suppliers available</option>
                    )}
                  </select>
                  {formErrors.supplier && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.supplier}</p>
                  )}
                </div>
                {formErrors.supplier && <p className="text-red-500 text-sm mt-1">{formErrors.supplier}</p>}
              </div>
              </div>
              
              {/* Batch Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Batch Number *</label>
                <input
                  type="text"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${formErrors.batchNumber ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Enter batch number"
                />
                {formErrors.batchNumber && <p className="text-red-500 text-sm mt-1">{formErrors.batchNumber}</p>}
                
                {/* Display generated product ID */}
                {formData.name && formData.supplier && formData.batchNumber && (() => {
                  const now = new Date();
                  const dateStr = [
                    now.getFullYear(),
                    String(now.getMonth() + 1).padStart(2, '0'),
                    String(now.getDate()).padStart(2, '0')
                  ].join('');

                  const selectedSupplier = suppliers.find(s => s._id === formData.supplier);

                  return (
                    <div className="mt-2 p-2 bg-gray-200 rounded-lg">
                      <p className="text-xs text-gray-500">Product ID will be:</p>
                      <p className="font-mono text-sm text-gray-800 font-medium">
                        {`${dateStr}-${formData.name.trim().substring(0, 3).toUpperCase().padEnd(3, 'X')}`}
                        {`-${selectedSupplier?.name.substring(0, 3).toUpperCase().padEnd(3, 'X') || 'XXX'}`}
                        {`-${formData.batchNumber.trim().toUpperCase()}`}
                      </p>
                    </div>
                  );
                })()}
              </div>
              
              {/* Manufacturing Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Manufacturing Date *</label>
                <input
                  type="date"
                  value={formData.manufacturingDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${formErrors.manufacturingDate ? "border-red-500" : "border-gray-300"}`}
                />
                {formErrors.manufacturingDate && <p className="text-red-500 text-sm mt-1">{formErrors.manufacturingDate}</p>}
              </div>
              
              {/* Unit and Quantity */}
              <div className="space-y-4">
                {/* Unit Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Selling Unit Type *</label>
                  <select
                    value={formData.unitType || 'single'}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      unitType: e.target.value,
                      // Reset quantity when changing unit type and set appropriate unit
                      unitQuantity: '',
                      quantityPerUnit: '',
                      unitsInStock: '',
                      containerQuantity: '',
                      // Set appropriate default unit based on type
                      unit: e.target.value === 'single' ? 'none' : formData.unit || 'liter'
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="single">Single Piece (PCS)</option>
                    <option value="container">Container (e.g., Bottles, Boxes)</option>
                    <option value="packet">Pre-packaged Items</option>
                    <option value="bulk">Bulk (Liters/Kilograms)</option>
                  </select>
                </div>

                {/* Container Details (e.g., 2-liter bottles) */}
                {formData.unitType === 'container' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Container Type</label>
                        <select
                          value={formData.containerType || 'bottle'}
                          onChange={(e) => setFormData({ ...formData, containerType: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        >
                          <option value="bottle">Bottle</option>
                          <option value="box">Box</option>
                          <option value="can">Can</option>
                          <option value="packet">Packet</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity per Container *</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={formData.quantityPerUnit || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                quantityPerUnit: value,
                                // Auto-calculate total quantity
                                unitQuantity: value && prev.unitsInStock 
                                  ? (parseFloat(value) * parseInt(prev.unitsInStock || 0)).toFixed(2)
                                  : '0.00'
                              }));
                            }}
                            placeholder="e.g. 2"
                            className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          />
                          <select
                            value={formData.unit || 'liter'}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            className="absolute right-0 top-0 h-full px-2 py-1 bg-gray-100 border-l border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          >
                            <option value="liter">Liters (L)</option>
                            <option value="kilogram">Kilograms (KG)</option>
                            <option value="none">Pieces (PCS)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of Containers in Stock *</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.unitsInStock || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            unitsInStock: value,
                            // Auto-calculate total quantity
                            unitQuantity: value && prev.quantityPerUnit 
                              ? (parseFloat(prev.quantityPerUnit) * parseInt(value)).toFixed(2)
                              : prev.unitQuantity
                          }));
                        }}
                        placeholder="e.g. 10"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Total Quantity:</span>{' '}
                        {formData.unitQuantity || '0'} {formData.unit === 'liter' ? 'L' : formData.unit === 'kilogram' ? 'KG' : formData.unit === 'none' ? 'PCS' : 'PCS'}
                        {formData.unitsInStock && ` (${formData.unitsInStock} ${formData.containerType}s x ${formData.quantityPerUnit || '0'}${formData.unit === 'liter' ? 'L' : formData.unit === 'kilogram' ? 'KG' : formData.unit === 'none' ? 'PCS' : 'PCS'})`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Pre-packaged Items */}
                {formData.unitType === 'packet' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity per Packet</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={formData.quantityPerUnit || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              quantityPerUnit: value,
                              // Auto-calculate total quantity
                              unitQuantity: value && prev.unitsInStock 
                                ? (parseFloat(value) * parseFloat(prev.unitsInStock)).toFixed(2)
                                : prev.unitQuantity
                            }));
                          }}
                          placeholder="e.g. 1.5"
                          className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          {formData.unit === 'liter' ? 'L' :
                           formData.unit === 'kilogram' ? 'KG' :
                           formData.unit === 'none' ? 'PCS' :
                           'PCS'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Packets in Stock *</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.unitsInStock || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            unitsInStock: value,
                            // Auto-calculate total quantity
                            unitQuantity: value && prev.quantityPerUnit 
                              ? (parseFloat(prev.quantityPerUnit) * parseFloat(value)).toFixed(2)
                              : prev.unitQuantity
                          }));
                        }}
                        placeholder="e.g. 10"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* Bulk Quantity Input */}
                {formData.unitType === 'bulk' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                      <select
                        value={formData.unit || 'liter'}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      >
                        <option value="liter">Liters (L)</option>
                        <option value="kilogram">Kilograms (KG)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity *</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.unitQuantity || ''}
                          onChange={(e) => setFormData({ ...formData, unitQuantity: e.target.value })}
                          placeholder={formData.unit === 'liter' ? '0.00' : '0.00'}
                          className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          {formData.unit === 'liter' ? 'L' : 'KG'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Single Piece Input */}
                {formData.unitType === 'single' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pieces in Stock *</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.unitQuantity || ''}
                        onChange={(e) => setFormData({ ...formData, unitQuantity: e.target.value })}
                        placeholder="0"
                        className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        PCS
                      </span>
                    </div>
                  </div>
                )}

                {/* Display Total Quantity */}
                {(formData.unitType === 'packet' || formData.unitType === 'bulk') && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Total Quantity:</span>{' '}
                      {formData.unitQuantity || '0'}{' '}
                      {formData.unitType === 'packet' 
                        ? formData.unit === 'liter' ? 'L' : formData.unit === 'kilogram' ? 'KG' : formData.unit === 'none' ? 'PCS' : 'PCS'
                        : formData.unit === 'kilogram' ? 'KG' : 'L'}
                      {formData.unitType === 'packet' && formData.unitsInStock && ` (${formData.unitsInStock} packets x ${formData.quantityPerUnit || '0'}${formData.unit === 'liter' ? 'L' : formData.unit === 'kilogram' ? 'KG' : formData.unit === 'none' ? 'PCS' : 'PCS'})`}
                    </p>
                  </div>
                )}
              </div>

              {/* HSN Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">HSN Number *</label>
                <input
                  type="text"
                  value={formData.hsnNumber}
                  onChange={(e) => setFormData({ ...formData, hsnNumber: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${formErrors.hsnNumber ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Enter HSN Number (4-8 digits)"
                  maxLength="8"
                />
                {formErrors.hsnNumber && <p className="text-red-500 text-sm mt-1">{formErrors.hsnNumber}</p>}
              </div>
              
              {/* Reorder Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Reorder Level</label>
                <input
                  type="number"
                  min="1"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Inventory notifications trigger when quantity falls to this level</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 ${formErrors.quantity ? "border-red-500" : "border-gray-300"}`}
                  placeholder="0"
                />
                {formErrors.quantity && <p className="text-red-500 text-sm mt-1">{formErrors.quantity}</p>}
              </div>

              {/* Submit Error Display */}
              {formErrors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">⚠️</span>
                    <span>{String(formErrors.submit || 'An error occurred')}</span>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={loading || uploading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={uploading || loading}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    uploading || loading 
                      ? "bg-gray-400 cursor-not-allowed text-white" 
                      : "bg-blue-700 hover:bg-blue-800 text-white shadow-lg hover:shadow-xl"
                  }`}
                >
                  {uploading
                    ? "Uploading Image..."
                    : loading
                    ? "Saving..."
                    : editingProduct
                    ? "Update Product"
                    : "Create Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export as a named export first
const ExportedProductManagement = ProductManagement;

// Then export as default
export { ExportedProductManagement as default };