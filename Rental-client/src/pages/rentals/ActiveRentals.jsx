import React, { useState, useEffect } from 'react';
import { Search, Eye, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import rentalService from '../../services/rentalService';
import { useNavigate } from 'react-router-dom';

const ActiveRentals = () => {
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchRentals();
    }, []);

    const fetchRentals = async () => {
        try {
            const data = await rentalService.getAllRentals();
            // Filter for active rentals only
            setRentals(data.filter(r => r.status === 'active' || r.status === 'overdue'));
        } catch (err) {
            setError('Failed to fetch rentals');
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (rental) => {
        const { status, expectedReturnTime } = rental;

        if (status === 'completed') {
            return { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Completed', icon: CheckCircle };
        }
        if (status === 'cancelled') {
            return { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', label: 'Cancelled', icon: null };
        }
        if (status === 'overdue') {
            return { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Overdue', icon: AlertTriangle };
        }

        // Check if rental is due today or overdue (for active rentals)
        if (expectedReturnTime) {
            const now = new Date();
            const expectedDate = new Date(expectedReturnTime);
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const expectedDay = new Date(expectedDate.getFullYear(), expectedDate.getMonth(), expectedDate.getDate());

            if (expectedDay < today) {
                return { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Overdue', icon: AlertTriangle };
            } else if (expectedDay.getTime() === today.getTime()) {
                return { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Due Today', icon: Clock };
            }
        }

        return { color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200', label: 'Active', icon: null };
    };

    const filteredRentals = rentals.filter(rental =>
        rental.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rental.rentalId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-6 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Active Rentals</h1>
                <button
                    onClick={() => navigate('/rentals/new')}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                >
                    New Rental
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search by customer or rental ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full md:w-1/3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-ring dark:bg-slate-800 dark:text-white"
                />
            </div>

            {/* Rentals List */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rental ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Out Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Expected Return</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredRentals.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">No active rentals found</td>
                                </tr>
                            ) : (
                                filteredRentals.map((rental) => (
                                    <tr key={rental._id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {rental.rentalId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            {rental.customer?.name}
                                            <div className="text-xs text-gray-400">{rental.customer?.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                            {rental.items.length} items
                                            <div className="text-xs text-gray-400 truncate max-w-xs">
                                                {rental.items.map(i => i.item?.rentalProductId?.name || 'Unknown').join(', ')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            {new Date(rental.outTime).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            {rental.expectedReturnTime ? (
                                                <div>
                                                    <div>{new Date(rental.expectedReturnTime).toLocaleString()}</div>
                                                    {(() => {
                                                        const now = new Date();
                                                        const expectedDate = new Date(rental.expectedReturnTime);
                                                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                                        const expectedDay = new Date(expectedDate.getFullYear(), expectedDate.getMonth(), expectedDate.getDate());

                                                        if (expectedDay < today) {
                                                            return <div className="text-xs text-red-600 dark:text-red-400 font-semibold">Overdue!</div>;
                                                        } else if (expectedDay.getTime() === today.getTime()) {
                                                            return <div className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">Due Today!</div>;
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">No return date set</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {(() => {
                                                const statusInfo = getStatusInfo(rental);
                                                const StatusIcon = statusInfo.icon;
                                                return (
                                                    <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${statusInfo.color}`}>
                                                        {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                                                        {statusInfo.label}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => navigate(`/rentals/return/${rental._id}`)}
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                                            >
                                                Return
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ActiveRentals;
