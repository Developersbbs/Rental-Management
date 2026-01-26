import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import productItemService from '../services/productItemService';
import productService from '../services/productService'; // Assuming you have this

const ManageProductItems = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal state for Add/Edit
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        uniqueIdentifier: '',
        status: 'available',
        condition: 'good',
        purchaseDate: '',
        purchasePrice: ''
    });

    useEffect(() => {
        fetchData();
    }, [productId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch product details (you might need to implement getProductById in productService if not exists)
            // For now, assuming we can get it or just fetch items if product details are not critical immediately
            // const productData = await productService.getProductById(productId); 
            // setProduct(productData);

            const itemsData = await productItemService.getItemsByProduct(productId);
            setItems(itemsData);
        } catch (err) {
            setError('Failed to fetch data');
            console.error(err);
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
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await productItemService.deleteItem(id);
                setSuccess('Item deleted successfully');
                fetchData();
            } catch (err) {
                setError('Failed to delete item');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await productItemService.updateItem(editingItem._id, formData);
                setSuccess('Item updated successfully');
            } else {
                await productItemService.addItem(productId, formData);
                setSuccess('Item added successfully');
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
        setFormData({
            uniqueIdentifier: '',
            status: 'available',
            condition: 'good',
            purchaseDate: '',
            purchasePrice: ''
        });
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            <button onClick={() => navigate(-1)} className="mb-4 flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Products
            </button>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Manage Items {product ? `- ${product.name}` : ''}
                </h1>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                </button>
            </div>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Unique ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Condition</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Purchase Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">No items found</td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.uniqueIdentifier}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${item.status === 'available' ? 'bg-green-100 text-green-800' :
                                                item.status === 'rented' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 capitalize">{item.condition}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900 mr-3"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {editingItem ? 'Edit Item' : 'Add New Item'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unique Identifier *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.uniqueIdentifier}
                                    onChange={(e) => setFormData({ ...formData, uniqueIdentifier: e.target.value })}
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    placeholder="e.g. SN-001"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                >
                                    <option value="available">Available</option>
                                    <option value="rented">Rented</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="scrap">Scrap</option>
                                    <option value="missing">Missing</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition</label>
                                <select
                                    value={formData.condition}
                                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                >
                                    <option value="new">New</option>
                                    <option value="good">Good</option>
                                    <option value="fair">Fair</option>
                                    <option value="poor">Poor</option>
                                    <option value="damaged">Damaged</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Date</label>
                                <input
                                    type="date"
                                    value={formData.purchaseDate}
                                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Price</label>
                                <input
                                    type="number"
                                    value={formData.purchasePrice}
                                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
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

export default ManageProductItems;
