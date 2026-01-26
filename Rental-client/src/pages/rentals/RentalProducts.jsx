import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from '../../redux/features/auth/loginSlice';
import axios from 'axios';
import rentalProductService from '@/services/rentalProductService';
import rentalCategoryService from '@/services/rentalCategoryService';
import { Search, Plus, Edit2, Trash2, Save, X, Filter, Upload, Image as ImageIcon, Clock, DollarSign, Package, Layers, Wrench, Bell } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const RentalProducts = () => {
    const navigate = useNavigate();

    // Redux state (only for token)
    const token = useSelector((state) => state.login?.token || null);
    const user = useSelector(selectUser);
    const isSuperAdmin = user?.role === 'superadmin';

    // Local state
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    // Form states
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        images: [], // Changed from image string to images array
        category: "",
        rentalRate: { hourly: 0, daily: 0, monthly: 0 },
        minRentalHours: 1,
        specifications: {},
        status: 'active',
        // Service tracking fields
        serviceInterval: null,
        serviceAlertDays: 7,
        lastServiceDate: null
    });

    // Filter and search states
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");

    // File upload states
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Fetch data if token is present in state OR localStorage
        // This solves the issue where products don't show immediately on refresh
        // because Redux state hydration might take a moment.
        if (token || localStorage.getItem('token')) {
            fetchProducts();
            fetchCategories();
        }
    }, [token]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await rentalProductService.getAllRentalProducts({
                search: searchTerm,
                category: categoryFilter,
                status: 'active' // Optional: filter by active status
            });
            setProducts(data.rentalProducts || []);
        } catch (error) {
            console.error('Error fetching rental products:', error);
            toast.error(error.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await rentalCategoryService.getAllRentalCategories();
            setCategories(Array.isArray(data) ? data : (data.rentalCategories || data.categories || data.data || []));
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
        }
    };

    // Filter logic (client-side filtering for immediate feedback, though API supports it too)
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = !categoryFilter || (p.category?._id === categoryFilter || p.category === categoryFilter);
            return matchesSearch && matchesCategory;
        });
    }, [products, searchTerm, categoryFilter]);

    // Image upload handler
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formDataUpload = new FormData();
        formDataUpload.append('image', file);

        setUploading(true);
        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            };
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/upload/image`, formDataUpload, config);
            // Append to images array
            setFormData(prev => ({ ...prev, images: [...prev.images, data.imageUrl] }));
            toast.success('Image uploaded successfully');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.category) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            if (editingProduct) {
                await rentalProductService.updateRentalProduct(editingProduct._id, formData);
                toast.success('Rental product updated successfully');
            } else {
                await rentalProductService.createRentalProduct(formData);
                toast.success('Rental product created successfully');
            }
            setShowModal(false);
            resetForm();
            fetchProducts(); // Refresh list
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error(error.message || 'Failed to save product');
        }
    };

    const handleEdit = (product) => {
        fetchCategories();
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            images: product.images || [],
            category: product.category?._id || product.category,
            rentalRate: product.rentalRate || { hourly: 0, daily: 0 },
            minRentalHours: product.minRentalHours || 1,
            specifications: product.specifications || {},
            status: product.status || 'active',
            serviceInterval: product.serviceInterval || null,
            serviceAlertDays: product.serviceAlertDays || 7,
            lastServiceDate: product.lastServiceDate || null
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this rental product?')) {
            try {
                await rentalProductService.deleteRentalProduct(id);
                toast.success('Rental product deleted successfully');
                fetchProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
                toast.error(error.message || 'Failed to delete product');
            }
        }
    };

    const resetForm = () => {
        setEditingProduct(null);
        setFormData({
            name: "",
            description: "",
            images: [],
            category: "",
            rentalRate: { hourly: 0, daily: 0 },
            minRentalHours: 1,
            specifications: {},
            status: 'active',
            serviceInterval: null,
            serviceAlertDays: 7,
            lastServiceDate: null
        });
    };

    if (loading && !products.length) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="container mx-auto">
            <div className="page-header">
                <div>
                    <h1 className="section-title">Rental Inventory</h1>
                    <p className="text-muted-foreground mt-1">Manage and track all your rental equipment</p>
                </div>
                {isSuperAdmin && (
                    <Button
                        onClick={() => { resetForm(); fetchCategories(); setShowModal(true); }}
                        className="shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Rental Product
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Card className="mb-8 border-none bg-muted/20 shadow-none">
                <CardContent className="p-4 pt-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                type="text"
                                placeholder="Search rental products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="premium-input md:w-64"
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                    <Card key={product._id} className="overflow-hidden group">
                        <div className="relative h-48 bg-muted/30">
                            {product.images && product.images.length > 0 ? (
                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <ImageIcon className="w-12 h-12 opacity-20" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-2 transition-all duration-200">
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={() => navigate(`/rentals/products/${product._id}/items`)}
                                    className="h-8 w-8 bg-white/90 dark:bg-slate-800/90 text-green-600 hover:text-green-700 shadow-sm backdrop-blur"
                                    title="Manage Items"
                                >
                                    <Package className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={() => navigate(`/rentals/products/${product._id}/accessories`)}
                                    className="h-8 w-8 bg-white/90 dark:bg-slate-800/90 text-purple-600 hover:text-purple-700 shadow-sm backdrop-blur"
                                    title="Manage Accessories"
                                >
                                    <Layers className="w-4 h-4" />
                                </Button>
                                {isSuperAdmin && (
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={() => handleEdit(product)}
                                        className="h-8 w-8 bg-white/90 dark:bg-slate-800/90 text-primary hover:text-primary shadow-sm backdrop-blur"
                                        title="Edit Product"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                )}
                                {isSuperAdmin && (
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={() => handleDelete(product._id)}
                                        className="h-8 w-8 bg-white/90 dark:bg-slate-800/90 text-destructive hover:text-destructive shadow-sm backdrop-blur"
                                        title="Delete Product"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="flex justify-between items-start mb-4">
                                <div className="min-w-0">
                                    <h3 className="font-bold text-lg truncate pr-2" title={product.name}>{product.name}</h3>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{product.category?.name || 'Uncategorized'}</p>
                                </div>
                                <span className={cn(
                                    "px-2 py-1 text-[10px] font-bold uppercase rounded-full border",
                                    product.availableQuantity > 0
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-destructive/10 text-destructive border-destructive/20'
                                )}>
                                    {product.availableQuantity > 0 ? `${product.availableQuantity} in stock` : 'Out of stock'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                                <div className="text-center p-2 rounded-lg bg-muted/30">
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Hourly</p>
                                    <p className="text-sm font-bold">₹{product.rentalRate?.hourly || 0}</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-primary/5">
                                    <p className="text-[10px] text-primary/60 uppercase font-semibold mb-0.5">Daily</p>
                                    <p className="text-sm font-bold text-primary">₹{product.rentalRate?.daily || 0}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredProducts.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No rental products found. Click "Add Rental Product" to create one.
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingProduct ? 'Edit Rental Product' : 'Add Rental Product'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Basic Info */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name *</label>
                                            <Input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                                            <select
                                                required
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="premium-input"
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(c => (
                                                    <option key={c._id} value={c._id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Stock</label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={editingProduct ? editingProduct.totalQuantity : 0}
                                                readOnly
                                                className="bg-muted cursor-not-allowed"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Stock is managed via Inward process.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Rental Details */}
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-4">
                                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center">
                                                <DollarSign className="w-4 h-4 mr-2" /> Rental Rates
                                            </h3>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hourly Rate (₹)</label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={formData.rentalRate.hourly}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        rentalRate: { ...formData.rentalRate, hourly: parseFloat(e.target.value) }
                                                    })}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Daily Rate (₹)</label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={formData.rentalRate.daily}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        rentalRate: { ...formData.rentalRate, daily: parseFloat(e.target.value) }
                                                    })}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Rate (₹)</label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={formData.rentalRate.monthly || 0}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        rentalRate: { ...formData.rentalRate, monthly: parseFloat(e.target.value) || 0 }
                                                    })}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Rental Hours</label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={formData.minRentalHours}
                                                    onChange={(e) => setFormData({ ...formData, minRentalHours: parseInt(e.target.value) })}
                                                />
                                            </div>
                                        </div>

                                        {/* Service Tracking Section */}
                                        <div className="bg-green-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-4">
                                            <h3 className="font-semibold text-green-900 dark:text-green-100 flex items-center">
                                                <Wrench className="w-4 h-4 mr-2" /> Service Tracking
                                            </h3>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Service Interval (Days)
                                                </label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    placeholder="e.g., 30, 90, 180"
                                                    value={formData.serviceInterval || ''}
                                                    onChange={(e) => setFormData({ ...formData, serviceInterval: e.target.value ? parseInt(e.target.value) : null })}
                                                />
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    How often this product needs service (e.g., every 30 days)
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Alert Before (Days)
                                                </label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={formData.serviceAlertDays}
                                                    onChange={(e) => setFormData({ ...formData, serviceAlertDays: parseInt(e.target.value) || 7 })}
                                                />
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Show alert this many days before service is due
                                                </p>
                                            </div>

                                            {editingProduct && editingProduct.lastServiceDate && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Last Service Date
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={new Date(editingProduct.lastServiceDate).toLocaleDateString()}
                                                        readOnly
                                                        className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-slate-600 dark:border-slate-500 dark:text-gray-300 cursor-not-allowed"
                                                    />
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Updated automatically when service is recorded
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Images</label>

                                            {/* Display uploaded images */}
                                            {formData.images && formData.images.length > 0 && (
                                                <div className="grid grid-cols-3 gap-3 mb-4">
                                                    {formData.images.map((imageUrl, index) => (
                                                        <div key={index} className="relative group">
                                                            <img
                                                                src={imageUrl}
                                                                alt={`Product ${index + 1}`}
                                                                className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (window.confirm('Remove this image?')) {
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            images: prev.images.filter((_, i) => i !== index)
                                                                        }));
                                                                    }
                                                                }}
                                                                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                                title="Remove image"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Upload button */}
                                            <label className="cursor-pointer bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 px-4 py-3 rounded-lg flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-500 transition-colors">
                                                <Upload className="w-4 h-4 mr-2" />
                                                {uploading ? 'Uploading...' : 'Upload Image'}
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    disabled={uploading}
                                                />
                                            </label>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                You can upload multiple images. Hover over an image to remove it.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <textarea
                                        rows="3"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="premium-input min-h-[80px] py-3"
                                    />
                                </div>

                            </div>

                            <div className="flex justify-end gap-3 p-6 border-t dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-xl">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    <Save className="w-4 h-4 mr-2" />
                                    {editingProduct ? 'Update Product' : 'Create Product'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RentalProducts;
