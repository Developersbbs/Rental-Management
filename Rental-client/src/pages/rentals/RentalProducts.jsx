import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from '../../redux/features/auth/loginSlice';
import axios from 'axios';
import rentalProductService from '@/services/rentalProductService';
import rentalCategoryService from '@/services/rentalCategoryService';
import { Search, Plus, Edit2, Trash2, Save, X, Filter, Upload, Image as ImageIcon, Clock, DollarSign, Package, Layers, Wrench, Bell, RefreshCw } from 'lucide-react';
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

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [limit] = useState(12); // Items per page
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
    const [ownershipFilter, setOwnershipFilter] = useState(""); // New: filter by ownership type

    // File upload states
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Inline Category Creation state
    const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isSavingCategory, setIsSavingCategory] = useState(false);

    // Modal Tabs
    const [activeModalTab, setActiveModalTab] = useState('basic');

    useEffect(() => {
        if (token || localStorage.getItem('token')) {
            fetchProducts(1); // Reset to page 1 when filters change
            fetchCategories();
        }
    }, [token, searchTerm, categoryFilter, ownershipFilter]);

    useEffect(() => {
        if (token || localStorage.getItem('token')) {
            fetchProducts(currentPage);
        }
    }, [currentPage]);

    const fetchProducts = async (page = currentPage) => {
        setLoading(true);
        try {
            const data = await rentalProductService.getAllRentalProducts({
                search: searchTerm,
                category: categoryFilter,
                ownershipType: ownershipFilter,
                status: 'active',
                page: page,
                limit: limit
            });
            setProducts(data.rentalProducts || []);
            setTotalPages(data.totalPages || 1);
            setTotalProducts(data.total || 0);
            if (page !== currentPage) setCurrentPage(page);
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
        setShowNewCategoryForm(false);
        setNewCategoryName('');
        setActiveModalTab('basic');
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

    const handleQuickCategoryCreate = async () => {
        if (!newCategoryName.trim()) {
            toast.error('Please enter a category name');
            return;
        }

        setIsSavingCategory(true);
        try {
            const data = await rentalCategoryService.createRentalCategory({
                name: newCategoryName.trim(),
                status: 'active'
            });
            const newCategory = data.rentalCategory || data;
            toast.success('Category created successfully');

            // Refresh categories and select the new one
            await fetchCategories();
            setFormData(prev => ({ ...prev, category: newCategory._id }));
            setShowNewCategoryForm(false);
            setNewCategoryName('');
        } catch (error) {
            console.error('Error creating category:', error);
            toast.error(error.message || 'Failed to create category');
        } finally {
            setIsSavingCategory(false);
        }
    };

    if (loading && !products.length) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="container mx-auto">
            <div className="page-header">
                <div>
                    <h1 className="section-title">Rental Inventory</h1>
                    <p className="text-muted-foreground mt-1">Manage and track all your rental equipment</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => { fetchProducts(1); fetchCategories(); }}
                        disabled={loading}
                        className="shadow-sm bg-white dark:bg-slate-900"
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    {isSuperAdmin && (
                        <Button
                            onClick={() => { resetForm(); fetchCategories(); setShowModal(true); }}
                            className="shadow-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add Rental Product
                        </Button>
                    )}
                </div>
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
                            className="premium-input md:w-48"
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                        <select
                            value={ownershipFilter}
                            onChange={(e) => setOwnershipFilter(e.target.value)}
                            className="premium-input md:w-56"
                        >
                            <option value="">All Items</option>
                            <option value="owned">Inventory Products</option>
                            <option value="sub_rented">Vendor Products</option>
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

            {products.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No rental products found. Click "Add Rental Product" to create one.
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-sm">
                    <div className="text-sm text-muted-foreground">
                        Showing <span className="font-bold text-foreground">{(currentPage - 1) * limit + 1}</span> to <span className="font-bold text-foreground">{Math.min(currentPage * limit, totalProducts)}</span> of <span className="font-bold text-foreground">{totalProducts}</span> products
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || loading}
                            className="rounded-xl h-9 px-4"
                        >
                            Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => {
                                const pageNum = i + 1;
                                // Simple logic to show current, first, last, and pages around current
                                if (
                                    pageNum === 1 ||
                                    pageNum === totalPages ||
                                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                ) {
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? "default" : "outline"}
                                            size="icon"
                                            onClick={() => setCurrentPage(pageNum)}
                                            disabled={loading}
                                            className={cn(
                                                "h-9 w-9 rounded-xl transition-all",
                                                currentPage === pageNum ? "shadow-md shadow-primary/20" : "bg-transparent"
                                            )}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                } else if (
                                    (pageNum === 2 && currentPage > 3) ||
                                    (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                                ) {
                                    return <span key={pageNum} className="px-1 text-muted-foreground">...</span>;
                                }
                                return null;
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || loading}
                            className="rounded-xl h-9 px-4"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[150] p-4 transition-all duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-white/20 dark:border-slate-800">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-primary/5 to-transparent border-b dark:border-slate-800">
                            <div>
                                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400">
                                    {editingProduct ? 'Update Equipment' : 'New Equipment'}
                                </h2>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {editingProduct ? 'Modify existing rental equipment details' : 'Add new rental equipment to your inventory'}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Tabs Navigation */}
                        <div className="flex px-6 border-b dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                            {[
                                { id: 'basic', label: 'Basic Info', icon: <Package className="w-4 h-4" /> },
                                { id: 'pricing', label: 'Pricing', icon: <DollarSign className="w-4 h-4" /> },
                                { id: 'service', label: 'Service', icon: <Wrench className="w-4 h-4" /> },
                                { id: 'media', label: 'Media & Desc', icon: <ImageIcon className="w-4 h-4" /> },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveModalTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-all duration-200",
                                        activeModalTab === tab.id
                                            ? "border-primary text-primary"
                                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-200 dark:hover:border-slate-700"
                                    )}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-8">

                                {/* Basic Info Tab */}
                                {activeModalTab === 'basic' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                    Product Name <span className="text-destructive">*</span>
                                                </label>
                                                <Input
                                                    type="text"
                                                    required
                                                    placeholder="e.g., Sony A7III Camera"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="h-11 rounded-xl bg-gray-50/50 focus:bg-white dark:bg-slate-800/50 transition-all border-gray-200 dark:border-slate-700"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                        Category <span className="text-destructive">*</span>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                                                        className="text-primary hover:text-primary/80 text-xs flex items-center font-bold px-2 py-1 rounded-md transition-colors"
                                                    >
                                                        {showNewCategoryForm ? (
                                                            <><X className="w-3 h-3 mr-1" /> Close</>
                                                        ) : (
                                                            <><Plus className="w-3 h-3 mr-1" /> New Category</>
                                                        )}
                                                    </button>
                                                </div>

                                                {showNewCategoryForm ? (
                                                    <div className="flex gap-2 p-1 bg-primary/5 rounded-xl border border-primary/20 animate-in zoom-in-95">
                                                        <Input
                                                            placeholder="Category name..."
                                                            value={newCategoryName}
                                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                                            className="h-10 border-none bg-transparent focus-visible:ring-0"
                                                            autoFocus
                                                        />
                                                        <Button
                                                            type="button"
                                                            onClick={handleQuickCategoryCreate}
                                                            disabled={isSavingCategory}
                                                            className="h-10 rounded-lg px-3 flex-shrink-0"
                                                        >
                                                            {isSavingCategory ? (
                                                                <Clock className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Save className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <select
                                                        required
                                                        value={formData.category}
                                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                        className="w-full h-11 px-4 rounded-xl text-sm bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 outline-none focus:border-primary transition-all appearance-none"
                                                    >
                                                        <option value="">Select Category</option>
                                                        {categories.map(c => (
                                                            <option key={c._id} value={c._id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-200/50 dark:border-amber-800/30">
                                            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                                                Note: Stock quantity cannot be manually entered here. Use the <strong>Inward</strong> section to add stock through purchases or vendor rentals.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Pricing Tab */}
                                {activeModalTab === 'pricing' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {[
                                                { id: 'hourly', label: 'Hourly Rate', icon: <Clock className="w-4 h-4" /> },
                                                { id: 'daily', label: 'Daily Rate', icon: <Clock className="w-4 h-4" /> },
                                                { id: 'monthly', label: 'Monthly Rate', icon: <Clock className="w-4 h-4" /> },
                                            ].map((rate) => (
                                                <div key={rate.id} className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                        {rate.icon} {rate.label}
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₹</span>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={formData.rentalRate[rate.id]}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                rentalRate: { ...formData.rentalRate, [rate.id]: parseFloat(e.target.value) || 0 }
                                                            })}
                                                            className="h-10 pl-7 rounded-lg border-none bg-white dark:bg-slate-900 shadow-sm"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-2 max-w-xs">
                                            <label className="text-sm font-semibold flex items-center gap-2">
                                                Minimum Rental Hours
                                            </label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={formData.minRentalHours}
                                                onChange={(e) => setFormData({ ...formData, minRentalHours: parseInt(e.target.value) || 1 })}
                                                className="h-11 rounded-xl bg-gray-50/50 dark:bg-slate-800/50"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Service Tab */}
                                {activeModalTab === 'service' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                    Service Interval (Days)
                                                </label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    placeholder="e.g., 30 for monthly service"
                                                    value={formData.serviceInterval || ''}
                                                    onChange={(e) => setFormData({ ...formData, serviceInterval: e.target.value ? parseInt(e.target.value) : null })}
                                                    className="h-11 rounded-xl"
                                                />
                                                <p className="text-[11px] text-muted-foreground italic">Leave empty if no regular service is required.</p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                    Notification Alert (Days)
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={formData.serviceAlertDays}
                                                        onChange={(e) => setFormData({ ...formData, serviceAlertDays: parseInt(e.target.value) || 7 })}
                                                        className="h-11 rounded-xl w-32"
                                                    />
                                                    <span className="text-sm text-muted-foreground">days before due date</span>
                                                </div>
                                            </div>
                                        </div>

                                        {editingProduct && editingProduct.lastServiceDate && (
                                            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                    <Clock className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600/70 dark:text-blue-400/70">Last Service Recorded</p>
                                                    <p className="text-sm font-semibold">{new Date(editingProduct.lastServiceDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Media & Desc Tab */}
                                {activeModalTab === 'media' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="space-y-4">
                                            <label className="text-sm font-semibold flex items-center gap-2">
                                                Equipment Images
                                            </label>

                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                                {/* Upload Trigger Card */}
                                                <label className="cursor-pointer group relative flex flex-col items-center justify-center h-24 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-800 hover:border-primary/50 hover:bg-primary/5 transition-all outline-none">
                                                    <div className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
                                                        {uploading ? (
                                                            <Clock className="w-6 h-6 animate-spin text-primary" />
                                                        ) : (
                                                            <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                                                        )}
                                                        <span className="text-[10px] font-bold uppercase text-muted-foreground group-hover:text-primary">
                                                            {uploading ? '...' : 'Add'}
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        disabled={uploading}
                                                    />
                                                </label>

                                                {/* Previews */}
                                                {formData.images?.map((imageUrl, index) => (
                                                    <div key={index} className="relative h-24 rounded-2xl overflow-hidden border dark:border-slate-800 group shadow-sm bg-muted animate-in zoom-in-75">
                                                        <img src={imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))}
                                                                className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        {index === 0 && (
                                                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary/90 text-[8px] font-bold text-white rounded uppercase tracking-tighter">Cover</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold flex items-center gap-2">
                                                Equipment Description
                                            </label>
                                            <textarea
                                                rows="4"
                                                placeholder="Write a brief description about the equipment, its features, and included accessories..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full p-4 rounded-2xl text-sm bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 outline-none focus:border-primary transition-all resize-none min-h-[120px]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sticky Modal Footer */}
                            <div className="flex justify-between items-center px-8 py-6 border-t dark:border-slate-800 bg-white dark:bg-slate-900">
                                <div className="text-xs text-muted-foreground hidden sm:block">
                                    <span className="text-destructive font-bold">*</span> Indicates required field
                                </div>
                                <div className="flex gap-3 ml-auto">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setShowModal(false)}
                                        className="rounded-xl px-6 h-11"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="rounded-xl px-8 h-11 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95"
                                    >
                                        <Save className="w-5 h-5" />
                                        {editingProduct ? 'Update Equipment' : 'Publish Product'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RentalProducts;
