import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, Users, Package, FileText, Calendar } from 'lucide-react';
import { getPerformanceDashboard } from '../../services/reportService';

const AnalyticsReports = () => {
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [period, setPeriod] = useState('month');

    useEffect(() => {
        fetchDashboardData();
    }, [period]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await getPerformanceDashboard({ period });
            if (response.success) {
                setDashboardData(response.data);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading dashboard data...</span>
            </div>
        );
    }

    const kpis = dashboardData?.kpis || {};

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white transition-colors">Performance Dashboard</h2>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer text-slate-700 dark:text-slate-300"
                        >
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="group p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02]">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-indigo-100 text-sm font-medium mb-1">Total Revenue</p>
                                <h3 className="text-2xl font-bold">{formatCurrency(kpis.totalRevenue)}</h3>
                            </div>
                            <div className="p-2 bg-white/20 rounded-lg">
                                <DollarSign className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-indigo-100 font-medium">For selected period</p>
                    </div>

                    <div className="group p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none transition-all hover:scale-[1.02]">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-emerald-100 text-sm font-medium mb-1">Active Rentals</p>
                                <h3 className="text-2xl font-bold">{kpis.activeRentals || 0}</h3>
                            </div>
                            <div className="p-2 bg-white/20 rounded-lg">
                                <FileText className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-emerald-100 font-medium">Currently rented out</p>
                    </div>

                    <div className="group p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none transition-all hover:scale-[1.02]">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-100 text-sm font-medium mb-1">Total Customers</p>
                                <h3 className="text-2xl font-bold">{kpis.totalCustomers || 0}</h3>
                            </div>
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-blue-100 font-medium">Registered customers</p>
                    </div>

                    <div className="group p-6 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-200 dark:shadow-none transition-all hover:scale-[1.02]">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-amber-100 text-sm font-medium mb-1">Available Items</p>
                                <h3 className="text-2xl font-bold">{kpis.availableItems || 0}</h3>
                            </div>
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Package className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-amber-100 font-medium">{kpis.rentedItems || 0} currently rented</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex justify-between items-center group transition-all hover:border-indigo-300">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Total Rentals</p>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{kpis.totalRentals || 0}</h3>
                            <p className="mt-1 text-xs text-slate-400">Total bookings in period</p>
                        </div>
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <FileText className="w-8 h-8" />
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex justify-between items-center group transition-all hover:border-rose-300">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Outstanding Dues</p>
                            <h3 className="text-2xl font-bold text-rose-600">{formatCurrency(kpis.outstandingDues)}</h3>
                            <p className="mt-1 text-xs text-slate-400">Pending payments</p>
                        </div>
                        <div className="p-4 bg-rose-50 dark:bg-rose-900/30 rounded-full text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all">
                            <DollarSign className="w-8 h-8" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">Quick Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-6 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2 uppercase tracking-wider">Utilization Rate</h4>
                        <p className="text-4xl font-black text-blue-600 dark:text-blue-400">
                            {kpis.rentedItems && (kpis.rentedItems + kpis.availableItems) > 0
                                ? `${Math.round((kpis.rentedItems / (kpis.rentedItems + kpis.availableItems)) * 100)}%`
                                : '0%'}
                        </p>
                        <p className="mt-2 text-sm text-blue-700/60 dark:text-blue-300/60 font-medium">Items currently in use</p>
                    </div>

                    <div className="p-6 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                        <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300 mb-2 uppercase tracking-wider">Avg. Revenue/Rental</h4>
                        <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            {kpis.totalRentals > 0
                                ? formatCurrency(kpis.totalRevenue / kpis.totalRentals)
                                : formatCurrency(0)}
                        </p>
                        <p className="mt-2 text-sm text-emerald-700/60 dark:text-emerald-300/60 font-medium">Revenue per booking</p>
                    </div>

                    <div className="p-6 rounded-xl bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30">
                        <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-2 uppercase tracking-wider">Collection Efficiency</h4>
                        <p className="text-4xl font-black text-orange-600 dark:text-orange-400">
                            {kpis.totalRevenue > 0
                                ? `${Math.round(((kpis.totalRevenue - kpis.outstandingDues) / kpis.totalRevenue) * 100)}%`
                                : '100%'}
                        </p>
                        <p className="mt-2 text-sm text-orange-700/60 dark:text-orange-300/60 font-medium">Payments collected</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsReports;

