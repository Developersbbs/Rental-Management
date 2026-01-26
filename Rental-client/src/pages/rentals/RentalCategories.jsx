import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import rentalCategoryService from '../../services/rentalCategoryService';

const RentalCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [search, setSearch] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await rentalCategoryService.getAllRentalCategories({ limit: 100 });
            setCategories(data.rentalCategories || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch rental categories');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (editingCategory) {
                await rentalCategoryService.updateRentalCategory(editingCategory._id, formData);
                setSuccess('Rental category updated successfully!');
            } else {
                await rentalCategoryService.createRentalCategory(formData);
                setSuccess('Rental category created successfully!');
            }

            fetchCategories();
            handleCloseModal();
        } catch (err) {
            setError(err.message || 'Failed to save rental category');
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this rental category?')) {
            try {
                await rentalCategoryService.deleteRentalCategory(id);
                setSuccess('Rental category deleted successfully!');
                fetchCategories();
            } catch (err) {
                setError(err.message || 'Failed to delete rental category');
            }
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '' });
    };

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(search.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Rental Categories
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage categories for rental products
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Add Category
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

                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search categories..."
                            className="w-full pl-10 pr-4 py-2 border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading categories...</div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">No rental categories found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                    {filteredCategories.map((category) => (
                                        <tr key={category._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{category.name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{category.description || '-'}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${category.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200'}`}>
                                                    {category.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex space-x-2">
                                                    <button onClick={() => handleEdit(category)} className="p-1.5 text-primary hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(category._id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150]">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                {editingCategory ? 'Edit Rental Category' : 'Add Rental Category'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={handleCloseModal} className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors shadow-sm">{editingCategory ? 'Update' : 'Create'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RentalCategories;
