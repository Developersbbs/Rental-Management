import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, Package } from 'lucide-react';
import accessoryService from '../../services/accessoryService';
import rentalProductService from '../../services/rentalProductService';

const ManageAccessories = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [accessories, setAccessories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal state for Add/Edit
    const [showModal, setShowModal] = useState(false);
    const [editingAccessory, setEditingAccessory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isRequired: false,
        replacementCost: ''
    });

    useEffect(() => {
        fetchData();
    }, [productId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch product details
            const productData = await rentalProductService.getRentalProductById(productId);
            setProduct(productData);

            // Fetch accessories
            const accessoriesData = await accessoryService.getAccessoriesByProduct(productId);
            setAccessories(accessoriesData);
        } catch (err) {
            setError('Failed to fetch data');
            console.error(err);
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
        if (window.confirm('Are you sure you want to delete this accessory?')) {
            try {
                await accessoryService.deleteAccessory(id);
                setSuccess('Accessory deleted successfully');
                setTimeout(() => setSuccess(''), 3000);
                fetchData();
            } catch (err) {
                setError('Failed to delete accessory');
                setTimeout(() => setError(''), 3000);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAccessory) {
                await accessoryService.updateAccessory(editingAccessory._id, formData);
                setSuccess('Accessory updated successfully');
            } else {
                await accessoryService.addAccessory(productId, formData);
                setSuccess('Accessory added successfully');
            }
            setTimeout(() => setSuccess(''), 3000);
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            setError(err.message || 'Operation failed');
            setTimeout(() => setError(''), 3000);
        }
    };

    const resetForm = () => {
        setEditingAccessory(null);
        setFormData({
            name: '',
            description: '',
            isRequired: false,
            replacementCost: ''
        });
    };

    if (loading) return <div className="p-6 text-gray-900 dark:text-white">Loading...</div>;

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            <button
                onClick={() => navigate('/rentals/products')}
                className="mb-4 flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Rental Products
            </button>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Manage Accessories
                    </h1>
                    {product && (
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            For Product: {product.name}
                        </p>
                    )}
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Accessory
                </button>
            </div>

            {error && <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">{error}</div>}
            {success && <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-4">{success}</div>}

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Required</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Replacement Cost</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {accessories.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <Package className="w-12 h-12 text-gray-300 mb-2" />
                                        <p>No accessories defined for this product</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            accessories.map((accessory) => (
                                <tr key={accessory._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{accessory.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">{accessory.description || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {accessory.isRequired ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                Required
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                                                Optional
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        ₹{accessory.replacementCost || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(accessory)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(accessory._id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {editingAccessory ? 'Edit Accessory' : 'Add New Accessory'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
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
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    placeholder="e.g. Battery, Lens, Charger"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    rows="2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Replacement Cost (₹)</label>
                                <input
                                    type="number"
                                    value={formData.replacementCost}
                                    onChange={(e) => setFormData({ ...formData, replacementCost: e.target.value })}
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isRequired"
                                    checked={formData.isRequired}
                                    onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isRequired" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                    Required (Must be returned with product)
                                </label>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center"
                                >
                                    <Save className="w-4 h-4 mr-2" /> Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageAccessories;
