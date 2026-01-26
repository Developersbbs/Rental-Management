import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, Plus, Package, Tag, ArrowLeft } from 'lucide-react';
import rentalInwardService from '../services/rentalInwardService';
import accessoryInwardService from '../services/accessoryInwardService';
import supplierService from '../services/supplierService';

const UnifiedInwardHistory = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('rental'); // 'rental' or 'selling'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [suppliers, setSuppliers] = useState([]);

    // Data States
    const [rentalInwards, setRentalInwards] = useState([]);
    const [accessoryInwards, setAccessoryInwards] = useState([]);

    // Filter States
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        supplier: '',
        status: '',
        page: 1,
        limit: 10
    });

    const [pagination, setPagination] = useState({
        totalPages: 1,
        currentPage: 1,
        total: 0
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    useEffect(() => {
        if (activeTab === 'rental') {
            fetchRentalInwards();
        } else {
            fetchAccessoryInwards();
        }
    }, [activeTab, filters.page, filters.status, filters.startDate, filters.endDate, filters.supplier]);

    const fetchSuppliers = async () => {
        try {
            const data = await supplierService.getAllSuppliers();
            setSuppliers(data.suppliers || data || []);
        } catch (err) {
            console.error('Failed to fetch suppliers', err);
        }
    };

    const fetchRentalInwards = async () => {
        try {
            setLoading(true);
            setError('');
            const params = { ...filters };
            const data = await rentalInwardService.getAllRentalInwards(params);
            setRentalInwards(data.rentalInwards || []);
            setPagination({
                totalPages: data.totalPages || 1,
                currentPage: data.currentPage || 1,
                total: data.total || 0
            });
        } catch (err) {
            setError(err.message || 'Failed to fetch rental inwards');
        } finally {
            setLoading(false);
        }
    };

    const fetchAccessoryInwards = async () => {
        try {
            setLoading(true);
            setError('');
            const params = { ...filters };
            const data = await accessoryInwardService.getAllAccessoryInwards(params);
            setAccessoryInwards(data.accessoryInwards || []);
            setPagination({
                totalPages: data.totalPages || 1,
                currentPage: data.currentPage || 1,
                total: data.total || 0
            });
        } catch (err) {
            setError(err.message || 'Failed to fetch accessory inwards');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleDelete = async (id, type) => {
        if (window.confirm('Are you sure you want to delete this inward record?')) {
            try {
                if (type === 'rental') {
                    await rentalInwardService.deleteRentalInward(id);
                    fetchRentalInwards();
                } else {
                    // Implement delete for accessory inward if needed
                    alert('Delete functionality for Accessory Inward not yet implemented completely.');
                }
            } catch (err) {
                setError(err.message || 'Failed to delete inward');
            }
        }
    };

    const getStatusBadge = (status) => {
        const config = status === 'completed'
            ? { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', label: 'Completed' }
            : { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', label: 'Pending' };

        return (
            <span className={`px-2 py-1 rounded text-xs font-semibold ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Inward History
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            View all product inward records
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/rentals/inward')}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        New Inward
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-1 flex gap-2 max-w-md">
                    <button
                        onClick={() => { setActiveTab('rental'); setFilters(prev => ({ ...prev, page: 1 })); }}
                        className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'rental'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        <Package className="w-4 h-4" />
                        Rental Products
                    </button>
                    <button
                        onClick={() => { setActiveTab('selling'); setFilters(prev => ({ ...prev, page: 1 })); }}
                        className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'selling'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        <Tag className="w-4 h-4" />
                        Selling Accessories
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-6 transition-all duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Supplier
                            </label>
                            <select
                                value={filters.supplier}
                                onChange={(e) => handleFilterChange('supplier', e.target.value)}
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring"
                            >
                                <option value="">All Suppliers</option>
                                {suppliers.map(s => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring"
                            >
                                <option value="">All Statuses</option>
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3 rounded mb-4 animate-fade-in">
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden transition-all duration-200">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                            Loading records...
                        </div>
                    ) : (activeTab === 'rental' ? rentalInwards : accessoryInwards).length === 0 ? (
                        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                            No records found for {activeTab === 'rental' ? 'Rental Products' : 'Selling Accessories'}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-slate-700 border-b dark:border-slate-600">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Inward No.
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Supplier
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Items
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Total Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                                        {(activeTab === 'rental' ? rentalInwards : accessoryInwards).map((inward) => (
                                            <tr key={inward._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                                                    {inward.inwardNumber}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {new Date(inward.receivedDate).toLocaleDateString('en-IN')}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {new Date(inward.receivedDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {inward.supplier?.name || 'N/A'}
                                                    {inward.supplierInvoiceNumber && (
                                                        <div className="text-xs text-gray-400">Ref: {inward.supplierInvoiceNumber}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                                        {inward.items?.length || 0} items
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                                    ₹{inward.totalAmount?.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {getStatusBadge(inward.status)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600 flex items-center justify-between">
                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                        Showing {((pagination.currentPage - 1) * filters.limit) + 1} to {Math.min(pagination.currentPage * filters.limit, pagination.total)} of {pagination.total} records
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                                            disabled={pagination.currentPage === 1}
                                            className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                                            disabled={pagination.currentPage === pagination.totalPages}
                                            className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UnifiedInwardHistory;
