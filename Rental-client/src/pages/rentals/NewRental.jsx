import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Calendar, User, Package, DollarSign, Save, X, AlertCircle } from 'lucide-react';
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

const NewRental = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [loading, setLoading] = useState(true);

    // const [error, setError] = useState('');
    // const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        customerId: '',
        items: [],
        outTime: '', // Optional rental start time
        expectedReturnTime: '',
        advancePayment: 0,
        accessoriesPayment: 0,
        notes: ''
    });

    const [itemInput, setItemInput] = useState({
        productId: '',
        productItemId: '', // For individual tracking
        quantity: 1, // Fallback if not tracking individual items
        rentType: 'daily',
        rentAtTime: 0 // Calculated based on product settings
    });

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
    const [availableItems, setAvailableItems] = useState([]);

    // Selling Accessories State
    const [sellingAccessories, setSellingAccessories] = useState([]);
    const [selectedSellingAccessoryId, setSelectedSellingAccessoryId] = useState('');
    const [sellingQuantity, setSellingQuantity] = useState(1);
    const [soldItemsCart, setSoldItemsCart] = useState([]);

    // Pending Items/Payments Modal State
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [pendingDetails, setPendingDetails] = useState(null);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        // setError('');
        // setSuccess('');

        try {
            // Format data for API
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
                        checkedOutCondition: acc.condition, // Assuming condition at checkout is same as inventory
                        status: acc.isVerified === false ? 'missing' : 'with_item' // If unchecked, mark as missing? Or just don't include? 
                        // Actually, if unchecked, it means it wasn't given. So maybe 'missing' or just not in the list.
                        // Let's assume checked means 'with_item'.
                    })).filter(acc => acc.status === 'with_item') : []
                })),
                outTime: formData.outTime || null, // Send null if empty (will use current time)
                expectedReturnTime: formData.expectedReturnTime || null, // Send null if empty
                advancePayment: parseFloat(formData.advancePayment) || 0,
                accessoriesPayment: parseFloat(formData.accessoriesPayment) || 0,
                notes: formData.notes,
                soldItems: soldItemsCart // Add sold items to payload
            };

            await rentalService.createRental(rentalData);
            toast.success('Rental created successfully!');

            // Reset form
            setFormData({
                customerId: '',
                items: [],
                outTime: '',
                expectedReturnTime: '',
                advancePayment: 0,
                accessoriesPayment: 0,
                notes: ''
            });
            setSoldItemsCart([]); // Clear sold items cart

            // Navigate to active rentals after short delay to show success message
            setTimeout(() => {
                navigate('/rentals/active');
            }, 1500);
        } catch (err) {
            toast.error(err.message || 'Failed to create rental');
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="container mx-auto">
            <div className="page-header">
                <div>
                    <h1 className="section-title">New Rental</h1>
                    <p className="text-muted-foreground mt-1">Create a new rental agreement for a customer</p>
                </div>
            </div>



            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center">
                                <User className="w-5 h-5 mr-2 text-primary" /> Customer Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Customer</label>
                                    <select
                                        value={formData.customerId}
                                        onChange={(e) => handleCustomerChange(e.target.value)}
                                        className="premium-input"
                                    >
                                        <option value="">-- Select Customer --</option>
                                        {customers.map(c => (
                                            <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        Rental Start Time <span className="text-xs">(Optional)</span>
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        step="1"
                                        min={null}
                                        max={null}
                                        value={formData.outTime}
                                        onChange={(e) => setFormData({ ...formData, outTime: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Leave empty to use current time (any date allowed)
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        Expected Return Date <span className="text-xs">(Optional)</span>
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        step="1"
                                        min={null}
                                        max={null}
                                        value={formData.expectedReturnTime}
                                        onChange={(e) => setFormData({ ...formData, expectedReturnTime: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Leave empty if return date is not specified
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Item Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center">
                                <Package className="w-5 h-5 mr-2 text-primary" /> Add Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Category Filter</label>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => {
                                            setSelectedCategory(e.target.value);
                                            setItemInput(prev => ({ ...prev, productId: '' })); // Reset product selection
                                        }}
                                        className="premium-input"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Product</label>
                                    <select
                                        value={itemInput.productId}
                                        onChange={(e) => setItemInput({ ...itemInput, productId: e.target.value })}
                                        className="premium-input"
                                    >
                                        <option value="">-- Select Product --</option>
                                        {products
                                            .filter(p => p.availableQuantity > 0)
                                            .filter(p => !selectedCategory || (typeof p.category === 'object' ? p.category._id : p.category) === selectedCategory)
                                            .map(p => (
                                                <option key={p._id} value={p._id}>
                                                    {p.name} ({p.availableQuantity} Available)
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Specific Item (Optional)</label>
                                    <select
                                        value={itemInput.productItemId}
                                        onChange={(e) => {
                                            const itemId = e.target.value;
                                            setItemInput({ ...itemInput, productItemId: itemId });
                                            const item = availableItems.find(i => i._id === itemId);

                                            if (item && item.status === 'damaged') {
                                                toast.error(`Cannot rent damaged item. Reason: ${item.damageReason || 'No reason provided'}`);
                                                // Optional: Clear selection or allow viewing but block 'Add'
                                                // For now, we allow selecting to see details but 'Add' will be blocked
                                            }

                                            if (item && item.status === 'maintenance') {
                                                toast.warning(`Alert: This item is currently under service/maintenance!`, {
                                                    position: "top-center",
                                                    autoClose: 5000,
                                                    hideProgressBar: false,
                                                    closeOnClick: true,
                                                    pauseOnHover: true,
                                                    draggable: true,
                                                    progress: undefined,
                                                    style: { background: '#FDE047', color: '#000', fontWeight: 'bold' } // Custom style for visibility
                                                });
                                            }

                                            setSelectedInventoryItem(item);
                                        }}
                                        className="premium-input"
                                        disabled={!itemInput.productId}
                                    >
                                        <option value="">-- Any Available Item --</option>
                                        {availableItems.map(item => (
                                            <option
                                                key={item._id}
                                                value={item._id}
                                                className={
                                                    item.status === 'damaged' ? 'text-red-500 font-bold' :
                                                        item.status === 'maintenance' ? 'text-amber-500 font-bold bg-amber-50' : ''
                                                }
                                                style={item.status === 'maintenance' ? { color: 'orange', fontWeight: 'bold' } : {}} // Inline style fallback
                                            >
                                                {item.uniqueIdentifier} ({item.status === 'damaged' ? 'DAMAGED' : item.status === 'maintenance' ? 'SERVICE IN PROGRESS' : item.condition})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Accessories Verification */}
                                {selectedInventoryItem && selectedInventoryItem.accessories && selectedInventoryItem.accessories.length > 0 && (
                                    <div className="col-span-1 md:col-span-2 bg-muted/30 p-4 rounded-xl border border-border">
                                        <h4 className="font-bold text-foreground mb-4 text-xs uppercase tracking-wider">Verify Accessories</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {selectedInventoryItem.accessories.map((acc, idx) => (
                                                <div key={idx} className="flex items-center bg-card p-3 rounded-lg border border-border shadow-sm">
                                                    <input
                                                        type="checkbox"
                                                        defaultChecked={true}
                                                        onChange={(e) => {
                                                            const updatedAccessories = selectedInventoryItem.accessories.map((a, i) =>
                                                                i === idx ? { ...a, isVerified: e.target.checked } : a
                                                            );
                                                            setSelectedInventoryItem({ ...selectedInventoryItem, accessories: updatedAccessories });
                                                        }}
                                                        className="h-4 w-4 text-primary focus:ring-ring border-border rounded"
                                                    />
                                                    <div className="ml-3 text-sm">
                                                        <span className="font-semibold text-foreground">{acc.name}</span>
                                                        {acc.serialNumber && (
                                                            <span className="text-[10px] text-muted-foreground block font-medium">S/N: {acc.serialNumber}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Rent Type</label>
                                    <select
                                        value={itemInput.rentType}
                                        onChange={(e) => {
                                            const newType = e.target.value;
                                            const price = selectedProduct && selectedProduct.rentalRate ? selectedProduct.rentalRate[newType] : 0;
                                            setItemInput({ ...itemInput, rentType: newType, rentAtTime: price });
                                        }}
                                        className="premium-input"
                                    >
                                        <option value="hourly">Hourly</option>
                                        <option value="daily">Daily</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Rate (₹)</label>
                                    <Input
                                        type="number"
                                        value={itemInput.rentAtTime}
                                        onChange={(e) => setItemInput({ ...itemInput, rentAtTime: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-end col-span-1 md:col-span-2">
                                    <Button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="w-full"
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Add Item
                                    </Button>
                                </div>
                            </div>

                            {/* Selected Items List */}
                            {formData.items.length > 0 && (
                                <div className="mt-6 border border-border rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-[10px] text-muted-foreground uppercase tracking-widest bg-muted/50 font-bold border-b border-border">
                                            <tr>
                                                <th className="px-4 py-3">Product</th>
                                                <th className="px-4 py-3 text-center">Type</th>
                                                <th className="px-4 py-3 text-right">Rate</th>
                                                <th className="px-4 py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {formData.items.map((item, index) => (
                                                <tr key={index} className="bg-card hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3 font-bold text-foreground">{item.product.name}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="badge badge-secondary capitalize">{item.rentType}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold">₹{item.rentAtTime}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleRemoveItem(index)}
                                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Selling Accessories Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center">
                                <DollarSign className="w-5 h-5 mr-2 text-primary" /> Selling Accessories
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Select Item</label>
                                    <select
                                        value={selectedSellingAccessoryId}
                                        onChange={(e) => setSelectedSellingAccessoryId(e.target.value)}
                                        className="premium-input"
                                    >
                                        <option value="">-- Select Consumable --</option>
                                        {sellingAccessories.map(acc => (
                                            <option key={acc._id} value={acc._id}>
                                                {acc.name} (₹{acc.price}) - Stock: {acc.quantity}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Quantity</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={sellingQuantity}
                                        onChange={(e) => setSellingQuantity(parseInt(e.target.value) || 1)}
                                    />
                                </div>
                                <div>
                                    <Button
                                        type="button"
                                        onClick={handleAddSoldItem}
                                        className="w-full"
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Add
                                    </Button>
                                </div>
                            </div>

                            {/* Sold Items List */}
                            {soldItemsCart.length > 0 && (
                                <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-[10px] text-muted-foreground uppercase tracking-widest bg-muted/50 font-bold border-b border-border">
                                            <tr>
                                                <th className="px-4 py-3">Item</th>
                                                <th className="px-4 py-3 text-center">Qty</th>
                                                <th className="px-4 py-3 text-right">Price</th>
                                                <th className="px-4 py-3 text-right">Total</th>
                                                <th className="px-4 py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {soldItemsCart.map((item, index) => (
                                                <tr key={index} className="bg-card hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3 font-bold text-foreground">{item.name}</td>
                                                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right">₹{item.price}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-primary">₹{item.total}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleRemoveSoldItem(index)}
                                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-muted/20 font-bold">
                                                <td colSpan="3" className="px-4 py-4 text-right text-xs uppercase tracking-wider text-muted-foreground">Total Selling Cost:</td>
                                                <td colSpan="2" className="px-4 py-4 text-primary text-lg">₹{soldItemsTotal}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Summary */}
                <div className="space-y-6">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center">
                                <DollarSign className="w-5 h-5 mr-2 text-primary" /> Payment & Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Rental Advance (₹)</label>
                                    <Input
                                        type="number"
                                        value={formData.advancePayment}
                                        onChange={(e) => setFormData({ ...formData, advancePayment: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Accessories Payment (₹)</label>
                                    <Input
                                        type="number"
                                        value={formData.accessoriesPayment}
                                        onChange={(e) => setFormData({ ...formData, accessoriesPayment: e.target.value })}
                                        className="bg-muted/50 cursor-not-allowed font-bold text-primary"
                                        readOnly
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Notes</label>
                                <textarea
                                    rows="3"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="premium-input min-h-[100px] py-3"
                                    placeholder="Any additional details..."
                                />
                            </div>
                            <Button
                                onClick={handleSubmit}
                                disabled={formData.items.length === 0 || !formData.customerId?.trim()}
                                className="w-full h-12 text-lg"
                                variant="default"
                            >
                                <Save className="w-5 h-5 mr-2" /> Create Rental
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {showPendingModal && pendingDetails && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-[150]">
                    <Card className="max-w-2xl w-full shadow-2xl border-destructive/20 overflow-hidden">
                        <CardHeader className="bg-destructive/5 border-b border-destructive/10">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-destructive/10 rounded-full">
                                        <AlertCircle className="w-6 h-6 text-destructive" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl text-destructive">Pending Alert</CardTitle>
                                        <CardDescription>Customer: {pendingDetails.customerName}</CardDescription>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowPendingModal(false)}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-6">
                                {pendingDetails.pendingBills.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center uppercase tracking-wider">
                                            <DollarSign className="w-4 h-4 mr-2" /> Pending Payments
                                        </h3>
                                        <div className="bg-destructive/5 rounded-xl border border-destructive/10 overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-destructive/10 text-destructive font-bold text-[10px] uppercase tracking-widest">
                                                    <tr>
                                                        <th className="px-4 py-3">Bill #</th>
                                                        <th className="px-4 py-3">Date</th>
                                                        <th className="px-4 py-3 text-right">Due Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-destructive/10">
                                                    {pendingDetails.pendingBills.map((bill, idx) => (
                                                        <tr key={bill._id || idx}>
                                                            <td className="px-4 py-3 font-bold">{bill.billNumber}</td>
                                                            <td className="px-4 py-3 text-muted-foreground">{new Date(bill.billDate).toLocaleDateString()}</td>
                                                            <td className="px-4 py-3 text-right text-destructive font-bold">₹{bill.dueAmount?.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {pendingDetails.pendingItems.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center uppercase tracking-wider">
                                            <Package className="w-4 h-4 mr-2" /> Unreturned Items
                                        </h3>
                                        <div className="bg-amber-500/5 rounded-xl border border-amber-500/10 overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-amber-500/10 text-amber-700 font-bold text-[10px] uppercase tracking-widest">
                                                    <tr>
                                                        <th className="px-4 py-3">Item Name</th>
                                                        <th className="px-4 py-3">Rental ID</th>
                                                        <th className="px-4 py-3">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-amber-500/10">
                                                    {pendingDetails.pendingItems.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-4 py-3 font-bold">{item.itemName}</td>
                                                            <td className="px-4 py-3 text-muted-foreground">{item.rentalId}</td>
                                                            <td className="px-4 py-3 text-muted-foreground">{new Date(item.rentalDate || new Date()).toLocaleDateString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <p className="text-xs text-amber-600 mt-3 font-medium px-1">
                                            * Please account for these items before proceeding.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t border-border p-4 flex justify-end">
                            <Button
                                onClick={() => setShowPendingModal(false)}
                                size="lg"
                            >
                                Acknowledge & Continue
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default NewRental;
