import React, { useState, useEffect } from 'react';
import ProductSelector from './ProductSelector';
import ProductCreationModal from './ProductCreationModal';

const InwardForm = ({
  inward,
  suppliers,
  products,
  onSubmit,
  onCancel,
  isEditMode,
  isLoading,
  onProductCreated // Callback to refresh products
}) => {
  const [formData, setFormData] = useState({
    supplier: '',
    purchaseOrder: '',
    items: [{
      product: '',
      orderedQuantity: '',
      receivedQuantity: '',
      unitCost: '',
      batchNumber: '',
      manufacturingDate: '',
      expiryDate: '',
      priceHistory: []
    }],
    invoiceNumber: '',
    invoiceDate: '',
    deliveryChallanNumber: '',
    vehicleNumber: '',
    notes: '',
    qualityCheckStatus: 'pending',
    qualityCheckNotes: ''
  });

  const [errors, setErrors] = useState({});
  const [showProductModal, setShowProductModal] = useState(false);
  const [newlyCreatedProduct, setNewlyCreatedProduct] = useState(null);

  useEffect(() => {
    if (inward) {
      setFormData({
        supplier: inward.supplier?._id || '',
        purchaseOrder: inward.purchaseOrder?._id || '',
        items: inward.items?.map(item => ({
          product: item.product._id,
          orderedQuantity: item.orderedQuantity || 0,
          receivedQuantity: item.receivedQuantity || 0,
          unitCost: item.unitCost || 0,
          batchNumber: item.batchNumber || '',
          manufacturingDate: item.manufacturingDate ? item.manufacturingDate.split('T')[0] : '',
          expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
          priceHistory: item.priceHistory || [] // Initialize price history
        })) || [{ product: '', orderedQuantity: 0, receivedQuantity: 0, unitCost: 0, batchNumber: '', manufacturingDate: '', expiryDate: '', priceHistory: [] }],
        invoiceNumber: inward.invoiceNumber || '',
        invoiceDate: inward.invoiceDate ? inward.invoiceDate.split('T')[0] : '',
        deliveryChallanNumber: inward.deliveryChallanNumber || '',
        vehicleNumber: inward.vehicleNumber || '',
        notes: inward.notes || '',
        qualityCheckStatus: inward.qualityCheckStatus || 'pending',
        qualityCheckNotes: inward.qualityCheckNotes || ''
      });
    }
  }, [inward]);

  // Debug: Log products received as props
  useEffect(() => {
    console.log('🔧 InwardForm received products:', products);
    console.log('🔧 InwardForm products type:', Array.isArray(products) ? 'Array' : typeof products);
    console.log('🔧 InwardForm products length:', Array.isArray(products) ? products.length : 'N/A');
    if (Array.isArray(products) && products.length > 0) {
      console.log('✅ InwardForm: Products loaded successfully');
      console.log('🔧 Sample product:', products[0]);
    } else {
      console.warn('⚠️ InwardForm: No products available');
    }
  }, [products]);

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        product: '',
        orderedQuantity: 0,
        receivedQuantity: 0,
        unitCost: 0,
        batchNumber: '',
        manufacturingDate: '',
        expiryDate: ''
      }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const updateItem = (index, fieldOrUpdates, value) => {
    let updates;

    // If second argument is a string, it's a field name
    if (typeof fieldOrUpdates === 'string') {
      updates = { [fieldOrUpdates]: value };
    } else {
      // Otherwise, it's an updates object
      updates = fieldOrUpdates;
    }

    // Convert empty strings to 0 for numeric fields when updating
    const numericFields = ['orderedQuantity', 'receivedQuantity', 'unitCost', 'previousUnitCost'];
    Object.keys(updates).forEach(key => {
      if (numericFields.includes(key) && updates[key] === '') {
        updates[key] = 0;
      }
    });

    const newItems = formData.items.map((item, i) =>
      i === index ? { ...item, ...updates } : item
    );
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.supplier) {
      newErrors.supplier = 'Supplier is required';
    }

    formData.items.forEach((item, index) => {
      if (!item.product || item.product.trim() === '') {
        newErrors[`item_${index}_product`] = 'Product is required';
      }
      if (!item.receivedQuantity || item.receivedQuantity <= 0) {
        newErrors[`item_${index}_receivedQuantity`] = 'Received quantity must be greater than 0';
      }
      if (!item.unitCost || item.unitCost < 0) {
        newErrors[`item_${index}_unitCost`] = 'Unit cost must be 0 or greater';
      }
      if (!item.batchNumber) {
        newErrors[`item_${index}_batchNumber`] = 'Batch number is required';
      }
      if (!item.manufacturingDate) {
        newErrors[`item_${index}_manufacturingDate`] = 'Manufacturing date is required';
      }
      if (item.manufacturingDate && item.expiryDate && new Date(item.expiryDate) <= new Date(item.manufacturingDate)) {
        newErrors[`item_${index}_expiryDate`] = 'Expiry date must be after manufacturing date';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Clean up the data before submitting
      const cleanedData = {
        ...formData,
        items: formData.items.map(item => ({
          ...item,
          // Ensure we have the correct values
          unitCost: parseFloat(item.unitCost) || 0,
          receivedQuantity: parseFloat(item.receivedQuantity) || 0,
          orderedQuantity: parseFloat(item.orderedQuantity) || 0
        }))
      };

      // Remove purchaseOrder if it's empty or invalid
      if (!formData.purchaseOrder || formData.purchaseOrder.trim() === '') {
        delete cleanedData.purchaseOrder;
      }

      console.log('📤 Submitting inward data:', JSON.stringify(cleanedData, null, 2));
      console.log('📦 Items:', cleanedData.items);

      try {
        // Submit the form data
        await onSubmit(cleanedData);

        // Clear the form after successful submission
        setFormData({
          ...formData,
          items: [{
            product: '',
            orderedQuantity: 0,
            receivedQuantity: 0,
            unitCost: 0,
            batchNumber: '',
            manufacturingDate: '',
            expiryDate: ''
          }],
          invoiceNumber: '',
          invoiceDate: '',
          deliveryChallanNumber: '',
          vehicleNumber: '',
          notes: '',
          qualityCheckStatus: 'pending',
          qualityCheckNotes: ''
        });
      } catch (error) {
        console.error('Error submitting form:', error);
        // Handle error (show error message to user)
      }
    }
  };

  const calculateItemTotal = (item) => {
    return item.receivedQuantity * item.unitCost;
  };

  const calculateGrandTotal = () => {
    return formData.items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const handleProductChange = (index, productValue) => {
    // When product changes, update the product field
    updateItem(index, { product: productValue });
  };

  const handleProductCreated = (newProduct) => {
    console.log('New product created:', newProduct);
    setNewlyCreatedProduct(newProduct);
    setShowProductModal(false);

    // Notify parent component to refresh products list
    if (onProductCreated) {
      onProductCreated(newProduct);
    }

    // Optionally, you can automatically select the newly created product
    // in the current item being edited
    if (newProduct && newProduct._id) {
      // Find the last item or the item that triggered the modal
      const lastItemIndex = formData.items.length - 1;
      updateItem(lastItemIndex, { product: newProduct._id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 shadow-md rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">
        {isEditMode ? 'Edit Inward' : 'Create New Inward (GRN)'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier *
            </label>
            <select
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${errors.supplier ? 'border-red-500' : 'border-gray-300'
                }`}
            >
              <option value="">Select Supplier</option>
              {Array.isArray(suppliers) && suppliers.length > 0 ? (
                suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  {suppliers.length === 0 ? 'No suppliers available' : 'Loading suppliers...'}
                </option>
              )}
            </select>
            {errors.supplier && <p className="text-red-500 text-sm mt-1">{errors.supplier}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Order
            </label>
            <input
              type="text"
              value={formData.purchaseOrder}
              onChange={(e) => setFormData({ ...formData, purchaseOrder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="PO number (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Number
            </label>
            <input
              type="text"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Date
            </label>
            <input
              type="date"
              value={formData.invoiceDate}
              onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Challan Number
            </label>
            <input
              type="text"
              value={formData.deliveryChallanNumber}
              onChange={(e) => setFormData({ ...formData, deliveryChallanNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Number
            </label>
            <input
              type="text"
              value={formData.vehicleNumber}
              onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Items</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowProductModal(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2 shadow-sm transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add New Product
              </button>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Add Item
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="border border-gray-300 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product *
                    </label>
                    <ProductSelector
                      products={Array.isArray(products) ? products : []}
                      value={item.product}
                      onChange={(productValue) => handleProductChange(index, productValue)}
                      placeholder="Type to search products or enter new product name"
                      error={errors[`item_${index}_product`]}
                      supplierId={formData.supplier}
                      showAddNew={true}
                    />
                    {errors[`item_${index}_product`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`item_${index}_product`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Received Quantity *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.receivedQuantity === 0 ? '' : item.receivedQuantity}
                      onChange={(e) => updateItem(index, 'receivedQuantity', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${errors[`item_${index}_receivedQuantity`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors[`item_${index}_receivedQuantity`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`item_${index}_receivedQuantity`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Cost *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitCost === 0 ? '' : item.unitCost}
                      onChange={(e) => updateItem(index, 'unitCost', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${errors[`item_${index}_unitCost`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors[`item_${index}_unitCost`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`item_${index}_unitCost`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batch Number *
                    </label>
                    <input
                      type="text"
                      value={item.batchNumber}
                      onChange={(e) => updateItem(index, 'batchNumber', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${errors[`item_${index}_batchNumber`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors[`item_${index}_batchNumber`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`item_${index}_batchNumber`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manufacturing Date *
                    </label>
                    <input
                      type="date"
                      value={item.manufacturingDate}
                      onChange={(e) => updateItem(index, 'manufacturingDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${errors[`item_${index}_manufacturingDate`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors[`item_${index}_manufacturingDate`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`item_${index}_manufacturingDate`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={item.expiryDate}
                      onChange={(e) => updateItem(index, 'expiryDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${errors[`item_${index}_expiryDate`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors[`item_${index}_expiryDate`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`item_${index}_expiryDate`]}</p>
                    )}
                  </div>
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  Total: ₹{calculateItemTotal(item).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Check */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quality Check Status
            </label>
            <select
              value={formData.qualityCheckStatus}
              onChange={(e) => setFormData({ ...formData, qualityCheckStatus: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="pending">Pending</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quality Check Notes
          </label>
          <textarea
            value={formData.qualityCheckNotes}
            onChange={(e) => setFormData({ ...formData, qualityCheckNotes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter quality check notes..."
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter any additional notes..."
          />
        </div>

        {/* Summary */}
        <div className="bg-gray-200 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Summary</h3>
          <div className="text-xl font-bold">
            Grand Total: ₹{calculateGrandTotal().toFixed(2)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 shadow-sm transition-colors"
          >
            {isEditMode ? 'Update Inward' : 'Create Inward'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Product Creation Modal */}
      <ProductCreationModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onProductCreated={handleProductCreated}
        supplierId={formData.supplier}
      />
    </div>
  );
};

export default InwardForm;
