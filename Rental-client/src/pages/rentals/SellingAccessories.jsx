import React, { useState, useEffect } from 'react';
import { Plus, Search, Archive, Trash2, Edit2, Package, Tag, Save, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import productService from '../../services/productService';
import { Link } from 'react-router-dom';
import { selectUser } from '../../redux/features/auth/loginSlice';
import categoryService from '../../services/categoryService';

const SellingAccessories = () => {
    const user = useSelector(selectUser);
    const isSuperAdmin = user?.role === 'superadmin';
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '', // Was 'Accessories'
        quantity: 0,
        price: '',
        sku: '',
        minStockLevel: 5,
        location: '',
        isSellingAccessory: true
    });

    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            console.log('Fetching categories via categoryService...');
            console.log('Fetching categories via categoryService...');
            // Fetch ALL categories (active and inactive) so we can auto-activate if needed
            const data = await categoryService.getAllCategories(null);
            console.log('Categories fetched:', data);
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };


    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await productService.getAllProducts(); // Fetch all, will filter client sidebar
            // Filter strictly for selling accessories
            const accessories = (data.products || []).filter(p => p.isSellingAccessory === true);
            setProducts(accessories);
        } catch (error) {
            console.error('Error fetching accessories:', error);
            setError('Failed to fetch accessories');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        console.log('Submitting form data:', formData);
        console.log('Available categories:', categories);

        try {
            // Find 'Accessories' or 'Consumables' category (case-insensitive)
            let accessoriesCategory = categories.find(c =>
                c.name.toLowerCase() === 'accessories' ||
                c.name.toLowerCase() === 'consumables' ||
                c.name.toLowerCase().includes('accessories')
            );

            console.log('Found match:', accessoriesCategory);

            let categoryId;

            if (accessoriesCategory) {
                // If found but inactive, activate it
                if (accessoriesCategory.status !== 'active') {
                    console.log('Category found but inactive. Activating...');
                    try {
                        await categoryService.toggleCategoryStatus(accessoriesCategory.id, 'active');
                        console.log('Category activated.');
                    } catch (statusErr) {
                        console.error('Failed to activate category:', statusErr);
                        // Try to proceed anyway, or fallback to creating new
                    }
                }
                categoryId = accessoriesCategory.id;
            } else {
                // If not found, create a new 'Accessories' category
                console.log("No 'Accessories' category found. Creating one...");
                try {
                    const newCat = await categoryService.createCategory({
                        name: 'Accessories',
                        status: 'active'
                    });
                    console.log('New category created:', newCat);
                    // Handle response structure differences if any (usually returns the created obj)
                    categoryId = newCat._id || newCat.id;

                    // Refresh categories list for future
                    fetchCategories();
                } catch (createErr) {
                    console.error('Failed to create new category:', createErr);
                    // Fallback to first available active category if creation fails
                    const firstActive = categories.find(c => c.status === 'active');
                    if (firstActive) {
                        categoryId = firstActive.id;
                        console.log('Fallback to first active category:', firstActive.name);
                    }
                }
            }

            // Final check
            if (!categoryId) {
                // Last ditch effort: pick ANY active category
                const anyActive = categories.find(c => c.status === 'active');
                if (anyActive) {
                    categoryId = anyActive.id;
                }
            }

            console.log('Final Selected Category ID:', categoryId);

            if (!categoryId) {
                throw new Error("Could not find, activate, or create a valid category. Please manually check Category Management.");
            }

            const data = {
                ...formData,
                category: categoryId, // Auto-assigned
                isSellingAccessory: true, // Enforce this
                isRental: false // Enforce not rental
            };

            // Remove supplier to avoid backend validation error if it's optional/removed
            delete data.supplier;

            console.log('Final payload to server:', data);

            if (editingProduct) {
                await productService.updateProduct(editingProduct._id, data);
                setSuccess('Accessory updated successfully');
            } else {
                await productService.createProduct(data);
                setSuccess('Accessory created successfully');
            }

            setShowModal(false);
            resetForm();
            fetchProducts();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Submit error:', err);
            setError(err.message || 'Operation failed');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            category: product.category ? (typeof product.category === 'object' ? product.category._id : product.category) : '',
            quantity: product.quantity,
            price: product.price,
            sku: product.sku || '',
            minStockLevel: product.minStockLevel || 5,
            location: product.location || '',
            isSellingAccessory: true
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this accessory?')) {
            try {
                await productService.deleteProduct(id);
                setSuccess('Accessory deleted successfully');
                fetchProducts();
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                setError('Failed to delete accessory');
                setTimeout(() => setError(''), 3000);
            }
        }
    };

    const resetForm = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            description: '',
            category: '',
            quantity: 0,
            price: '',
            sku: '',
            minStockLevel: 5,
            location: '',
            isSellingAccessory: true
        });
    };

    if (loading) return <div className="p-6 text-center">Loading...</div>;

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Tag className="w-6 h-6 mr-2" /> Selling Accessories
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Manage consumable items for sale (e.g., Tapes, Batteries)</p>
                </div>
                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search accessories..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    {isSuperAdmin && (
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm"
                        >
                            <Plus className="w-5 h-5" /> Add Accessory
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-700/50 border-b dark:border-slate-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product Name</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">SKU</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                                {isSuperAdmin && <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <Package className="w-12 h-12 text-gray-300 mb-2" />
                                            <p>No selling accessories found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                                            {product.description && <div className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</div>}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{product.sku || '-'}</td>
                                        <td className="p-4">
                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.quantity <= (product.minStockLevel || 5)
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                }`}>
                                                {product.quantity} units
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">₹{product.price}</td>
                                        {isSuperAdmin && (
                                            <td className="p-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product._id)}
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[150] p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg my-8">
                        <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {editingProduct ? 'Edit Accessory' : 'Add New Accessory'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring"
                                    placeholder="e.g. Electrical Tape"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring"
                                    rows="2"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                                    <input
                                        type="text"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Quantity *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min. Stock Level</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.minStockLevel}
                                        onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0 })}
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selling Price (₹) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t dark:border-slate-700 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 flex items-center transition-colors shadow-sm"
                                >
                                    <Save className="w-4 h-4 mr-2" /> Save Accessory
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )}
        </div >
    );
};

export default SellingAccessories;
