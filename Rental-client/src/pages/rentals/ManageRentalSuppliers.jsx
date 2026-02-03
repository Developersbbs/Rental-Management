// components/ManageRentalSuppliers.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../redux/features/auth/loginSlice';
import {
    Plus, Edit, Trash2, Eye, Building, Truck, AlertCircle,
    Search, Filter, Phone, Mail, MapPin
} from 'lucide-react';
import rentalSupplierService from '../../services/rentalSupplierService';

const ManageRentalSuppliers = () => {
    const user = useSelector(selectUser);
    const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'admin'; // Assuming admin can also manage

    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    // Stats might not be available in rentalSupplierService yet, so we might need to compute or mock them
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, fromStats: false });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
        limit: 10
    });

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // create, edit, view
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
        },
        status: 'active',
        paymentTerms: 'Ne 30',
        notes: ''
    });

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const fetchSuppliers = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            setError('');

            const params = {
                page,
                limit: pagination.limit,
                ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
                ...(statusFilter !== 'all' && { status: statusFilter })
            };

            const data = await rentalSupplierService.getAllRentalSuppliers(params);

            // Handle different response structures if necessary (e.g. if API returns { rentalSuppliers, ... } vs { suppliers, ... })
            const suppliersList = data.rentalSuppliers || data.suppliers || data.docs || [];

            setSuppliers(suppliersList);
            setFilteredSuppliers(suppliersList);

            setPagination({
                page: data.currentPage || 1,
                totalPages: data.totalPages || 1,
                total: data.total || suppliersList.length,
                limit: pagination.limit
            });

            // Compute local stats if API doesn't provide them
            const localStats = {
                total: data.total || suppliersList.length,
                active: suppliersList.filter(s => s.status === 'active').length,
                inactive: suppliersList.filter(s => s.status === 'inactive').length,
                pending: suppliersList.filter(s => s.status === 'pending').length,
                fromStats: false // indicated computed
            };
            setStats(localStats);


        } catch (err) {
            console.error("Error fetching rental suppliers:", err);
            setError(err.message || 'Failed to fetch rental suppliers');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm, statusFilter, pagination.limit]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            let data;
            if (modalMode === 'create') {
                data = await rentalSupplierService.createRentalSupplier(formData);
            } else {
                data = await rentalSupplierService.updateRentalSupplier(selectedSupplier._id, formData);
            }

            setSuccess(data.message || `Rental Vendor ${modalMode === 'create' ? 'created' : 'updated'} successfully!`);
            setShowModal(false);
            resetForm();
            fetchSuppliers(pagination.page);
        } catch (err) {
            setError(err.message || `Failed to ${modalMode} rental vendor`);
        }
    };

    const handleDelete = async () => {
        setError('');
        setSuccess('');
        try {
            const data = await rentalSupplierService.deleteRentalSupplier(selectedSupplier._id);
            setSuccess(data.message || 'Rental Vendor deleted successfully!');
            setShowDeleteModal(false);
            fetchSuppliers(pagination.page);
        } catch (err) {
            setError(err.message || 'Failed to delete rental vendor');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            contactPerson: '',
            email: '',
            phone: '',
            address: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
            },
            status: 'active',
            paymentTerms: 'Net 30',
            notes: ''
        });
        setSelectedSupplier(null);
        setModalMode('create');
    };

    const openCreateModal = () => {
        resetForm();
        setModalMode('create');
        setShowModal(true);
    };

    const openEditModal = (supplier) => {
        setFormData({
            name: supplier.name,
            contactPerson: supplier.contactPerson,
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.address || {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
            },
            status: supplier.status || 'active',
            paymentTerms: supplier.paymentTerms || 'Net 30',
            notes: supplier.notes || ''
        });
        setSelectedSupplier(supplier);
        setModalMode('edit');
        setShowModal(true);
    };

    const openViewModal = (supplier) => {
        setSelectedSupplier(supplier);
        setModalMode('view');
        setShowModal(true);
    };

    const openDeleteModal = (supplier) => {
        setSelectedSupplier(supplier);
        setShowDeleteModal(true);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchSuppliers(newPage);
        }
    };

    if (loading && !suppliers.length) {
        return (
            <div className="flex justify-center items-center min-h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors duration-300">
            {/* Header */}
            <div className="mb-4 sm:mb-8">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">Rental Vendor Management</h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400">Manage vendors for sub-rentals</p>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-lg flex items-center">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                    <span className="flex-1 text-sm sm:text-base">{error}</span>
                </div>
            )}

            {success && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-3 rounded-lg">
                    <span className="text-sm sm:text-base">{success}</span>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center">
                        <Building className="w-10 h-10 text-primary mr-4" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Total Vendors</h3>
                            <p className="text-3xl font-bold text-primary">{stats.total}</p>
                        </div>
                    </div>
                </div>
                {/* Simple stats for now */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center">
                        <Truck className="w-10 h-10 text-green-600 mr-4" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Active</h3>
                            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm mb-6 border border-gray-200 dark:border-slate-700">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 flex-1">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search vendors..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <Filter className="pointer-events-none absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white min-w-[150px]"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Add Supplier Button */}
                    <button
                        onClick={openCreateModal}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Vendor
                    </button>
                </div>
            </div>

            {/* Suppliers Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Vendor Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-slate-400">
                                        No rental vendors found
                                    </td>
                                </tr>
                            ) : (
                                filteredSuppliers.map((supplier) => (
                                    <tr key={supplier._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{supplier.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-slate-400 flex items-center mt-1">
                                                    <MapPin className="w-3 h-3 mr-1" />
                                                    {supplier.address?.city || 'No City'}, {supplier.address?.state || 'No State'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm text-gray-900 dark:text-slate-100">{supplier.contactPerson}</div>
                                                <div className="block mt-1">
                                                    <div className="text-sm text-gray-500 dark:text-slate-400 flex items-center">
                                                        <Phone className="w-3 h-3 mr-1" />
                                                        {supplier.phone}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-slate-400 flex items-center mt-0.5">
                                                        <Mail className="w-3 h-3 mr-1" />
                                                        {supplier.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${supplier.status === 'active'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                }`}>
                                                {supplier.status ? supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1) : 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => openViewModal(supplier)}
                                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(supplier)}
                                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(supplier)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination - Reuse or simplify */}
                {pagination.totalPages > 1 && (
                    <div className="flex justify-center p-4 border-t border-gray-200 dark:border-slate-700 gap-2">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => handlePageChange(pagination.page - 1)}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1">Page {pagination.page} of {pagination.totalPages}</span>
                        <button
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => handlePageChange(pagination.page + 1)}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Supplier Modal (Create/Edit/View) */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-2xl my-8">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                            {modalMode === 'create' && 'Add New Rental Vendor'}
                            {modalMode === 'edit' && 'Edit Rental Vendor'}
                            {modalMode === 'view' && 'Vendor Details'}
                        </h2>

                        {modalMode === 'view' ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Name</label>
                                        <p className="text-gray-900 dark:text-white">{selectedSupplier.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Contact Person</label>
                                        <p className="text-gray-900 dark:text-white">{selectedSupplier.contactPerson}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Email</label>
                                        <p className="text-gray-900 dark:text-white">{selectedSupplier.email}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Phone</label>
                                        <p className="text-gray-900 dark:text-white">{selectedSupplier.phone}</p>
                                    </div>
                                </div>
                                {/* Address and Notes */}
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Address</label>
                                    <p className="text-gray-900 dark:text-white">
                                        {selectedSupplier.address?.street}, {selectedSupplier.address?.city}, {selectedSupplier.address?.state} {selectedSupplier.address?.zipCode}
                                    </p>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vendor Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Person *</label>
                                        <input
                                            type="text"
                                            value={formData.contactPerson}
                                            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email *</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone *</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                                    <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            placeholder="Street"
                                            value={formData.address.street}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, street: e.target.value }
                                            })}
                                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        />
                                        <input
                                            type="text"
                                            placeholder="City"
                                            value={formData.address.city}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, city: e.target.value }
                                            })}
                                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        />
                                        <input
                                            type="text"
                                            placeholder="State"
                                            value={formData.address.state}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, state: e.target.value }
                                            })}
                                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Country"
                                            value={formData.address.country}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, country: e.target.value }
                                            })}
                                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        rows="2"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                    >
                                        {modalMode === 'create' ? 'Create Vendor' : 'Update Vendor'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Confirm Delete</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to delete vendor "{selectedSupplier?.name}"? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageRentalSuppliers;
