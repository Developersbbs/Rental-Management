import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Search } from 'lucide-react';
import rentalInventoryItemService from '../services/rentalInventoryItemService';
import serviceRecordService from '../services/serviceRecordService';
import rentalCategoryService from '../services/rentalCategoryService';
import { toast } from 'react-toastify';

const ServiceRecordForm = ({ onClose, onSuccess, initialData = null }) => {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [filteredItems, setFilteredItems] = useState([]);
    const [itemSearch, setItemSearch] = useState('');
    const [showItemDropdown, setShowItemDropdown] = useState(false);

    const [formData, setFormData] = useState({
        inventoryItemId: '',
        serviceType: 'preventive',
        serviceDate: new Date().toISOString().split('T')[0],
        description: '',
        technicianName: '',
        laborCost: 0,
        partsReplaced: [],
        serviceStatus: 'completed',
        severity: 'low',
        beforeCondition: 'good',
        afterCondition: 'good',
        nextServiceDue: '',
        notes: ''
    });

    // Populate form if editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                inventoryItemId: initialData.inventoryItemId?._id || initialData.inventoryItemId,
                serviceType: initialData.serviceType,
                serviceDate: initialData.serviceDate ? new Date(initialData.serviceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                description: initialData.description,
                technicianName: initialData.technicianName || '',
                laborCost: initialData.laborCost || 0,
                partsReplaced: initialData.partsReplaced || [],
                serviceStatus: initialData.serviceStatus,
                severity: initialData.severity || 'low',
                beforeCondition: initialData.beforeCondition,
                afterCondition: initialData.afterCondition,
                nextServiceDue: initialData.nextServiceDue ? new Date(initialData.nextServiceDue).toISOString().split('T')[0] : '',
                notes: initialData.notes || ''
            });

            // Set search text for item
            if (initialData.inventoryItemId) {
                const item = initialData.inventoryItemId;
                // If populated object
                if (item.uniqueIdentifier) {
                    setItemSearch(`${item.uniqueIdentifier} - ${item.rentalProductId?.name || ''}`);
                }
            }
        }
    }, [initialData]);

    // Fetch inventory items and categories on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [itemsData, categoriesData] = await Promise.all([
                    rentalInventoryItemService.getAllItems(),
                    rentalCategoryService.getAllRentalCategories()
                ]);
                setItems(itemsData);
                setFilteredItems(itemsData);
                setCategories(categoriesData.rentalCategories || []);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load form data');
            }
        };
        fetchData();
    }, []);

    // Filter items based on search and category
    useEffect(() => {
        let result = items;

        // Filter by category
        if (selectedCategory) {
            result = result.filter(item =>
                item.rentalProductId?.category?._id === selectedCategory ||
                item.rentalProductId?.category === selectedCategory
            );
        }

        // Filter by search term
        if (itemSearch) {
            const searchLower = itemSearch.toLowerCase();
            result = result.filter(item =>
                item.uniqueIdentifier?.toLowerCase().includes(searchLower) ||
                item.rentalProductId?.name?.toLowerCase().includes(searchLower)
            );
        }

        setFilteredItems(result);
    }, [itemSearch, selectedCategory, items]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemSelect = (item) => {
        console.log('Item selected:', item);
        setFormData(prev => ({ ...prev, inventoryItemId: item._id }));
        setItemSearch(`${item.uniqueIdentifier} - ${item.rentalProductId?.name}`);
        setShowItemDropdown(false);
    };



    // Parts handling
    const addPart = () => {
        setFormData(prev => ({
            ...prev,
            partsReplaced: [...prev.partsReplaced, { partName: '', partCost: 0, quantity: 1 }]
        }));
    };

    const removePart = (index) => {
        setFormData(prev => ({
            ...prev,
            partsReplaced: prev.partsReplaced.filter((_, i) => i !== index)
        }));
    };

    const handlePartChange = (index, field, value) => {
        const newParts = [...formData.partsReplaced];
        newParts[index][field] = value;
        setFormData(prev => ({ ...prev, partsReplaced: newParts }));
    };

    const calculateTotalCost = () => {
        const partsCost = formData.partsReplaced.reduce((sum, part) => sum + (Number(part.partCost) * Number(part.quantity)), 0);
        return Number(formData.laborCost) + partsCost;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.inventoryItemId) {
            toast.error('Please select an inventory item');
            return;
        }

        try {
            setLoading(true);
            if (initialData) {
                await serviceRecordService.updateServiceRecord(initialData._id, formData);
                toast.success('Service record updated successfully');
            } else {
                await serviceRecordService.createServiceRecord(formData);
                toast.success('Service record created successfully');
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving service record:', error);
            toast.error(error.message || 'Failed to save service record');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150] p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {initialData ? 'Edit Service Record' : 'Record New Service'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Inventory Item Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Filter</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                            >
                                <option value="">All Categories</option>
                                {categories.map(category => (
                                    <option key={category._id} value={category._id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inventory Item <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={itemSearch}
                                    onChange={(e) => {
                                        setItemSearch(e.target.value);
                                        setShowItemDropdown(true);
                                    }}
                                    onFocus={() => setShowItemDropdown(true)}
                                    placeholder="Search item ID or name..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                            {showItemDropdown && filteredItems.length > 0 && (
                                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {filteredItems.map(item => (
                                        <div
                                            key={item._id}
                                            onClick={() => handleItemSelect(item)}
                                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer"
                                        >
                                            <p className="font-medium text-gray-900 dark:text-white">{item.uniqueIdentifier}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-300">{item.rentalProductId?.name}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service Type</label>
                            <select
                                name="serviceType"
                                value={formData.serviceType}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                            >
                                <option value="preventive">Preventive Maintenance</option>
                                <option value="corrective">Corrective Maintenance</option>
                                <option value="inspection">Inspection</option>
                                <option value="repair">Repair</option>
                                <option value="cleaning">Cleaning</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service Date</label>
                            <input
                                type="date"
                                name="serviceDate"
                                value={formData.serviceDate}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Technician Name</label>
                            <input
                                type="text"
                                name="technicianName"
                                value={formData.technicianName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                placeholder="Enter technician name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                            <select
                                name="serviceStatus"
                                value={formData.serviceStatus}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                            >
                                <option value="completed">Completed</option>
                                <option value="in_progress">In Progress</option>
                                <option value="scheduled">Scheduled</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description <span className="text-red-500">*</span></label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows="3"
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                            placeholder="Describe the service performed..."
                        />
                    </div>

                    {/* Parts Replaced */}
                    <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-medium text-gray-900 dark:text-white">Parts Replaced</h3>
                            <button
                                type="button"
                                onClick={addPart}
                                className="text-sm text-primary hover:text-primary/80 dark:text-primary-foreground flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" /> Add Part
                            </button>
                        </div>

                        {formData.partsReplaced.map((part, index) => (
                            <div key={index} className="flex gap-4 mb-3 items-end">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Part Name</label>
                                    <input
                                        type="text"
                                        value={part.partName}
                                        onChange={(e) => handlePartChange(index, 'partName', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        placeholder="Part Name"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Cost</label>
                                    <input
                                        type="number"
                                        value={part.partCost}
                                        onChange={(e) => handlePartChange(index, 'partCost', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        min="0"
                                    />
                                </div>
                                <div className="w-20">
                                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Qty</label>
                                    <input
                                        type="number"
                                        value={part.quantity}
                                        onChange={(e) => handlePartChange(index, 'quantity', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        min="1"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removePart(index)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        {formData.partsReplaced.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No parts replaced</p>
                        )}
                    </div>

                    {/* Costs & Condition */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Labor Cost</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    name="laborCost"
                                    value={formData.laborCost}
                                    onChange={handleInputChange}
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition Before</label>
                            <select
                                name="beforeCondition"
                                value={formData.beforeCondition}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                            >
                                <option value="new">New</option>
                                <option value="good">Good</option>
                                <option value="fair">Fair</option>
                                <option value="poor">Poor</option>
                                <option value="damaged">Damaged</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition After</label>
                            <select
                                name="afterCondition"
                                value={formData.afterCondition}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                            >
                                <option value="new">New</option>
                                <option value="good">Good</option>
                                <option value="fair">Fair</option>
                                <option value="poor">Poor</option>
                                <option value="damaged">Damaged</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Service Due</label>
                            <input
                                type="date"
                                name="nextServiceDue"
                                value={formData.nextServiceDue}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                            <input
                                type="text"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                placeholder="Additional notes..."
                            />
                        </div>
                    </div>

                    {/* Total Cost Display */}
                    <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Estimated Cost</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{calculateTotalCost().toLocaleString()}</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 shadow-sm transition-colors"
                            >
                                {loading ? 'Saving...' : <><Save className="w-4 h-4" /> {initialData ? 'Update Record' : 'Save Record'}</>}
                            </button>
                        </div>
                    </div>
                </form >
            </div >
        </div >
    );
};

export default ServiceRecordForm;
