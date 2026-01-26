import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import rentalInwardService from '../../services/rentalInwardService';
import supplierService from '../../services/supplierService';
import rentalProductService from '../../services/rentalProductService';
import rentalCategoryService from '../../services/rentalCategoryService';

const RentalInward = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);

    const [formData, setFormData] = useState({
        receivedDate: new Date().toISOString().split('T')[0],
        supplierInvoiceNumber: '',
        notes: ''
    });

    // New state for current item being added
    const [currentItem, setCurrentItem] = useState({
        category: '', // Added category to current item state
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

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [productsData, categoriesData] = await Promise.all([
                rentalProductService.getAllRentalProducts(),
                rentalCategoryService.getAllRentalCategories()
            ]);
            setProducts(productsData.rentalProducts || []);
            setCategories(categoriesData.rentalCategories || []); // Correctly access the array
        } catch (err) {
            setError('Failed to load initial data');
            console.error('Error fetching data:', err);
        }
    };

    const handleFormChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleCurrentItemChange = (e) => {
        const { name, value } = e.target;
        setCurrentItem(prev => ({
            ...prev,
            [name]: value,
            // Reset product if category changes
            ...(name === 'category' ? { product: '' } : {})
        }));
    };

    const addItem = () => {
        if (!currentItem.product || !currentItem.quantity || !currentItem.purchaseCost || !currentItem.batchNumber) {
            setError('Please fill in all required fields for the current item.');
            return;
        }
        setError('');

        const product = products.find(p => p._id === currentItem.product);
        const newItem = {
            ...currentItem,
            productName: product?.name,
            totalCost: currentItem.quantity * parseFloat(currentItem.purchaseCost)
        };

        setItems([...items, newItem]);
        setCurrentItem({
            category: currentItem.category, // Keep category selected for convenience
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

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const calculateTotal = () => {
        return items.reduce((total, item) => {
            return total + (item.quantity * parseFloat(item.purchaseCost || 0));
        }, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        console.log('🔍 Starting rental inward submission...');

        if (items.length === 0) {
            setError('Please add at least one item.');
            return;
        }

        const validItems = items.filter(item => item.product && item.quantity > 0 && item.batchNumber && item.purchaseCost);
        if (validItems.length === 0) {
            setError('Please ensure all added items have a product, quantity, batch number, and purchase cost.');
            return;
        }

        try {
            setLoading(true);
            const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);

            const inwardData = {
                receivedDate: formData.receivedDate,
                supplierInvoiceNumber: formData.supplierInvoiceNumber,
                items: validItems.map(item => ({
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
                notes: formData.notes
            };

            console.log('📤 Sending inward data:', inwardData);

            const response = await rentalInwardService.createRentalInward(inwardData);
            console.log('✅ Rental inward created successfully:', response);

            setSuccess('Rental inward created successfully!');

            setFormData({
                receivedDate: new Date().toISOString().split('T')[0],
                notes: ''
            });
            setItems([]);
            setCurrentItem({
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

            setTimeout(() => {
                navigate('/rentals/inward-history');
            }, 1500);
        } catch (err) {
            console.error('❌ Error creating rental inward:', err);
            console.error('Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                statusText: err.response?.statusText
            });

            // Extract the most specific error message available
            const errorMessage = err.response?.data?.message
                || err.response?.data?.error
                || err.message
                || 'Failed to create rental inward. Please check the console for details.';

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Filter products based on selected category
    const filteredProducts = currentItem.category
        ? products.filter(p => p.category === currentItem.category || p.category?._id === currentItem.category)
        : products;

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Rental Product Inward
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Receive rental products into inventory
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

                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Received Date *
                            </label>
                            <input
                                type="date"
                                name="receivedDate"
                                value={formData.receivedDate}
                                onChange={handleFormChange}
                                required
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Supplier Invoice Number
                        </label>
                        <input
                            type="text"
                            name="supplierInvoiceNumber"
                            value={formData.supplierInvoiceNumber}
                            onChange={handleFormChange}
                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            placeholder="e.g., INV-2024-001"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleFormChange}
                            rows="2"
                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            placeholder="Additional notes..."
                        />
                    </div>

                    <div className="mb-6 border-t border-gray-200 dark:border-slate-700 pt-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add New Item</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">

                            {/* Category Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Rental Category
                                </label>
                                <select
                                    name="category"
                                    value={currentItem.category}
                                    onChange={handleCurrentItemChange}
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(cat => (
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
                                    value={currentItem.product}
                                    onChange={handleCurrentItemChange}
                                    required
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                >
                                    <option value="">Select Product</option>
                                    {filteredProducts.map(product => (
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
                                    value={currentItem.quantity}
                                    onChange={handleCurrentItemChange}
                                    min="1"
                                    required
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
                                    value={currentItem.purchaseCost}
                                    onChange={handleCurrentItemChange}
                                    min="0"
                                    step="0.01"
                                    required
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
                                    value={currentItem.batchNumber}
                                    onChange={handleCurrentItemChange}
                                    required
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    placeholder="e.g., BATCH-001"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Purchase Date
                                </label>
                                <input
                                    type="date"
                                    name="purchaseDate"
                                    value={currentItem.purchaseDate}
                                    onChange={handleCurrentItemChange}
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Brand
                                </label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={currentItem.brand}
                                    onChange={handleCurrentItemChange}
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    placeholder="e.g., Sony, Canon"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Model Number
                                </label>
                                <input
                                    type="text"
                                    name="modelNumber"
                                    value={currentItem.modelNumber}
                                    onChange={handleCurrentItemChange}
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
                                    value={currentItem.condition}
                                    onChange={handleCurrentItemChange}
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                >
                                    <option value="new">New</option>
                                    <option value="good">Good</option>
                                    <option value="fair">Fair</option>
                                </select>
                            </div>

                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Item Notes
                                </label>
                                <input
                                    type="text"
                                    name="notes"
                                    value={currentItem.notes}
                                    onChange={handleCurrentItemChange}
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    placeholder="Additional notes for this item..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                <Plus className="w-4 h-4" />
                                Add Item to List
                            </button>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Added Items
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {items.length === 0 ? (
                                <p className="text-gray-600 dark:text-gray-400 text-center">No items added yet.</p>
                            ) : (
                                items.map((item, index) => (
                                    <div key={index} className="border dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-medium text-gray-900 dark:text-white">
                                                {item.productName || 'Unknown Product'}
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="text-red-600 hover:text-red-800 dark:text-red-400"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                                                <span className="ml-2 font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 dark:text-gray-400">Purchase Cost:</span>
                                                <span className="ml-2 font-medium text-gray-900 dark:text-white">₹{item.purchaseCost}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 dark:text-gray-400">Batch:</span>
                                                <span className="ml-2 font-medium text-gray-900 dark:text-white">{item.batchNumber}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 dark:text-gray-400">Condition:</span>
                                                <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">{item.condition}</span>
                                            </div>
                                        </div>
                                        {item.notes && (
                                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                <span className="font-medium">Notes:</span> {item.notes}
                                            </div>
                                        )}
                                        <div className="mt-3 text-right">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Item Total: ₹{item.totalCost.toFixed(2)}
                                            </span>
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
                                    Total Items: {items.length}
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Total Amount: ₹{calculateTotal().toFixed(2)}
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
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? 'Saving...' : 'Save Inward'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RentalInward;

