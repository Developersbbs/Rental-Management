import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../redux/features/auth/loginSlice';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import rentalSupplierService from '../../services/rentalSupplierService';

const RentalSuppliers = () => {
    const user = useSelector(selectUser);
    const isSuperAdmin = user?.role === 'superadmin';
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [search, setSearch] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        gst: '',
        notes: ''
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const data = await rentalSupplierService.getAllRentalSuppliers({ limit: 100 });
            setSuppliers(data.rentalSuppliers || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch rental suppliers');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (editingSupplier) {
                await rentalSupplierService.updateRentalSupplier(editingSupplier._id, formData);
                setSuccess('Rental supplier updated successfully!');
            } else {
                await rentalSupplierService.createRentalSupplier(formData);
                setSuccess('Rental supplier created successfully!');
            }

            fetchSuppliers();
            handleCloseModal();
        } catch (err) {
            setError(err.message || 'Failed to save rental supplier');
        }
    };

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            contactPerson: supplier.contactPerson || '',
            email: supplier.email || '',
            phone: supplier.phone,
            address: supplier.address || '',
            gst: supplier.gst || '',
            notes: supplier.notes || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this rental supplier?')) {
            try {
                await rentalSupplierService.deleteRentalSupplier(id);
                setSuccess('Rental supplier deleted successfully!');
                fetchSuppliers();
            } catch (err) {
                setError(err.message || 'Failed to delete rental supplier');
            }
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingSupplier(null);
        setFormData({
            name: '',
            contactPerson: '',
            email: '',
            phone: '',
            address: '',
            gst: '',
            notes: ''
        });
    };

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(search.toLowerCase()) ||
        supplier.phone.includes(search) ||
        (supplier.email && supplier.email.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Rental Suppliers
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage suppliers for rental products
                        </p>
                    </div>
                    {isSuperAdmin && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            <Plus className="w-5 h-5" />
                            Add Supplier
                        </button>
                    )}
                </div>

                {/* Messages */}
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

                {/* Search */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search suppliers..."
                            className="w-full pl-10 pr-4 py-2 border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            Loading suppliers...
                        </div>
                    ) : filteredSuppliers.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            No rental suppliers found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Contact Person</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Phone</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">GST</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                    {filteredSuppliers.map((supplier) => (
                                        <tr key={supplier._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{supplier.name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{supplier.contactPerson || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{supplier.phone}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{supplier.email || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{supplier.gst || '-'}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex space-x-2">
                                                    {isSuperAdmin && (
                                                        <button
                                                            onClick={() => handleEdit(supplier)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {isSuperAdmin && (
                                                        <button
                                                            onClick={() => handleDelete(supplier._id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150]">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                {editingSupplier ? 'Edit Rental Supplier' : 'Add Rental Supplier'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Contact Person
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.contactPerson}
                                            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Phone *
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            required
                                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            GST Number
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.gst}
                                            onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows="3"
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-slate-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        {editingSupplier ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RentalSuppliers;
