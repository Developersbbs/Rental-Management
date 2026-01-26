import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import rentalInwardService from '../../services/rentalInwardService';

const RentalInwardDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [inward, setInward] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchInwardDetails();
    }, [id]);

    const fetchInwardDetails = async () => {
        try {
            setLoading(true);
            const data = await rentalInwardService.getRentalInwardById(id);
            setInward(data);
        } catch (err) {
            setError(err.message || 'Failed to fetch rental inward details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center min-h-screen bg-gray-50 dark:bg-slate-900">
                <div className="text-gray-600 dark:text-gray-400">Loading details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 flex justify-center items-center min-h-screen bg-gray-50 dark:bg-slate-900">
                <div className="text-red-600 dark:text-red-400">{error}</div>
            </div>
        );
    }

    if (!inward) return null;

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/rentals/inward-history')}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Inward #{inward.inwardNumber}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Received on {new Date(inward.receivedDate).toLocaleDateString('en-IN')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
                    >
                        <Printer className="w-4 h-4" />
                        Print
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Received Date & Time</h3>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {new Date(inward.receivedDate).toLocaleDateString('en-IN')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(inward.receivedDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Amount</h3>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            ₹{inward.totalAmount?.toFixed(2)}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden mb-6">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Inward Items</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Batch No
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Condition
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Quantity
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Cost
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {inward.items?.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {item.product?.name || 'Unknown Product'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                            {item.batchNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 capitalize">
                                            {item.condition}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-right">
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-right">
                                            ₹{item.purchaseCost?.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-right">
                                            ₹{(item.quantity * item.purchaseCost).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 dark:bg-slate-700 font-semibold">
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-right text-gray-900 dark:text-white">
                                        Total
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                                        ₹{inward.totalAmount?.toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {inward.notes && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notes</h3>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {inward.notes}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RentalInwardDetails;
