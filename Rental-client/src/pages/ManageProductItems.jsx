import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Trash2, Edit2, Save, X,
    Package, CheckCircle2, Clock, AlertTriangle, Wrench, Hash
} from 'lucide-react';
import productItemService from '../services/productItemService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
    available: { label: 'Available', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
    rented: { label: 'Rented', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    maintenance: { label: 'Maintenance', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    scrap: { label: 'Scrap', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
    missing: { label: 'Missing', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
};

const CONDITION_CONFIG = {
    new: { label: 'New', color: 'text-green-600' },
    good: { label: 'Good', color: 'text-blue-600' },
    fair: { label: 'Fair', color: 'text-amber-600' },
    poor: { label: 'Poor', color: 'text-orange-600' },
    damaged: { label: 'Damaged', color: 'text-red-600' },
};

const ManageProductItems = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        uniqueIdentifier: '',
        status: 'available',
        condition: 'good',
        purchaseDate: '',
        purchasePrice: ''
    });

    useEffect(() => { fetchData(); }, [productId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await productItemService.getItemsByProduct(productId);
            setItems(data);
        } catch (err) {
            setError('Failed to fetch items');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            uniqueIdentifier: item.uniqueIdentifier,
            status: item.status,
            condition: item.condition,
            purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : '',
            purchasePrice: item.purchasePrice || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this item? This action cannot be undone.')) {
            try {
                await productItemService.deleteItem(id);
                fetchData();
            } catch {
                setError('Failed to delete item');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await productItemService.updateItem(editingItem._id, formData);
            } else {
                await productItemService.addItem(productId, formData);
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            setError(err.message || 'Operation failed');
        }
    };

    const resetForm = () => {
        setEditingItem(null);
        setFormData({ uniqueIdentifier: '', status: 'available', condition: 'good', purchaseDate: '', purchasePrice: '' });
    };

    // Stats counts
    const stats = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
        key,
        label: cfg.label,
        count: items.filter(i => i.status === key).length,
        color: cfg.dot
    }));

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Package className="w-10 h-10 animate-pulse" />
                <p className="text-sm">Loading items...</p>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto">
            {/* ─ Header ─ */}
            <div className="page-header">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/rentals/products')} className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="section-title">Manage Items</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">Individual unit tracking for this product</p>
                    </div>
                </div>
                <Button onClick={() => { resetForm(); setShowModal(true); }} className="shadow-sm">
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
            </div>

            {/* ─ Stats Row ─ */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
                {stats.map(s => (
                    <div key={s.key} className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-1 shadow-sm">
                        <span className="text-2xl font-bold text-foreground">{s.count}</span>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${s.color}`} />
                            <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ─ Error Banner ─ */}
            {error && (
                <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex gap-2 items-center">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                </div>
            )}

            {/* ─ Items Grid ─ */}
            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Package className="w-16 h-16 opacity-20 mb-4" />
                    <p className="text-lg font-medium">No items yet</p>
                    <p className="text-sm mt-1">Click "Add Item" to track your first unit.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map(item => {
                        const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.available;
                        const condCfg = CONDITION_CONFIG[item.condition] || CONDITION_CONFIG.good;
                        return (
                            <div key={item._id} className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group flex flex-col gap-3">
                                {/* Top row */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Hash className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">Unit ID</p>
                                            <p className="font-bold text-foreground text-sm">{item.uniqueIdentifier}</p>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        'px-2.5 py-1 text-[11px] font-semibold rounded-full border flex items-center gap-1.5',
                                        statusCfg.color
                                    )}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                        {statusCfg.label}
                                    </span>
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-muted/50 rounded-lg p-2">
                                        <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-0.5">Condition</p>
                                        <p className={cn('text-sm font-semibold', condCfg.color)}>{condCfg.label}</p>
                                    </div>
                                    <div className="bg-muted/50 rounded-lg p-2">
                                        <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-0.5">Purchase</p>
                                        <p className="text-sm font-semibold">
                                            {item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                                        </p>
                                    </div>
                                </div>

                                {item.purchasePrice > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                        Purchase price: <span className="font-semibold text-foreground">₹{Number(item.purchasePrice).toLocaleString('en-IN')}</span>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 pt-1 border-t border-border/50 mt-auto">
                                    <Button
                                        variant="outline" size="sm"
                                        onClick={() => handleEdit(item)}
                                        className="flex-1 h-8 text-xs gap-1"
                                    >
                                        <Edit2 className="w-3 h-3" /> Edit
                                    </Button>
                                    <Button
                                        variant="outline" size="icon"
                                        onClick={() => handleDelete(item._id)}
                                        className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─ Add/Edit Modal ─ */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">
                                    {editingItem ? 'Edit Item' : 'Add New Item'}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {editingItem ? 'Update unit details' : 'Register a new physical unit'}
                                </p>
                            </div>
                            <button
                                onClick={() => { setShowModal(false); resetForm(); }}
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Unique ID */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">
                                    Unique Identifier <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    required
                                    placeholder="e.g. SN-001, ITEM-2024-01"
                                    value={formData.uniqueIdentifier}
                                    onChange={(e) => setFormData({ ...formData, uniqueIdentifier: e.target.value })}
                                />
                            </div>

                            {/* Status + Condition side by side */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-foreground">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="premium-input"
                                    >
                                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-foreground">Condition</label>
                                    <select
                                        value={formData.condition}
                                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                        className="premium-input"
                                    >
                                        {Object.entries(CONDITION_CONFIG).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Purchase Date + Price side by side */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-foreground">Purchase Date</label>
                                    <Input
                                        type="date"
                                        value={formData.purchaseDate}
                                        onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-foreground">Purchase Price (₹)</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={formData.purchasePrice}
                                        onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Footer buttons */}
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 gap-2">
                                    <Save className="w-4 h-4" />
                                    {editingItem ? 'Save Changes' : 'Add Item'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageProductItems;
