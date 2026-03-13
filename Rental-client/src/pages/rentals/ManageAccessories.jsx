import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Trash2, Edit2, Save, X,
    Layers, AlertTriangle, CheckCircle, IndianRupee, ShieldCheck, ShieldOff
} from 'lucide-react';
import accessoryService from '../../services/accessoryService';
import rentalProductService from '../../services/rentalProductService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const ManageAccessories = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [accessories, setAccessories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingAccessory, setEditingAccessory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isRequired: false,
        replacementCost: ''
    });

    useEffect(() => { fetchData(); }, [productId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [productData, accessoriesData] = await Promise.all([
                rentalProductService.getRentalProductById(productId),
                accessoryService.getAccessoriesByProduct(productId)
            ]);
            setProduct(productData);
            setAccessories(accessoriesData);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (accessory) => {
        setEditingAccessory(accessory);
        setFormData({
            name: accessory.name,
            description: accessory.description || '',
            isRequired: accessory.isRequired,
            replacementCost: accessory.replacementCost || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this accessory? This cannot be undone.')) {
            try {
                await accessoryService.deleteAccessory(id);
                fetchData();
            } catch {
                setError('Failed to delete accessory');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAccessory) {
                await accessoryService.updateAccessory(editingAccessory._id, formData);
            } else {
                await accessoryService.addAccessory(productId, formData);
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            setError(err.message || 'Operation failed');
        }
    };

    const resetForm = () => {
        setEditingAccessory(null);
        setFormData({ name: '', description: '', isRequired: false, replacementCost: '' });
    };

    const requiredCount = accessories.filter(a => a.isRequired).length;
    const optionalCount = accessories.filter(a => !a.isRequired).length;
    const totalCost = accessories.reduce((s, a) => s + (Number(a.replacementCost) || 0), 0);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Layers className="w-10 h-10 animate-pulse" />
                <p className="text-sm">Loading accessories...</p>
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
                        <h1 className="section-title">Manage Accessories</h1>
                        {product && (
                            <p className="text-muted-foreground text-sm mt-0.5">
                                For: <span className="font-semibold text-foreground">{product.name}</span>
                            </p>
                        )}
                    </div>
                </div>
                <Button onClick={() => { resetForm(); setShowModal(true); }} className="shadow-sm">
                    <Plus className="w-4 h-4 mr-2" /> Add Accessory
                </Button>
            </div>

            {/* ─ Summary Stats ─ */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Required</p>
                    <p className="text-2xl font-bold text-foreground">{requiredCount}</p>
                    <p className="text-xs text-red-500 font-medium mt-0.5">Must return with product</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Optional</p>
                    <p className="text-2xl font-bold text-foreground">{optionalCount}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Tracked extras</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Total Replacement</p>
                    <p className="text-2xl font-bold text-foreground">₹{totalCost.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Combined cost</p>
                </div>
            </div>

            {/* ─ Error Banner ─ */}
            {error && (
                <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex gap-2 items-center">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                </div>
            )}

            {/* ─ Accessories Grid ─ */}
            {accessories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Layers className="w-16 h-16 opacity-20 mb-4" />
                    <p className="text-lg font-medium">No accessories yet</p>
                    <p className="text-sm mt-1">Add accessories that ship with this product.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {accessories.map(accessory => (
                        <div
                            key={accessory._id}
                            className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
                        >
                            {/* Top row */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className={cn(
                                        'p-2 rounded-lg shrink-0',
                                        accessory.isRequired ? 'bg-red-100' : 'bg-muted'
                                    )}>
                                        <Layers className={cn(
                                            'w-4 h-4',
                                            accessory.isRequired ? 'text-red-600' : 'text-muted-foreground'
                                        )} />
                                    </div>
                                    <p className="font-bold text-foreground truncate">{accessory.name}</p>
                                </div>
                                <span className={cn(
                                    'shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border',
                                    accessory.isRequired
                                        ? 'bg-red-50 text-red-600 border-red-200'
                                        : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                )}>
                                    {accessory.isRequired
                                        ? <><ShieldCheck className="w-3 h-3" /> Required</>
                                        : <><ShieldOff className="w-3 h-3" /> Optional</>
                                    }
                                </span>
                            </div>

                            {/* Description */}
                            {accessory.description && (
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {accessory.description}
                                </p>
                            )}

                            {/* Replacement cost */}
                            <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-3 py-2">
                                <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground font-medium">Replacement Cost:</span>
                                <span className="text-sm font-bold text-foreground ml-auto">
                                    ₹{Number(accessory.replacementCost || 0).toLocaleString('en-IN')}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-1 border-t border-border/50 mt-auto">
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => handleEdit(accessory)}
                                    className="flex-1 h-8 text-xs gap-1"
                                >
                                    <Edit2 className="w-3 h-3" /> Edit
                                </Button>
                                <Button
                                    variant="outline" size="icon"
                                    onClick={() => handleDelete(accessory._id)}
                                    className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─ Add / Edit Modal ─ */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">
                                    {editingAccessory ? 'Edit Accessory' : 'Add Accessory'}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {editingAccessory ? 'Update accessory details' : 'Define a new accessory for this product'}
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
                            {/* Name */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">
                                    Name <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    required
                                    placeholder="e.g. Battery, Charger, Lens"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Description</label>
                                <textarea
                                    rows={2}
                                    placeholder="Optional notes about this accessory..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-input outline-none focus:border-primary transition-all resize-none"
                                />
                            </div>

                            {/* Cost */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Replacement Cost (₹)</label>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formData.replacementCost}
                                    onChange={(e) => setFormData({ ...formData, replacementCost: e.target.value })}
                                />
                            </div>

                            {/* Required toggle */}
                            <label className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.isRequired}
                                    onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                                    className="w-4 h-4 accent-primary"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Required Accessory</p>
                                    <p className="text-xs text-muted-foreground">Must be returned with the product</p>
                                </div>
                                {formData.isRequired && (
                                    <ShieldCheck className="w-4 h-4 text-red-500 ml-auto" />
                                )}
                            </label>

                            {/* Footer */}
                            <div className="flex gap-3 pt-1">
                                <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 gap-2">
                                    <Save className="w-4 h-4" />
                                    {editingAccessory ? 'Save Changes' : 'Add Accessory'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageAccessories;
