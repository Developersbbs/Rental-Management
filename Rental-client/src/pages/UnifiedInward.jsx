import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Package, Tag } from 'lucide-react';
import accessoryInwardService from '../services/accessoryInwardService';
import rentalInwardService from '../services/rentalInwardService';
import productService from '../services/productService';
import rentalProductService from '../services/rentalProductService';
import rentalCategoryService from '../services/rentalCategoryService';
import supplierService from '../services/supplierService';
import categoryService from '../services/categoryService';
import rentalSupplierService from '../services/rentalSupplierService';
import ImportModal from '../components/ImportModal';
import { toast } from 'react-toastify';

const UnifiedInward = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('rental'); // 'rental' or 'selling'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showImportModal, setShowImportModal] = useState(false);

    // Common data
    const [suppliers, setSuppliers] = useState([]);

    // Rental specific
    const [rentalProducts, setRentalProducts] = useState([]);
    const [rentalCategories, setRentalCategories] = useState([]);
    const [rentalSuppliers, setRentalSuppliers] = useState([]); // State for rental suppliers
    const [rentalItems, setRentalItems] = useState([]);

    const [rentalFormData, setRentalFormData] = useState({
        receivedDate: new Date().toISOString().split('T')[0],
        supplierInvoiceNumber: '',
        notes: '',
        inwardType: 'purchase', // 'purchase' or 'sub_rental'
        supplier: '' // For sub_rental
    });

    const [currentRentalItem, setCurrentRentalItem] = useState({
        category: '',
        product: '',
        quantity: 1,
        purchaseCost: '',

        // Sub-rental fields
        vendorRentalRate: { hourly: 0, daily: 0, monthly: 0 },
        vendorReturnDate: '',

        batchNumber: '',
        brand: '',
        modelNumber: '',
        purchaseDate: '',
        condition: 'new',
        notes: ''
    });

    // Selling specific
    const [sellingCategories, setSellingCategories] = useState([]);
    const [sellingItems, setSellingItems] = useState([]);
    const [sellingFormData, setSellingFormData] = useState({
        receivedDate: new Date().toISOString().split('T')[0],
        supplierInvoiceNumber: '',
        notes: ''
    });
    const [currentSellingItem, setCurrentSellingItem] = useState({
        category: '',
        name: '',
        sku: '',
        quantity: 1,
        purchaseCost: '',
        sellingPrice: '',
        minStockLevel: 5,
        location: '',
        notes: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [suppliersData, rentalProductsData, rentalCategoriesData, sellingCategoriesData, rentalSuppliersData] = await Promise.all([
                supplierService.getAllSuppliers(),
                rentalProductService.getAllRentalProducts(),
                rentalCategoryService.getAllRentalCategories(),
                categoryService.getAllCategories(),
                rentalSupplierService.getAllRentalSuppliers() // Fetch rental suppliers
            ]);

            setSuppliers(suppliersData.suppliers || suppliersData.docs || suppliersData || []);
            setRentalProducts(rentalProductsData.rentalProducts || []);
            setRentalCategories(rentalCategoriesData.rentalCategories || []);
            setSellingCategories(sellingCategoriesData || []);
            setRentalSuppliers(rentalSuppliersData.rentalSuppliers || []);
        } catch (err) {
            setError('Failed to load initial data');
            console.error('Error fetching data:', err);
        }
    };

    // Rental handlers
    const handleRentalFormChange = (e) => {
        setRentalFormData({ ...rentalFormData, [e.target.name]: e.target.value });
    };

    const handleCurrentRentalItemChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith('vendorRentalRate.')) {
            const rateType = name.split('.')[1];
            setCurrentRentalItem(prev => ({
                ...prev,
                vendorRentalRate: {
                    ...prev.vendorRentalRate,
                    [rateType]: parseFloat(value) || 0
                }
            }));
        } else {
            setCurrentRentalItem(prev => ({
                ...prev,
                [name]: value,
                ...(name === 'category' ? { product: '' } : {})
            }));
        }
    };

    const addRentalItem = () => {
        if (!currentRentalItem.product || !currentRentalItem.quantity || !currentRentalItem.batchNumber) {
            setError('Please fill in product, quantity and batch number.');
            return;
        }

        if (rentalFormData.inwardType === 'purchase' && !currentRentalItem.purchaseCost) {
            setError('Purchase cost is required for purchase inward.');
            return;
        }

        setError('');

        const product = rentalProducts.find(p => p._id === currentRentalItem.product);

        // Calculate total cost display
        let totalCost = 0;
        if (rentalFormData.inwardType === 'purchase') {
            totalCost = currentRentalItem.quantity * parseFloat(currentRentalItem.purchaseCost || 0);
        }

        const newItem = {
            ...currentRentalItem,
            productName: product?.name,
            totalCost: totalCost
        };

        setRentalItems([...rentalItems, newItem]);
        setCurrentRentalItem({
            category: currentRentalItem.category,
            product: '',
            quantity: 1,
            purchaseCost: '',

            vendorRentalRate: { hourly: 0, daily: 0, monthly: 0 },
            vendorReturnDate: '',

            batchNumber: '',
            brand: '',
            modelNumber: '',
            purchaseDate: '',
            condition: 'new',
            notes: ''
        });
    };

    const removeRentalItem = (index) => {
        setRentalItems(rentalItems.filter((_, i) => i !== index));
    };

    const calculateRentalTotal = () => {
        if (rentalFormData.inwardType === 'sub_rental') return 0;
        return rentalItems.reduce((sum, item) => sum + item.totalCost, 0);
    };

    const submitRentalInward = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (rentalItems.length === 0) {
            setError('Please add at least one rental item.');
            return;
        }

        if (rentalFormData.inwardType === 'sub_rental' && !rentalFormData.supplier) {
            setError('Please select a supplier for Vendor Rental.');
            return;
        }

        try {
            setLoading(true);
            const totalAmount = calculateRentalTotal();

            const inwardData = {
                inwardType: rentalFormData.inwardType,
                supplier: rentalFormData.inwardType === 'sub_rental' ? rentalFormData.supplier : undefined,
                receivedDate: rentalFormData.receivedDate,
                supplierInvoiceNumber: rentalFormData.supplierInvoiceNumber,
                items: rentalItems.map(item => ({
                    product: item.product,
                    quantity: item.quantity,
                    purchaseCost: rentalFormData.inwardType === 'purchase' ? parseFloat(item.purchaseCost) : undefined,
                    vendorRentalRate: rentalFormData.inwardType === 'sub_rental' ? item.vendorRentalRate : undefined,
                    vendorReturnDate: rentalFormData.inwardType === 'sub_rental' ? item.vendorReturnDate : undefined,
                    ownershipType: rentalFormData.inwardType === 'sub_rental' ? 'sub_rented' : 'owned',
                    batchNumber: item.batchNumber,
                    brand: item.brand,
                    modelNumber: item.modelNumber,
                    purchaseDate: item.purchaseDate,
                    condition: item.condition,
                    notes: item.notes
                })),
                totalAmount,
                notes: rentalFormData.notes
            };

            await rentalInwardService.createRentalInward(inwardData);
            setSuccess('Rental inward created successfully!');

            // Reset form
            setRentalFormData({
                receivedDate: new Date().toISOString().split('T')[0],
                supplierInvoiceNumber: '',
                notes: '',
                inwardType: 'purchase',
                supplier: ''
            });
            setRentalItems([]);
            setCurrentRentalItem({
                category: '',
                product: '',
                quantity: 1,
                purchaseCost: '',
                vendorRentalRate: { hourly: 0, daily: 0, monthly: 0 },
                vendorReturnDate: '',
                batchNumber: '',
                brand: '',
                modelNumber: '',
                purchaseDate: '',
                condition: 'new',
                notes: ''
            });

            // Navigate to inward history after short delay
            setTimeout(() => {
                navigate('/rentals/inward-history');
            }, 2000);

        } catch (err) {
            console.error('Error creating rental inward:', err);
            // Extract the most specific error message available
            const errorMessage = err.response?.data?.message
                || err.response?.data?.error
                || err.message
                || 'Failed to create rental inward';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleRentalImport = async (formData) => {
        // Inherit values from main form
        if (rentalFormData.inwardType === 'sub_rental' && !rentalFormData.supplier) {
            toast.error('Please select a vendor in the main form before importing');
            throw new Error('Vendor required');
        }

        formData.append('inwardType', rentalFormData.inwardType);
        formData.append('supplier', rentalFormData.supplier || '');
        formData.append('supplierInvoiceNumber', rentalFormData.supplierInvoiceNumber || '');
        formData.append('receivedDate', rentalFormData.receivedDate || new Date().toISOString());
        formData.append('notes', rentalFormData.notes || '');

        return await rentalInwardService.importRentalInwards(formData);
    };

    const handleSellingImport = async (formData) => {
        formData.append('supplierInvoiceNumber', sellingFormData.supplierInvoiceNumber || '');
        formData.append('receivedDate', sellingFormData.receivedDate || new Date().toISOString());
        formData.append('notes', sellingFormData.notes || '');

        return await accessoryInwardService.importAccessoryInwards(formData);
    };

    // Selling handlers (unchanged)
    const handleSellingFormChange = (e) => {
        setSellingFormData({ ...sellingFormData, [e.target.name]: e.target.value });
    };

    const handleCurrentSellingItemChange = (e) => {
        const { name, value } = e.target;
        setCurrentSellingItem(prev => ({ ...prev, [name]: value }));
    };

    const addSellingItem = () => {
        if (!currentSellingItem.name || !currentSellingItem.quantity || !currentSellingItem.purchaseCost || !currentSellingItem.sellingPrice) {
            setError('Please fill in all required fields for the selling item.');
            return;
        }
        setError('');

        const newItem = {
            ...currentSellingItem,
            totalCost: currentSellingItem.quantity * parseFloat(currentSellingItem.purchaseCost)
        };

        setSellingItems([...sellingItems, newItem]);
        setCurrentSellingItem({
            category: currentSellingItem.category,
            name: '',
            sku: '',
            quantity: 1,
            purchaseCost: '',
            sellingPrice: '',
            minStockLevel: 5,
            location: '',
            notes: ''
        });
    };

    const removeSellingItem = (index) => {
        setSellingItems(sellingItems.filter((_, i) => i !== index));
    };

    const submitSellingInward = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (sellingItems.length === 0) {
            setError('Please add at least one selling item.');
            return;
        }

        try {
            setLoading(true);

            // Prepare data for backend
            const inwardData = {
                receivedDate: sellingFormData.receivedDate,
                items: sellingItems,
                supplierInvoiceNumber: sellingFormData.supplierInvoiceNumber,
                totalAmount: calculateTotal(sellingItems),
                notes: sellingFormData.notes
            };

            await accessoryInwardService.createAccessoryInward(inwardData);

            setSuccess('Selling accessories added successfully!');

            // Reset form
            setSellingFormData({
                receivedDate: new Date().toISOString().split('T')[0],
                supplierInvoiceNumber: '',
                notes: ''
            });
            setSellingItems([]);
            setCurrentSellingItem({
                category: '',
                name: '',
                sku: '',
                quantity: 1,
                purchaseCost: '',
                sellingPrice: '',
                minStockLevel: 5,
                location: '',
                notes: ''
            });

            // Navigate to inward history after short delay
            setTimeout(() => {
                navigate('/rentals/inward-history');
            }, 2000);

        } catch (err) {
            console.error('Error creating selling inward:', err);
            setError(err.response?.data?.message || err.message || 'Failed to add selling accessories');
        } finally {
            setLoading(false);
        }
    };

    const filteredRentalProducts = currentRentalItem.category
        ? rentalProducts.filter(p => p.category === currentRentalItem.category || p.category?._id === currentRentalItem.category)
        : rentalProducts;

    const calculateTotal = (items) => {
        return items.reduce((total, item) => total + (item.totalCost || 0), 0);
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Product Inward
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Receive rental products and selling accessories into inventory
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/rentals/products')}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                    {activeTab === 'rental' && (
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                        >
                            <Package className="w-5 h-5" />
                            Import Bulk
                        </button>
                    )}
                    {activeTab === 'selling' && (
                        <button
                            type="button"
                            onClick={() => setShowImportModal(true)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                        >
                            <Tag className="w-5 h-5" />
                            Import Bulk
                        </button>
                    )}
                </div>

                {/* Tab Switcher */}
                <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-1 flex gap-2">
                    <button
                        onClick={() => setActiveTab('rental')}
                        className={`flex-1 px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'rental'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        <Package className="w-5 h-5" />
                        Rental Products
                    </button>
                    <button
                        onClick={() => setActiveTab('selling')}
                        className={`flex-1 px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'selling'
                            ? 'bg-primary text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        <Tag className="w-5 h-5" />
                        Selling Accessories
                    </button>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3 rounded">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 p-3 rounded">
                        {success}
                    </div>
                )}

                {/* Rental Products Tab */}
                {activeTab === 'rental' && (
                    <form onSubmit={submitRentalInward} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">

                        {/* Inward Type Selection */}
                        <div className="mb-6 border-b border-gray-200 dark:border-slate-700 pb-6">
                            <label className="block text-lg font-medium text-gray-900 dark:text-white mb-4">
                                Inward Type
                            </label>
                            <div className="flex gap-4">
                                <label className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${rentalFormData.inwardType === 'purchase' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-blue-300'}`}>
                                    <input
                                        type="radio"
                                        name="inwardType"
                                        value="purchase"
                                        checked={rentalFormData.inwardType === 'purchase'}
                                        onChange={handleRentalFormChange}
                                        className="hidden"
                                    />
                                    <div className="text-center">
                                        <span className={`block font-semibold ${rentalFormData.inwardType === 'purchase' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>Owned Inventory (Purchase)</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Products owned by us</span>
                                    </div>
                                </label>
                                <label className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${rentalFormData.inwardType === 'sub_rental' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-purple-300'}`}>
                                    <input
                                        type="radio"
                                        name="inwardType"
                                        value="sub_rental"
                                        checked={rentalFormData.inwardType === 'sub_rental'}
                                        onChange={handleRentalFormChange}
                                        className="hidden"
                                    />
                                    <div className="text-center">
                                        <span className={`block font-semibold ${rentalFormData.inwardType === 'sub_rental' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>Vendor Rental (Sub-rental)</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Products rented from other vendors</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Received Date *
                                </label>
                                <input
                                    type="date"
                                    name="receivedDate"
                                    value={rentalFormData.receivedDate}
                                    onChange={handleRentalFormChange}
                                    required
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                />
                            </div>

                            {rentalFormData.inwardType === 'sub_rental' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Vendor (Supplier) *
                                    </label>
                                    <select
                                        name="supplier"
                                        value={rentalFormData.supplier}
                                        onChange={handleRentalFormChange}
                                        required
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    >
                                        <option value="">Select Vendor</option>
                                        {rentalSuppliers.map(supplier => (
                                            <option key={supplier._id} value={supplier._id}>
                                                {supplier.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Supplier Invoice Number
                                </label>
                                <input
                                    type="text"
                                    name="supplierInvoiceNumber"
                                    value={rentalFormData.supplierInvoiceNumber}
                                    onChange={handleRentalFormChange}
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    placeholder="e.g., INV-2024-001"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                value={rentalFormData.notes}
                                onChange={handleRentalFormChange}
                                rows="2"
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                placeholder="Additional notes..."
                            />
                        </div>

                        <div className="mb-6 border-t border-gray-200 dark:border-slate-700 pt-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add Rental Item</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Category
                                    </label>
                                    <select
                                        name="category"
                                        value={currentRentalItem.category}
                                        onChange={handleCurrentRentalItemChange}
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    >
                                        <option value="">All Categories</option>
                                        {rentalCategories.map(cat => (
                                            <option key={cat._id} value={cat._id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Product *
                                    </label>
                                    <select
                                        name="product"
                                        value={currentRentalItem.product}
                                        onChange={handleCurrentRentalItemChange}
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    >
                                        <option value="">Select Product</option>
                                        {filteredRentalProducts.map(product => (
                                            <option key={product._id} value={product._id}>
                                                {product.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={currentRentalItem.quantity}
                                        onChange={handleCurrentRentalItemChange}
                                        min="1"
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    />
                                </div>

                                {rentalFormData.inwardType === 'purchase' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Purchase Cost (₹) *
                                        </label>
                                        <input
                                            type="number"
                                            name="purchaseCost"
                                            value={currentRentalItem.purchaseCost}
                                            onChange={handleCurrentRentalItemChange}
                                            min="0"
                                            step="0.01"
                                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Daily Rent (₹)
                                            </label>
                                            <input
                                                type="number"
                                                name="vendorRentalRate.daily"
                                                value={currentRentalItem.vendorRentalRate.daily}
                                                onChange={handleCurrentRentalItemChange}
                                                min="0"
                                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Return Date
                                            </label>
                                            <input
                                                type="date"
                                                name="vendorReturnDate"
                                                value={currentRentalItem.vendorReturnDate}
                                                onChange={handleCurrentRentalItemChange}
                                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Batch Number *
                                    </label>
                                    <input
                                        type="text"
                                        name="batchNumber"
                                        value={currentRentalItem.batchNumber}
                                        onChange={handleCurrentRentalItemChange}
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        placeholder="e.g., BATCH-001"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Brand
                                    </label>
                                    <input
                                        type="text"
                                        name="brand"
                                        value={currentRentalItem.brand}
                                        onChange={handleCurrentRentalItemChange}
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        placeholder="e.g., Sony"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Model Number
                                    </label>
                                    <input
                                        type="text"
                                        name="modelNumber"
                                        value={currentRentalItem.modelNumber}
                                        onChange={handleCurrentRentalItemChange}
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        placeholder="e.g., XYZ-123"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Condition
                                    </label>
                                    <select
                                        name="condition"
                                        value={currentRentalItem.condition}
                                        onChange={handleCurrentRentalItemChange}
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    >
                                        <option value="new">New</option>
                                        <option value="good">Good</option>
                                        <option value="fair">Fair</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={addRentalItem}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Item
                                </button>
                            </div>
                        </div>

                        {/* Added Items List */}
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Added Items ({rentalItems.length})
                            </h2>
                            <div className="space-y-4">
                                {rentalItems.length === 0 ? (
                                    <p className="text-gray-600 dark:text-gray-400 text-center">No items added yet.</p>
                                ) : (
                                    rentalItems.map((item, index) => (
                                        <div key={index} className="border dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-medium text-gray-900 dark:text-white">
                                                    {item.productName || 'Unknown Product'}
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() => removeRentalItem(index)}
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Qty:</span>
                                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                                                </div>
                                                {rentalFormData.inwardType === 'purchase' ? (
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                                                        <span className="ml-2 font-medium text-gray-900 dark:text-white">₹{item.purchaseCost}</span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Daily Rent:</span>
                                                        <span className="ml-2 font-medium text-gray-900 dark:text-white">₹{item.vendorRentalRate?.daily || 0}</span>
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Batch:</span>
                                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{item.batchNumber}</span>
                                                </div>
                                                {rentalFormData.inwardType === 'purchase' && (
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Total:</span>
                                                        <span className="ml-2 font-medium text-gray-900 dark:text-white">₹{item.totalCost.toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Show extra details for sub-rental */}
                                            {rentalFormData.inwardType === 'sub_rental' && (
                                                <div className="mt-2 text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">Return Date: </span>
                                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{item.vendorReturnDate || 'N/A'}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="border-t dark:border-slate-600 pt-4 mb-6">
                            <div className="flex justify-end">
                                <div className="text-right">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        Total Items: {rentalItems.length}
                                    </p>
                                    {rentalFormData.inwardType === 'purchase' && (
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            Total Amount: ₹{calculateRentalTotal().toFixed(2)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/rentals/products')}
                                className="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:bg-primary/50"
                            >
                                <Save className="w-5 h-5" />
                                {loading ? 'Saving...' : 'Save Inward'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Selling Accessories Tab */}
                {activeTab === 'selling' && (
                    <form onSubmit={submitSellingInward} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Received Date *
                                </label>
                                <input
                                    type="date"
                                    name="receivedDate"
                                    value={sellingFormData.receivedDate}
                                    onChange={handleSellingFormChange}
                                    required
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Supplier Invoice Number
                                </label>
                                <input
                                    type="text"
                                    name="supplierInvoiceNumber"
                                    value={sellingFormData.supplierInvoiceNumber}
                                    onChange={handleSellingFormChange}
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    placeholder="e.g., INV-2024-001"
                                />
                            </div>
                        </div>


                        <div className="mb-6 border-t border-gray-200 dark:border-slate-700 pt-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add Selling Item</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Product Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={currentSellingItem.name}
                                        onChange={handleCurrentSellingItemChange}
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        placeholder="e.g., Electrical Tape"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        SKU
                                    </label>
                                    <input
                                        type="text"
                                        name="sku"
                                        value={currentSellingItem.sku}
                                        onChange={handleCurrentSellingItemChange}
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        placeholder="e.g., SKU-001"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={currentSellingItem.quantity}
                                        onChange={handleCurrentSellingItemChange}
                                        min="1"
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Purchase Cost (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        name="purchaseCost"
                                        value={currentSellingItem.purchaseCost}
                                        onChange={handleCurrentSellingItemChange}
                                        min="0"
                                        step="0.01"
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Selling Price (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        name="sellingPrice"
                                        value={currentSellingItem.sellingPrice}
                                        onChange={handleCurrentSellingItemChange}
                                        min="0"
                                        step="0.01"
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Min Stock Level
                                    </label>
                                    <input
                                        type="number"
                                        name="minStockLevel"
                                        value={currentSellingItem.minStockLevel}
                                        onChange={handleCurrentSellingItemChange}
                                        min="0"
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={currentSellingItem.location}
                                        onChange={handleCurrentSellingItemChange}
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        placeholder="e.g., Shelf A1"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={addSellingItem}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Item
                                </button>
                            </div>
                        </div>

                        {/* Added Items List */}
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Added Items ({sellingItems.length})
                            </h2>
                            <div className="space-y-4">
                                {sellingItems.length === 0 ? (
                                    <p className="text-gray-600 dark:text-gray-400 text-center">No items added yet.</p>
                                ) : (
                                    sellingItems.map((item, index) => (
                                        <div key={index} className="border dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-medium text-gray-900 dark:text-white">
                                                    {item.name}
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSellingItem(index)}
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Qty:</span>
                                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">₹{item.purchaseCost}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Selling:</span>
                                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">₹{item.sellingPrice}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Total:</span>
                                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">₹{item.totalCost.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="border-t dark:border-slate-600 pt-4 mb-6">
                            <div className="flex justify-end">
                                <div className="text-right">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        Total Items: {sellingItems.length}
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Total Amount: ₹{calculateTotal(sellingItems).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/rentals/products')}
                                className="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:bg-primary/50"
                            >
                                <Save className="w-5 h-5" />
                                {loading ? 'Saving...' : 'Save Inward'}
                            </button>
                        </div>
                    </form>
                )}

                <ImportModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onImport={activeTab === 'rental' ? handleRentalImport : handleSellingImport}
                    title={activeTab === 'rental' ? "Import Bulk Rental Inward" : "Import Bulk Selling Accessories"}
                    description={activeTab === 'rental'
                        ? "Columns: Product Name, Quantity, Purchase Cost, Batch Number, Brand, Model, Condition, Notes"
                        : "Columns: Product Name, SKU, Quantity, Purchase Cost, Selling Price, Min Stock, Location"
                    }
                    sampleData={activeTab === 'rental'
                        ? [
                            {
                                "Product Name": "Sample Rental Item",
                                "Quantity": 5,
                                "Purchase Cost": 1000,
                                "Daily Rate": 50,
                                "Hourly Rate": 10,
                                "Monthly Rate": 1200,
                                "Batch Number": "BATCH001",
                                "Brand": "BrandName",
                                "Model Number": "MOD-123",
                                "Condition": "new",
                                "Notes": "Sample note"
                            }
                        ]
                        : [
                            {
                                "Product Name": "Sample Accessory",
                                "SKU": "ACC-001",
                                "Quantity": 20,
                                "Purchase Cost": 150,
                                "Selling Price": 250,
                                "Min Stock": 5,
                                "Location": "Shelf A1"
                            }
                        ]
                    }
                    fileName={activeTab === 'rental' ? "rental_inward_sample.csv" : "selling_inward_sample.csv"}
                />
            </div>
        </div>
    );
};

export default UnifiedInward;
