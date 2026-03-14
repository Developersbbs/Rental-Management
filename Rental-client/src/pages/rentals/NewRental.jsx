import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, Calendar, User, Package, DollarSign, Save, X,
    AlertCircle, ChevronRight, ChevronLeft, Check, ShoppingCart,
    Info, Trash2, IndianRupee, Clock, ChevronDown
} from 'lucide-react';
import { toast } from 'react-toastify';
import rentalCustomerService from '../../services/rentalCustomerService';
import rentalProductService from '../../services/rentalProductService';
import rentalService from '../../services/rentalService';
import rentalInventoryItemService from '../../services/rentalInventoryItemService';
import rentalCategoryService from '../../services/rentalCategoryService';
import productService from '../../services/productService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const STEPS = [
    { id: 1, title: 'Customer', description: 'Select customer & time', icon: User },
    { id: 2, title: 'Inventory', description: 'Add products & extras', icon: Package },
    { id: 3, title: 'Review', description: 'Payment & finalize', icon: ShoppingCart },
];

const NewRental = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        customerId: '',
        items: [],
        outTime: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16), // Default to local current time
        expectedReturnTime: '',
        advancePayment: 0,
        accessoriesPayment: 0,
        notes: ''
    });

    const [itemInput, setItemInput] = useState({
        productId: '',
        productItemId: '',
        quantity: 1,
        rentType: 'daily',
        rentAtTime: 0
    });

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
    const [availableItems, setAvailableItems] = useState([]);

    const [sellingAccessories, setSellingAccessories] = useState([]);
    const [selectedSellingAccessoryId, setSelectedSellingAccessoryId] = useState('');
    const [sellingQuantity, setSellingQuantity] = useState(1);
    const [soldItemsCart, setSoldItemsCart] = useState([]);

    const [showPendingModal, setShowPendingModal] = useState(false);
    const [pendingDetails, setPendingDetails] = useState(null);

    // Quick Customer Creation
    const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
    const [quickCustomerFormData, setQuickCustomerFormData] = useState({
        name: '',
        phone: '',
        customerType: 'individual',
        referral: { isGuest: true, source: '', details: '' }
    });
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

    // Filtered customers for search
    const [customerSearch, setCustomerSearch] = useState('');
    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch)
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customersData, productsData, categoriesData, allProductsData] = await Promise.all([
                    rentalCustomerService.getAllRentalCustomers({ limit: 1000 }), // Get all customers
                    rentalProductService.getAllRentalProducts({ status: 'active' }),
                    rentalCategoryService.getAllRentalCategories(),
                    productService.getAllProducts()
                ]);

                // Filter out blocked customers
                const allCustomers = customersData.rentalCustomers || [];
                const activeCustomers = allCustomers.filter(c => c.status !== 'blocked');

                setCustomers(activeCustomers);
                setProducts(productsData.rentalProducts || []);
                setCategories(categoriesData.rentalCategories || []);

                // Filter for selling accessories (Handle various response formats)
                const allProducts = Array.isArray(allProductsData)
                    ? allProductsData
                    : (allProductsData.products || allProductsData.docs || []);

                const accessories = allProducts.filter(p => p.isSellingAccessory === true);
                setSellingAccessories(accessories);
            } catch (err) {
                toast.error('Failed to load initial data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Fetch available items when a product is selected
    useEffect(() => {
        if (itemInput.productId) {
            const fetchItems = async () => {
                try {
                    const product = products.find(p => p._id === itemInput.productId);
                    if (!product) return; // Guard against product not found

                    setSelectedProduct(product);

                    // Fetch available inventory items
                    const items = await rentalInventoryItemService.getItemsByRentalProduct(itemInput.productId);
                    setAvailableItems(items.filter(i => i.status === 'available' || i.status === 'damaged' || i.status === 'maintenance'));

                    // Set default rent price
                    setItemInput(prev => ({
                        ...prev,
                        rentAtTime: product.rentalRate ? (product.rentalRate[prev.rentType] || 0) : 0
                    }));
                } catch (err) {
                    console.error(err);
                }
            };
            fetchItems();
        } else {
            setAvailableItems([]);
            setSelectedProduct(null);
        }
    }, [itemInput.productId, products]);

    const handleAddItem = () => {
        // Ensure a product is selected
        if (!itemInput.productId) {
            toast.error('Please select a product');
            return;
        }

        const product = products.find(p => p._id === itemInput.productId);
        if (!product) return;

        if (selectedInventoryItem && selectedInventoryItem.status === 'damaged') {
            toast.error(`Cannot add damaged item: ${selectedInventoryItem.uniqueIdentifier}`);
            return;
        }

        const selectedItemId = itemInput.productItemId || itemInput.productId;

        const newItem = {
            product,
            productId: product._id,
            productItemId: selectedItemId,
            rentType: itemInput.rentType,
            rentAtTime: parseFloat(itemInput.rentAtTime),
            quantity: parseInt(itemInput.quantity),
            accessories: selectedInventoryItem ? selectedInventoryItem.accessories : []
        };

        // Use functional update to avoid stale state
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));

        // Reset item input fields
        setItemInput({
            productId: '',
            productItemId: '',
            quantity: 1,
            rentType: 'daily',
            rentAtTime: 0
        });
        setSelectedProduct(null);
        setSelectedInventoryItem(null);
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    // Selling Accessories Handlers
    const handleAddSoldItem = () => {
        if (!selectedSellingAccessoryId) return;

        const accessory = sellingAccessories.find(a => a._id === selectedSellingAccessoryId);
        if (!accessory) return;

        if (accessory.quantity < sellingQuantity) {
            toast.error(`Insufficient stock for ${accessory.name}. Available: ${accessory.quantity}`);
            return;
        }

        const newItem = {
            productId: accessory._id,
            name: accessory.name,
            quantity: parseInt(sellingQuantity),
            price: accessory.price,
            total: accessory.price * parseInt(sellingQuantity)
        };

        setSoldItemsCart(prev => [...prev, newItem]);
        setSelectedSellingAccessoryId('');
        setSellingQuantity(1);
    };

    const handleRemoveSoldItem = (index) => {
        setSoldItemsCart(prev => prev.filter((_, i) => i !== index));
    };

    const soldItemsTotal = soldItemsCart.reduce((sum, item) => sum + item.total, 0);

    // Sync accessoriesPayment with soldItemsTotal
    useEffect(() => {
        setFormData(prev => ({ ...prev, accessoriesPayment: soldItemsTotal }));
    }, [soldItemsTotal]);

    const handleCustomerChange = async (customerId) => {
        setFormData(prev => ({ ...prev, customerId }));

        if (!customerId) return;

        const selectedCustomer = customers.find(c => c._id === customerId);
        if (!selectedCustomer) return;

        try {
            // Check for active rentals (pending items)
            // Note: backend returns array of rentals
            const activeRentals = await rentalService.getAllRentals({
                customerId,
                status: 'active'
            });

            // Check for pending bills
            // We'll check for 'pending' and 'partial' status
            const [pendingBillsResponse, partialBillsResponse] = await Promise.all([
                rentalService.getRentalBills({ customerId, paymentStatus: 'pending' }),
                rentalService.getRentalBills({ customerId, paymentStatus: 'partial' })
            ]);

            const pendingBills = [
                ...(pendingBillsResponse.bills || []),
                ...(partialBillsResponse.bills || [])
            ];

            // Process active rentals into a flat list of items
            const pendingItems = [];
            if (activeRentals && Array.isArray(activeRentals)) {
                activeRentals.forEach(rental => {
                    if (rental.items && Array.isArray(rental.items)) {
                        rental.items.forEach(ri => {
                            const productName = ri.item?.rentalProductId?.name || 'Unknown Product';
                            const identifier = ri.item?.uniqueIdentifier || '';
                            pendingItems.push({
                                itemName: `${productName} (${identifier})`,
                                quantity: 1,
                                rentalDate: rental.outTime,
                                rentalId: rental.rentalId
                            });
                        });
                    }
                });
            }

            if (pendingBills.length > 0 || pendingItems.length > 0) {
                setPendingDetails({
                    customerName: selectedCustomer.name,
                    pendingBills,
                    pendingItems
                });
                setShowPendingModal(true);
            }

        } catch (err) {
            console.error("Error checking pending info", err);
        }
    };

    const handleQuickCustomerSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsCreatingCustomer(true);
            const response = await rentalCustomerService.createRentalCustomer(quickCustomerFormData);
            const newCustomer = response.rentalCustomer;

            // Add to local customers list
            setCustomers(prev => [...prev, newCustomer]);

            // Select the new customer
            setFormData(prev => ({ ...prev, customerId: newCustomer._id }));

            toast.success('Customer created and selected!');
            setShowQuickCustomerModal(false);
            setQuickCustomerFormData({
                name: '',
                phone: '',
                customerType: 'individual',
                referral: { isGuest: true, source: '', details: '' }
            });
            setCustomerSearch('');
        } catch (err) {
            toast.error(err.message || 'Failed to create customer');
        } finally {
            setIsCreatingCustomer(false);
        }
    };

    const nextStep = () => {
        if (currentStep === 1 && !formData.customerId) {
            toast.warning('Please select a customer first');
            return;
        }
        if (currentStep === 1 && !formData.outTime) {
            toast.warning('Rental start time is required');
            return;
        }
        if (currentStep === 2 && formData.items.length === 0) {
            toast.warning('Please add at least one item');
            return;
        }
        setCurrentStep(prev => Math.min(prev + 1, 3));
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const totalRentalRate = formData.items.reduce((sum, item) => sum + item.rentAtTime, 0);
    const totalDue = totalRentalRate + soldItemsTotal - formData.advancePayment;

    const OrderSummary = ({ className }) => (
        <Card className={cn("sticky top-24 border-primary/20 bg-primary/[0.02]", className)}>
            <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" /> Order Summary
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Rental Items ({formData.items.length})</p>
                    {formData.items.length === 0 ? (
                        <p className="text-sm italic text-muted-foreground px-1">No items added</p>
                    ) : (
                        <div className="max-h-40 overflow-y-auto pr-1 custom-scrollbar space-y-1.5">
                            {formData.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start text-sm bg-background border border-border p-2 rounded-lg">
                                    <div className="min-w-0">
                                        <p className="font-semibold truncate">{item.product.name}</p>
                                        <p className="text-[10px] text-muted-foreground capitalize">{item.rentType} @ ₹{item.rentAtTime}</p>
                                    </div>
                                    <Button
                                        variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                                        onClick={() => handleRemoveItem(idx)}
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Selling Items */}
                {soldItemsCart.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Consumables ({soldItemsCart.length})</p>
                        <div className="max-h-32 overflow-y-auto pr-1 custom-scrollbar space-y-1.5">
                            {soldItemsCart.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm px-1">
                                    <p className="truncate flex-1 pr-2">{item.name} <span className="text-muted-foreground">x{item.quantity}</span></p>
                                    <p className="font-semibold">₹{item.total}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Rental Subtotal</span>
                        <span className="font-bold">₹{totalRentalRate}</span>
                    </div>
                    {soldItemsTotal > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground font-medium">Accessories</span>
                            <span className="font-bold">₹{soldItemsTotal}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Advance Paid</span>
                        <span className="font-bold text-green-600">-₹{formData.advancePayment || 0}</span>
                    </div>

                    <div className="bg-primary/10 p-3 rounded-xl flex justify-between items-center mt-2">
                        <span className="font-bold text-primary">Balance Due</span>
                        <span className="text-xl font-black text-primary">₹{totalDue}</span>
                    </div>
                </div>
            </CardContent>
            {currentStep === 3 && (
                <CardFooter>
                    <Button
                        onClick={handleSubmit}
                        className="w-full h-12 text-lg shadow-lg hover:shadow-primary/20"
                        disabled={formData.items.length === 0 || !formData.customerId}
                    >
                        <Save className="w-5 h-5 mr-2" /> Complete Rental
                    </Button>
                </CardFooter>
            )}
        </Card>
    );

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        try {
            const rentalData = {
                customerId: formData.customerId,
                items: formData.items.map(item => ({
                    item: item.productItemId || item.productId,
                    rentAtTime: item.rentAtTime,
                    rentType: item.rentType,
                    accessories: item.accessories ? item.accessories.map(acc => ({
                        accessoryId: acc.accessoryId,
                        name: acc.name,
                        serialNumber: acc.serialNumber,
                        checkedOutCondition: acc.condition,
                        status: acc.isVerified === false ? 'missing' : 'with_item'
                    })).filter(acc => acc.status === 'with_item') : []
                })),
                outTime: formData.outTime || null,
                expectedReturnTime: formData.expectedReturnTime || null,
                advancePayment: parseFloat(formData.advancePayment) || 0,
                accessoriesPayment: parseFloat(formData.accessoriesPayment) || 0,
                notes: formData.notes,
                soldItems: soldItemsCart
            };

            await rentalService.createRental(rentalData);
            toast.success('Rental created successfully!');

            setFormData({
                customerId: '',
                items: [],
                outTime: '',
                expectedReturnTime: '',
                advancePayment: 0,
                accessoriesPayment: 0,
                notes: ''
            });
            setSoldItemsCart([]);

            setTimeout(() => {
                navigate('/rentals/active');
            }, 1500);
        } catch (err) {
            toast.error(err.message || 'Failed to create rental');
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <Card className="border-none shadow-none bg-transparent">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle className="text-2xl">Customer Information</CardTitle>
                                <CardDescription>Search for an existing customer and set the rental timeline</CardDescription>
                            </CardHeader>
                            <CardContent className="px-0 space-y-6">
                                <div className="relative">
                                    <label className="text-sm font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Select Customer</label>
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            placeholder="Type name or phone number..."
                                            className="pl-11 h-12 text-lg rounded-xl border-border focus:ring-primary/20 shadow-sm"
                                            value={customerSearch}
                                            onChange={(e) => setCustomerSearch(e.target.value)}
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            {customerSearch.length > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg"
                                                    onClick={() => setCustomerSearch('')}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-9 px-3 border-primary/20 text-primary hover:bg-primary/5 font-bold"
                                                onClick={() => setShowQuickCustomerModal(true)}
                                            >
                                                <Plus className="w-4 h-4 mr-1" /> New
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Dropdown Results */}
                                    {customerSearch.length > 0 && (
                                        <div className="absolute z-[100] w-full mt-2 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                                {filteredCustomers.length === 0 ? (
                                                    <div className="p-8 text-center">
                                                        <User className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                                                        <p className="text-sm text-muted-foreground font-medium">No customers found</p>
                                                    </div>
                                                ) : (
                                                    filteredCustomers.map(c => (
                                                        <div
                                                            key={c._id}
                                                            onClick={() => {
                                                                handleCustomerChange(c._id);
                                                                setCustomerSearch(c.name); // Fill input with name
                                                                // We keep the dropdown open or close it? usually close it.
                                                                // But the user might want to see selection. 
                                                                // Let's clear search to "close" it effectively if we check customerSearch.length
                                                                setCustomerSearch('');
                                                            }}
                                                            className={cn(
                                                                "flex items-center p-4 cursor-pointer transition-colors border-b border-border last:border-0 hover:bg-primary/[0.03]",
                                                                formData.customerId === c._id ? "bg-primary/[0.05]" : "bg-card"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-colors",
                                                                formData.customerId === c._id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                                            )}>
                                                                <User className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-foreground truncate">{c.name}</p>
                                                                <p className="text-xs text-muted-foreground">{c.phone}</p>
                                                            </div>
                                                            {formData.customerId === c._id && (
                                                                <Check className="w-5 h-5 text-primary" />
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Selected Customer Card (Persistent if selected) */}
                                {formData.customerId && (
                                    <div className="p-6 rounded-2xl border-2 border-primary bg-primary/[0.02] flex items-center justify-between group animate-in zoom-in-95 duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-primary rounded-2xl text-white shadow-lg shadow-primary/20">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Selected Customer</p>
                                                <p className="text-xl font-black text-foreground">
                                                    {customers.find(c => c._id === formData.customerId)?.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground font-medium">
                                                    {customers.find(c => c._id === formData.customerId)?.phone}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
                                            onClick={() => {
                                                setFormData({ ...formData, customerId: '' });
                                                setCustomerSearch('');
                                            }}
                                        >
                                            <X className="w-4 h-4 mr-2" /> Change
                                        </Button>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" /> Start Time <span className="text-destructive">*</span>
                                        </label>
                                        <Input
                                            type="datetime-local"
                                            className="rounded-xl h-12 bg-background border-border"
                                            value={formData.outTime}
                                            onChange={(e) => setFormData({ ...formData, outTime: e.target.value })}
                                            required
                                        />
                                        <p className="text-[10px] text-muted-foreground px-1 italic">This field is required</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" /> Expected Return <span className="text-[10px] font-normal italic">(Optional)</span>
                                        </label>
                                        <Input
                                            type="datetime-local"
                                            className="rounded-xl h-12 bg-background border-border"
                                            value={formData.expectedReturnTime}
                                            onChange={(e) => setFormData({ ...formData, expectedReturnTime: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Product Picker */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between flex-wrap gap-4 px-1">
                                <div>
                                    <h3 className="text-2xl font-bold">Add Items</h3>
                                    <p className="text-muted-foreground text-sm">Select products to include in this rental</p>
                                </div>
                                <div className="flex gap-2 min-w-[200px]">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => {
                                            setSelectedCategory(e.target.value);
                                            setItemInput(prev => ({ ...prev, productId: '' }));
                                        }}
                                        className="h-10 px-4 rounded-xl border border-border bg-card text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all flex-1"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Step 1: Pick Product</label>
                                        <select
                                            value={itemInput.productId}
                                            onChange={(e) => setItemInput({ ...itemInput, productId: e.target.value })}
                                            className="w-full h-12 px-4 rounded-xl border border-border bg-card text-base font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        >
                                            <option value="">-- Select Product --</option>
                                            {products
                                                .filter(p => p.availableQuantity > 0)
                                                .filter(p => !selectedCategory || (typeof p.category === 'object' ? p.category._id : p.category) === selectedCategory)
                                                .map(p => (
                                                    <option key={p._id} value={p._id}>
                                                        {p.name} ({p.availableQuantity} in stock)
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    {itemInput.productId && (
                                        <div className="space-y-4 animate-in zoom-in-95 duration-200">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Step 2: Selection & Rates</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <select
                                                        value={itemInput.productItemId}
                                                        onChange={(e) => {
                                                            const itemId = e.target.value;
                                                            setItemInput({ ...itemInput, productItemId: itemId });
                                                            const item = availableItems.find(i => i._id === itemId);
                                                            if (item?.status === 'damaged') toast.error(`Damaged: ${item.damageReason || 'No reason'}`);
                                                            setSelectedInventoryItem(item);
                                                        }}
                                                        className="h-12 px-4 rounded-xl border border-border bg-card font-medium outline-none"
                                                    >
                                                        <option value="">-- Any Item --</option>
                                                        {availableItems.map(item => (
                                                            <option key={item._id} value={item._id}>
                                                                {item.uniqueIdentifier} ({item.condition})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <select
                                                        value={itemInput.rentType}
                                                        onChange={(e) => {
                                                            const type = e.target.value;
                                                            const price = selectedProduct?.rentalRate?.[type] || 0;
                                                            setItemInput({ ...itemInput, rentType: type, rentAtTime: price });
                                                        }}
                                                        className="h-12 px-4 rounded-xl border border-border bg-card font-medium outline-none"
                                                    >
                                                        <option value="hourly">Hourly</option>
                                                        <option value="daily">Daily</option>
                                                        <option value="monthly">Monthly</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <div className="flex-1 relative">
                                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <Input
                                                        type="number"
                                                        className="pl-9 h-12 rounded-xl text-lg font-bold"
                                                        value={itemInput.rentAtTime}
                                                        onChange={(e) => setItemInput({ ...itemInput, rentAtTime: e.target.value })}
                                                    />
                                                </div>
                                                <Button
                                                    onClick={handleAddItem}
                                                    className="h-12 px-8 rounded-xl bg-primary text-white font-bold"
                                                >
                                                    <Plus className="w-5 h-5 mr-2" /> Add
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-muted/30 rounded-2xl p-6 border-2 border-dashed border-border min-h-[140px] flex flex-col justify-center">
                                        {selectedInventoryItem && selectedInventoryItem.accessories?.length > 0 ? (
                                            <>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Include Accessories</p>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {selectedInventoryItem.accessories.map((acc, idx) => (
                                                        <label key={idx} className="flex items-center gap-3 p-2 bg-card rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                                                            <input
                                                                type="checkbox" defaultChecked
                                                                className="w-4 h-4 accent-primary"
                                                                onChange={(e) => {
                                                                    const updated = selectedInventoryItem.accessories.map((a, i) =>
                                                                        i === idx ? { ...a, isVerified: e.target.checked } : a
                                                                    );
                                                                    setSelectedInventoryItem({ ...selectedInventoryItem, accessories: updated });
                                                                }}
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold truncate">{acc.name}</p>
                                                                {acc.serialNumber && <p className="text-[10px] text-muted-foreground">S/N: {acc.serialNumber}</p>}
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center opacity-40">
                                                <Info className="w-8 h-8 mx-auto mb-2" />
                                                <p className="text-xs font-semibold">No specific item/accessories selected</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Extra Sales */}
                        <div className="pt-6 border-t border-border">
                            <div className="flex items-center gap-2 mb-4">
                                <DollarSign className="w-5 h-5 text-primary" />
                                <h3 className="text-xl font-bold uppercase tracking-tight">Selling Add-ons</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Select Consumable</label>
                                    <select
                                        value={selectedSellingAccessoryId}
                                        onChange={(e) => setSelectedSellingAccessoryId(e.target.value)}
                                        className="w-full h-12 px-4 rounded-xl border border-border bg-card outline-none"
                                    >
                                        <option value="">-- Consumables/Items --</option>
                                        {sellingAccessories.map(acc => (
                                            <option key={acc._id} value={acc._id}>
                                                {acc.name} (₹{acc.price}) - Stock: {acc.quantity}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Qty</label>
                                    <Input
                                        type="number" className="h-12 rounded-xl"
                                        min="1" value={sellingQuantity}
                                        onChange={(e) => setSellingQuantity(parseInt(e.target.value) || 1)}
                                    />
                                </div>
                                <Button onClick={handleAddSoldItem} variant="outline" className="h-12 rounded-xl border-2 border-primary/20 text-primary font-bold hover:bg-primary/5">
                                    <Plus className="w-5 h-5 mr-2" /> Add
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-2xl font-bold mb-1">Final Review</h3>
                                    <p className="text-muted-foreground text-sm">Update advance payment and add notes</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            <IndianRupee className="w-3 h-3" /> Advance Payment (₹)
                                        </label>
                                        <Input
                                            type="number"
                                            className="h-14 text-2xl font-black rounded-2xl bg-background border-border text-primary"
                                            value={formData.advancePayment}
                                            onChange={(e) => setFormData({ ...formData, advancePayment: e.target.value })}
                                        />
                                        <p className="text-[10px] text-muted-foreground px-1 italic italic">Enter amount received from customer today</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Internal Notes</label>
                                        <textarea
                                            rows="4"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            className="w-full p-4 rounded-2xl bg-card border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none"
                                            placeholder="Add any special instructions or observations..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-muted/10 p-6 rounded-3xl border border-border">
                                    <h4 className="font-black text-xs uppercase tracking-[0.2em] mb-4 text-muted-foreground/60">Final Checkout Details</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border">
                                            <div className="bg-primary/10 p-2.5 rounded-full text-primary">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Customer</p>
                                                <p className="font-bold underline decoration-primary/30 underline-offset-4">
                                                    {customers.find(c => c._id === formData.customerId)?.name || 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border">
                                            <div className="bg-blue-500/10 p-2.5 rounded-full text-blue-500">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Timeline</p>
                                                <p className="text-sm font-semibold">
                                                    {formData.outTime ? new Date(formData.outTime).toLocaleString() : 'Now'}
                                                    {formData.expectedReturnTime && ` → ${new Date(formData.expectedReturnTime).toLocaleDateString()}`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground font-medium animate-pulse">Initializing Rental System...</p>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-2xl">
                            <Plus className="w-8 h-8 text-primary" />
                        </div>
                        New Rental
                    </h1>
                    <p className="text-muted-foreground font-medium ml-1">Create a professional rental agreement in seconds</p>
                </div>

                {/* Wizard Progress Bar */}
                <div className="flex items-center gap-2 bg-muted/20 p-1.5 rounded-2xl border border-border">
                    {STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;

                        return (
                            <React.Fragment key={step.id}>
                                <div
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300",
                                        isActive ? "bg-background shadow-sm border border-border scale-105" : "opacity-40 grayscale"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                        isCompleted ? "bg-green-500 text-white" : isActive ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                    )}>
                                        {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                    </div>
                                    <div className="hidden lg:block text-left">
                                        <p className="text-[10px] font-black uppercase tracking-[0.1em] leading-none mb-0.5">{step.title}</p>
                                        <p className="text-[9px] text-muted-foreground leading-none">{step.description}</p>
                                    </div>
                                </div>
                                {idx < STEPS.length - 1 && (
                                    <div className="w-4 h-[2px] bg-border mx-1" />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="min-h-[500px]">
                        {renderStepContent()}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-8 border-t border-border mt-10">
                        <Button
                            variant="ghost"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className="h-12 px-6 rounded-xl hover:bg-muted font-bold text-muted-foreground"
                        >
                            <ChevronLeft className="w-5 h-5 mr-1" /> Previous Step
                        </Button>

                        {currentStep < 3 ? (
                            <Button
                                onClick={nextStep}
                                className="h-12 px-10 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Continue <ChevronRight className="w-5 h-5 ml-1" />
                            </Button>
                        ) : (
                            <div className="w-20" /> // Spacer for alignment
                        )}
                    </div>
                </div>

                {/* Sticky Summary Sidebar */}
                <div className="lg:col-span-4 lg:sticky lg:top-24">
                    <OrderSummary />

                    {/* Helper Tooltip */}
                    <div className="mt-6 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex gap-3">
                        <div className="bg-amber-500/10 p-1.5 h-fit rounded-lg text-amber-600">
                            <Info className="w-4 h-4" />
                        </div>
                        <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                            Need help? Ensure you've selected a customer and added at least one rental item before proceeding to the final review step.
                        </p>
                    </div>
                </div>
            </div>

            {/* Modals from original logic */}
            {showPendingModal && pendingDetails && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-[150] animate-in fade-in duration-300">
                    <Card className="max-w-2xl w-full shadow-2xl border-destructive/20 overflow-hidden rounded-3xl">
                        <CardHeader className="bg-destructive/5 border-b border-destructive/10 p-6">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm">
                                        <AlertCircle className="w-8 h-8 text-destructive" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl text-destructive font-black tracking-tight">Pending Attention</CardTitle>
                                        <CardDescription className="font-medium">Customer: <span className="text-foreground">{pendingDetails.customerName}</span></CardDescription>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full hover:bg-destructive/10 text-destructive"
                                    onClick={() => setShowPendingModal(false)}
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-8">
                                {pendingDetails.pendingBills.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b pb-2">
                                            <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center">
                                                <IndianRupee className="w-4 h-4 mr-2 text-destructive" /> Outstanding Dues
                                            </h3>
                                            <span className="text-xs font-bold px-2 py-0.5 bg-destructive/10 text-destructive rounded-full">
                                                {pendingDetails.pendingBills.length} Bill(s)
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {pendingDetails.pendingBills.map((bill, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-destructive/[0.02] p-4 rounded-2xl border border-destructive/10 group hover:bg-destructive/5 transition-colors">
                                                    <div>
                                                        <p className="font-bold text-destructive">Bill #{bill.billNumber}</p>
                                                        <p className="text-xs text-muted-foreground font-medium">{new Date(bill.billDate).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-black text-destructive">₹{bill.dueAmount?.toLocaleString()}</p>
                                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{bill.paymentStatus}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {pendingDetails.pendingItems.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b pb-2">
                                            <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center">
                                                <Package className="w-4 h-4 mr-2 text-amber-600" /> Currently Possessed Items
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {pendingDetails.pendingItems.map((item, idx) => (
                                                <div key={idx} className="bg-amber-500/[0.03] p-4 rounded-2xl border border-amber-500/10 flex items-start gap-3">
                                                    <div className="p-2 bg-white rounded-xl shadow-sm text-amber-600">
                                                        <Package className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-sm text-amber-900 truncate">{item.itemName}</p>
                                                        <p className="text-[10px] text-amber-700/60 font-medium">Out since: {new Date(item.rentalDate || new Date()).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t border-border p-6 flex justify-end">
                            <Button
                                onClick={() => setShowPendingModal(false)}
                                size="lg"
                                className="px-10 rounded-2xl font-bold bg-destructive text-white hover:bg-destructive/90 shadow-lg shadow-destructive/20"
                            >
                                Understood, Proceed Anyway
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}

            {/* Quick Customer Modal */}
            {showQuickCustomerModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
                        <CardHeader className="space-y-1">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-2xl font-black">Quick Add Customer</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setShowQuickCustomerModal(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                            <CardDescription>Create a new customer profile without leaving the rental flow</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleQuickCustomerSubmit}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name *</label>
                                    <Input
                                        required
                                        placeholder="Enter customer name"
                                        value={quickCustomerFormData.name}
                                        onChange={(e) => setQuickCustomerFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number *</label>
                                    <Input
                                        required
                                        type="tel"
                                        placeholder="Enter phone number"
                                        value={quickCustomerFormData.phone}
                                        onChange={(e) => setQuickCustomerFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</label>
                                        <select
                                            className="w-full h-11 px-3 border rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                                            value={quickCustomerFormData.customerType}
                                            onChange={(e) => setQuickCustomerFormData(prev => ({ ...prev, customerType: e.target.value }))}
                                        >
                                            <option value="individual">Individual</option>
                                            <option value="business">Business</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Referral</label>
                                        <select
                                            className="w-full h-11 px-3 border rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                                            value={quickCustomerFormData.referral.isGuest ? 'guest' : 'referred'}
                                            onChange={(e) => setQuickCustomerFormData(prev => ({
                                                ...prev,
                                                referral: {
                                                    ...prev.referral,
                                                    isGuest: e.target.value === 'guest',
                                                    source: e.target.value === 'guest' ? '' : 'Walk-in'
                                                }
                                            }))}
                                        >
                                            <option value="guest">Guest (None)</option>
                                            <option value="referred">Walk-in/Referral</option>
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="flex-1 h-11 rounded-xl font-bold"
                                    onClick={() => setShowQuickCustomerModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 h-11 rounded-xl font-bold bg-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                                    disabled={isCreatingCustomer}
                                >
                                    {isCreatingCustomer ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Create Customer'
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default NewRental;
