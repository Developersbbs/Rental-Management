import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Calendar, DollarSign, Wrench, History, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import rentalInventoryItemService from '../../services/rentalInventoryItemService';

const RentalItemDetails = () => {
    const { itemId } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchItemDetails();
    }, [itemId]);

    const fetchItemDetails = async () => {
        try {
            setLoading(true);
            const data = await rentalInventoryItemService.getItemById(itemId);
            setItem(data);
        } catch (err) {
            toast.error('Failed to load item details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'rented': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'scrap': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'damaged': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
            case 'missing': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
                <div className="text-center text-gray-900 dark:text-white">Loading...</div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
                <div className="text-center text-gray-900 dark:text-white">Item not found</div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            <button
                onClick={() => navigate(-1)}
                className="mb-4 flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </button>

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {item.uniqueIdentifier}
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-400">
                                {item.rentalProductId?.name || 'N/A'}
                            </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(item.status)}`}>
                            {item.status}
                        </span>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Basic Information */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                            <Package className="w-5 h-5 mr-2 text-primary" />
                            Basic Information
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400">Serial Number</label>
                                <p className="text-gray-900 dark:text-white font-medium">{item.serialNumber || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400">Condition</label>
                                <p className="text-gray-900 dark:text-white font-medium capitalize">{item.condition}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400">Batch Number</label>
                                <p className="text-gray-900 dark:text-white font-medium">{item.batchNumber || 'N/A'}</p>
                            </div>
                            {item.damageReason && (
                                <div>
                                    <label className="text-sm text-red-500 dark:text-red-400">Damage Reason</label>
                                    <p className="text-gray-900 dark:text-white">{item.damageReason}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Purchase Information */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                            <DollarSign className="w-5 h-5 mr-2 text-primary" />
                            Purchase Information
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400">Purchase Date</label>
                                <p className="text-gray-900 dark:text-white font-medium">
                                    {item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400">Purchase Cost</label>
                                <p className="text-gray-900 dark:text-white font-medium">₹{item.purchaseCost || 0}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400">Inward Number</label>
                                <p className="text-gray-900 dark:text-white font-medium">
                                    {item.inwardId?.inwardNumber || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Rental Rates */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                            <DollarSign className="w-5 h-5 mr-2 text-primary" />
                            Rental Rates
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Hourly</span>
                                <span className="text-gray-900 dark:text-white font-medium">₹{item.hourlyRent || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Daily</span>
                                <span className="text-gray-900 dark:text-white font-medium">₹{item.dailyRent || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Monthly</span>
                                <span className="text-gray-900 dark:text-white font-medium">₹{item.monthlyRent || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Service Information */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                            <Wrench className="w-5 h-5 mr-2 text-primary" />
                            Service Information
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400">Last Service</label>
                                <p className="text-gray-900 dark:text-white font-medium">
                                    {item.lastServiceDate ? new Date(item.lastServiceDate).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400">Next Service Due</label>
                                <p className="text-gray-900 dark:text-white font-medium">
                                    {item.nextServiceDue ? new Date(item.nextServiceDue).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400">Service Count</label>
                                <p className="text-gray-900 dark:text-white font-medium">{item.serviceCount || 0}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400">Health Score</label>
                                <p className="text-gray-900 dark:text-white font-medium">{item.healthScore || 100}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Accessories */}
                {item.accessories && item.accessories.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Accessories</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {item.accessories.map((acc, idx) => (
                                <div key={idx} className="border dark:border-slate-700 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{acc.name}</h3>
                                    {acc.serialNumber && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">S/N: {acc.serialNumber}</p>
                                    )}
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded">
                                            {acc.condition}
                                        </span>
                                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded">
                                            {acc.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {item.notes && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Notes</h2>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.notes}</p>
                    </div>
                )}

                {/* History */}
                {item.history && item.history.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                            <History className="w-5 h-5 mr-2 text-primary" />
                            History
                        </h2>
                        <div className="space-y-4">
                            {item.history.slice().reverse().map((entry, idx) => (
                                <div key={idx} className="border-l-2 border-primary pl-4 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white capitalize">
                                                {entry.action.replace(/_/g, ' ')}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{entry.details}</p>
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(entry.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RentalItemDetails;
