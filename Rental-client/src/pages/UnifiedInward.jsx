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

const UnifiedInward = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('rental'); // 'rental' or 'selling'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Common data
    const [suppliers, setSuppliers] = useState([]);

    // Rental specific
    const [rentalProducts, setRentalProducts] = useState([]);
    const [rentalCategories, setRentalCategories] = useState([]);
    const [rentalItems, setRentalItems] = useState([]);
    const [rentalFormData, setRentalFormData] = useState({
        receivedDate: new Date().toISOString().split('T')[0],
        supplierInvoiceNumber: '',
        notes: ''
    });
    const [currentRentalItem, setCurrentRentalItem] = useState({
        category: '',
        product: '',
        quantity: 1,
        purchaseCost: '',
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
            const [suppliersData, rentalProductsData, rentalCategoriesData, sellingCategoriesData] = await Promise.all([
                supplierService.getAllSuppliers(),
                rentalProductService.getAllRentalProducts(),
                rentalCategoryService.getAllRentalCategories(),
                categoryService.getAllCategories()
            ]);

            setSuppliers(suppliersData.suppliers || suppliersData.docs || suppliersData || []);
            setRentalProducts(rentalProductsData.rentalProducts || []);
            setRentalCategories(rentalCategoriesData.rentalCategories || []);
            setSellingCategories(sellingCategoriesData || []);
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
        setCurrentRentalItem(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'category' ? { product: '' } : {})
        }));
    };

    const addRentalItem = () => {
        if (!currentRentalItem.product || !currentRentalItem.quantity || !currentRentalItem.purchaseCost || !currentRentalItem.batchNumber) {
            setError('Please fill in all required fields for the rental item.');
            return;
        }
        setError('');

        const product = rentalProducts.find(p => p._id === currentRentalItem.product);
        const newItem = {
            ...currentRentalItem,
            productName: product?.name,
            totalCost: currentRentalItem.quantity * parseFloat(currentRentalItem.purchaseCost)
        };

        setRentalItems([...rentalItems, newItem]);
        setCurrentRentalItem({
            category: currentRentalItem.category,
            product: '',
            quantity: 1,
            purchaseCost: '',
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

    const submitRentalInward = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (rentalItems.length === 0) {
            setError('Please add at least one rental item.');
            return;
        }

        try {
            setLoading(true);
            const totalAmount = rentalItems.reduce((sum, item) => sum + item.totalCost, 0);

            const inwardData = {
                receivedDate: rentalFormData.receivedDate,
                supplierInvoiceNumber: rentalFormData.supplierInvoiceNumber,
                items: rentalItems.map(item => ({
                    product: item.product,
                    quantity: item.quantity,
                    purchaseCost: parseFloat(item.purchaseCost),
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
                notes: ''
            });
            setRentalItems([]);
            setCurrentRentalItem({
                category: '',
                product: '',
                quantity: 1,
                purchaseCost: '',
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
            setError(err.response?.data?.message || err.message || 'Failed to create rental inward');
        } finally {
            setLoading(false);
        }
    };

    // Selling handlers
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
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">₹{item.purchaseCost}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Batch:</span>
                                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{item.batchNumber}</span>
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
                                        Total Items: {rentalItems.length}
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Total Amount: ₹{calculateTotal(rentalItems).toFixed(2)}
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
            </div>
        </div>
    );
};

export default UnifiedInward;
