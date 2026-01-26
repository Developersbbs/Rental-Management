import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { fetchProducts } from '@/redux/features/products/productSlice';
import ProductCreationModal from '@/components/ProductCreationModal';

const ProductSelector = ({
  products,
  value,
  onChange,
  placeholder = "Type to search products or enter new product name",
  error,
  disabled = false,
  supplierId = null,
  showAddNew = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Only update if value changes and it's different from current state
    if (!value || value === '') {
      // Clear everything if no value
      if (searchTerm !== '') {
        setSearchTerm('');
        setSelectedProduct(null);
        setIsNewProduct(false);
      }
      return;
    }

    // Check if it's an existing product ID
    const product = products.find(p => p._id === value);
    if (product) {
      // Only update if different
      if (selectedProduct?._id !== product._id) {
        setSelectedProduct(product);
        setSearchTerm(product.name);
        setIsNewProduct(false);
      }
    } else if (typeof value === 'string' && value.trim() !== '') {
      // It's a new product name
      if (searchTerm !== value) {
        setSearchTerm(value);
        setSelectedProduct(null);
        setIsNewProduct(true);
      }
    }
  }, [value, products]);

  useEffect(() => {
    // Filter products based on search term
    if (searchTerm.trim() === '') {
      setFilteredProducts(products.slice(0, 10)); // Show first 10 products when no search
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered.slice(0, 20)); // Limit to 20 results
    }
  }, [searchTerm, products]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    setSearchTerm(inputValue);
    setIsOpen(true);

    // Clear selected product when user starts typing
    if (selectedProduct) {
      setSelectedProduct(null);
    }

    // Check if input matches existing product
    if (products && products.length > 0 && inputValue.trim() !== '') {
      const exactMatch = products.find(p =>
        p.name.toLowerCase() === inputValue.toLowerCase()
      );
      setIsNewProduct(!exactMatch);
    } else {
      setIsNewProduct(inputValue.trim() !== '');
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setIsNewProduct(false);
    setIsOpen(false);
    onChange(product._id); // Call onChange after state updates
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for selection
    setTimeout(() => {
      setIsOpen(false);
      
      // Only process if there's text and no product selected
      if (searchTerm.trim() !== '' && !selectedProduct) {
        // Check if user typed something that matches an existing product
        const exactMatch = products.find(p =>
          p.name.toLowerCase() === searchTerm.toLowerCase()
        );

        if (exactMatch) {
          // Auto-select the matching product
          setSelectedProduct(exactMatch);
          setIsNewProduct(false);
          onChange(exactMatch._id);
        } else {
          // It's a new product name
          setIsNewProduct(true);
          onChange(searchTerm);
        }
      }
    }, 200);
  };

  const dispatch = useDispatch();

  const handleProductCreated = (newProduct) => {
    console.log('New product created:', newProduct);
    // Close the modal
    setShowCreateModal(false);
    // Refresh the products list so the new product appears in the dropdown
    dispatch(fetchProducts());
    // Select the newly created product
    onChange(newProduct._id);
  };

  const handleAddNewProduct = () => {
    setIsNewProduct(true);
    setSelectedProduct(null);
    onChange(searchTerm); // Pass the new product name when explicitly chosen
    setShowCreateModal(true);
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    // Always return searchTerm to maintain user input
    return searchTerm;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={getDisplayValue()}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${selectedProduct ? 'bg-green-50' : isNewProduct ? 'bg-blue-50' : ''}`}
        />

        {/* Visual indicator for product type */}
        {selectedProduct && (
          <div className="absolute right-2 top-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Existing
            </span>
          </div>
        )}

        {isNewProduct && searchTerm.trim() !== '' && (
          <div className="absolute right-2 top-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              New Product
            </span>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-gray-100 border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredProducts.length > 0 ? (
            <>
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                    selectedProduct?._id === product._id ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="font-medium">{product.name}</div>
                  {product.description && (
                    <div className="text-sm text-gray-500">{product.description}</div>
                  )}
                  <div className="text-xs text-gray-400">
                    ₹{product.price} • {product.quantity} in stock
                  </div>
                </div>
              ))}

              {/* Show "No more products" if we have results but limited */}
              {filteredProducts.length >= 20 && (
                <div className="px-4 py-2 text-sm text-gray-500 border-t">
                  Type to search more products...
                </div>
              )}
            </>
          ) : searchTerm.trim() === '' ? (
            <div className="px-4 py-2 text-sm text-gray-500">
              Start typing to search products...
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              No products found. Press Enter to add "{searchTerm}" as new product.
            </div>
          )}

          {/* Show option to add new product */}
          {searchTerm.trim() !== '' && showAddNew && isNewProduct && (
            <div
              className="px-4 py-2 text-sm text-blue-600 border-t bg-blue-50 cursor-pointer hover:bg-blue-100"
              onClick={handleAddNewProduct}
            >
              ➕ Add new product: "{searchTerm}"
            </div>
          )}

          {/* Show "Add New Product" option when no search term */}
          {searchTerm.trim() === '' && showAddNew && (
            <div
              className="px-4 py-2 text-sm text-blue-600 border-t bg-blue-50 cursor-pointer hover:bg-blue-100"
              onClick={handleAddNewProduct}
            >
              ➕ Add New Product
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      {/* Product Creation Modal */}
      <ProductCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProductCreated={handleProductCreated}
        supplierId={supplierId}
      />
    </div>
  );
};

export default ProductSelector;
