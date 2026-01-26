import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, Plus, Search } from 'lucide-react';
import rentalInwardService from '../../services/rentalInwardService';

const RentalInwardHistory = () => {
    const navigate = useNavigate();
    const [inwards, setInwards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
        fetchInwards();
    }, [filters.page, filters.status, filters.startDate, filters.endDate]);

    const fetchInwards = async () => {
        try {
            setLoading(true);
            setError('');

            const params = {
                page: filters.page,
                limit: filters.limit
            };

            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.supplier) params.supplier = filters.supplier;
            if (filters.status) params.status = filters.status;

            const data = await rentalInwardService.getAllRentalInwards(params);
            setInwards(data.rentalInwards || []);
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

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value, page: 1 });
    };

    const handlePageChange = (newPage) => {
        setFilters({ ...filters, page: newPage });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this rental inward?')) {
            try {
                await rentalInwardService.deleteRentalInward(id);
                fetchInwards();
            } catch (err) {
                setError(err.message || 'Failed to delete rental inward');
            }
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', label: 'Completed' },
            pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', label: 'Pending' }
        };
        const config = statusConfig[status] || statusConfig.pending;
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
                            Rental Inward History
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            View all rental product inward records
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/rentals/inward')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5" />
                        New Inward
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
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
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            >
                                <option value="">All</option>
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            Loading rental inwards...
                        </div>
                    ) : inwards.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            No rental inwards found
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-slate-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                                Inward Number
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                                Date
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                                Items
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                                Total Amount
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                        {inwards.map((inward) => (
                                            <tr key={inward._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                                    {inward.inwardNumber}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{new Date(inward.receivedDate).toLocaleDateString('en-IN')}</span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(inward.receivedDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                    {inward.items?.length || 0} items
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                                                    ₹{inward.totalAmount?.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {getStatusBadge(inward.status)}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => navigate(`/rentals/inward/${inward._id}`)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(inward._id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600 flex items-center justify-between">
                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                        Showing {((pagination.currentPage - 1) * filters.limit) + 1} to {Math.min(pagination.currentPage * filters.limit, pagination.total)} of {pagination.total} inwards
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                                            disabled={pagination.currentPage === 1}
                                            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-600 dark:border-slate-600 dark:text-white"
                                        >
                                            Previous
                                        </button>
                                        <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300">
                                            Page {pagination.currentPage} of {pagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                                            disabled={pagination.currentPage === pagination.totalPages}
                                            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-600 dark:border-slate-600 dark:text-white"
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

export default RentalInwardHistory;
