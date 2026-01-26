import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, AlertTriangle, CheckCircle, XCircle, Search } from 'lucide-react';
import accessoryService from '../../services/accessoryService';

const AccessoryReport = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchStats = async () => {
        setLoading(true);
        try {
            const data = await accessoryService.getAccessoryStats();
            setStats(data);
            setError('');
        } catch (err) {
            setError('Failed to load accessory statistics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                <p className="text-slate-500 font-medium animate-pulse">Loading accessory data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Layers className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Accessory Report</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Inventory breakdown and status of all accessories</p>
                    </div>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all active:scale-95"
                    title="Refresh Stats"
                >
                    <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180" />
                    <span className="text-sm font-medium">Refresh</span>
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-xl animate-in shake duration-500">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Accessory Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Total</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Available</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Rented</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Maintenance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {stats.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic">No accessories found</td>
                                </tr>
                            ) : (
                                stats.map((stat, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">{stat.productName}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">{stat.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-white px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md">{stat.totalCount}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{stat.availableCount}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{stat.rentedCount}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {stat.maintenanceCount > 0 ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold">
                                                    <AlertTriangle className="w-3.5 h-3.5" /> {stat.maintenanceCount}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 dark:text-slate-600 text-sm">-</span>
                                            )}
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

export default AccessoryReport;

