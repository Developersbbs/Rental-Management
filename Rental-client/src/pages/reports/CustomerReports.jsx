import React, { useState, useEffect } from 'react';
import { Users, List, Star, ChartLine, Search, Filter, Crown, Medal, TrendingUp, Calendar, Mail, Phone, MapPin } from 'lucide-react';
import {
    getCustomerListReport,
    getCustomerActivityReport,
    getTopCustomersReport
} from '../../services/reportService';

const CustomerReports = () => {
    const [activeReport, setActiveReport] = useState('activity');
    const [loading, setLoading] = useState(false);
    const [customerList, setCustomerList] = useState(null);
    const [customerActivity, setCustomerActivity] = useState(null);
    const [topCustomers, setTopCustomers] = useState(null);

    const [filters, setFilters] = useState({
        search: '',
        page: 1,
        limit: 20,
        metric: 'revenue'
    });

    useEffect(() => {
        fetchReportData();
    }, [activeReport]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            switch (activeReport) {
                case 'list':
                    const listRes = await getCustomerListReport(filters);
                    if (listRes.success) setCustomerList(listRes.data);
                    break;
                case 'activity':
                    const activityRes = await getCustomerActivityReport(filters);
                    if (activityRes.success) setCustomerActivity(activityRes.data);
                    break;
                case 'top':
                    const topRes = await getTopCustomersReport({ ...filters, limit: 20 });
                    if (topRes.success) setTopCustomers(topRes.data);
                    break;
            }
        } catch (error) {
            console.error('Error fetching customer report:', error);
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

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN');
    };

    const renderCustomerList = () => {
        if (!customerList) return null;

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex-1 space-y-1.5 w-full">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Search Customers</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Name, email, or phone..."
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none dark:text-white"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                    </div>
                    <button
                        onClick={fetchReportData}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all font-medium text-sm flex items-center gap-2 active:scale-95 whitespace-nowrap"
                    >
                        <Filter className="w-4 h-4" />
                        Apply Filters
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact Info</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Address</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID Proof</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {customerList.customers?.map((customer) => (
                                    <tr key={customer._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                    {customer.name?.charAt(0)}
                                                </div>
                                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">{customer.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                                    <Mail className="w-3 h-3 text-slate-400" />
                                                    {customer.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                                    <Phone className="w-3 h-3 text-slate-400" />
                                                    {customer.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2 max-w-[200px]">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                                                <span className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{customer.address || 'Not provided'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[11px] font-bold uppercase tracking-wider">
                                                {customer.idProofType || 'None'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {customerList.pagination && (
                    <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Showing Page <span className="text-slate-900 dark:text-slate-200">{customerList.pagination.page}</span> of <span className="text-slate-900 dark:text-slate-200">{customerList.pagination.pages}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={customerList.pagination.page === 1}
                                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                disabled={customerList.pagination.page === customerList.pagination.pages}
                                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderCustomerActivity = () => {
        if (!customerActivity) return null;

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                        Rental Activity Summary
                    </h3>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Rentals</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Spent</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Rental</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-rose-500 dark:text-rose-400 uppercase tracking-wider">Missing Profit</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Rental</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {customerActivity?.map((activity) => (
                                    <tr key={activity._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">{activity.customer?.name}</p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">{activity.customer?.phone}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md text-xs font-bold">
                                                {activity.rentalCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-800 dark:text-white">{formatCurrency(activity.totalSpent)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {formatCurrency(activity.averageRental)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm font-bold ${activity.missingProfit > 0 ? 'text-rose-600 dark:text-rose-400' : activity.missingProfit < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                                {formatCurrency(activity.missingProfit)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                {formatDate(activity.lastRental)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderTopCustomers = () => {
        if (!topCustomers) return null;

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500" />
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">Top Performing Customers</h3>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
                        <select
                            value={filters.metric}
                            onChange={(e) => setFilters({ ...filters, metric: e.target.value })}
                            className="bg-transparent border-none text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-0 outline-none px-2 pr-8"
                        >
                            <option value="revenue">Sort by Revenue</option>
                            <option value="frequency">Sort by Rental Frequency</option>
                        </select>
                        <button
                            onClick={fetchReportData}
                            className="px-4 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all font-bold text-xs active:scale-95"
                        >
                            Apply
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {topCustomers?.slice(0, 3).map((customer, index) => {
                        const gradients = [
                            'from-amber-400 to-amber-600 shadow-amber-200 dark:shadow-none',
                            'from-slate-400 to-slate-600 shadow-slate-200 dark:shadow-none',
                            'from-orange-400 to-orange-600 shadow-orange-200 dark:shadow-none'
                        ];
                        const icons = [<Crown className="w-6 h-6" />, <Medal className="w-6 h-6" />, <Star className="w-6 h-6" />];
                        const labels = ["Most Valuable", "Runner Up", "Third Place"];

                        return (
                            <div key={customer._id} className={`group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br ${gradients[index]} text-white shadow-xl transition-all hover:scale-[1.03] hover:-translate-y-1`}>
                                <div className="absolute top-0 right-0 p-4 opacity-20 transition-transform group-hover:scale-125 group-hover:rotate-12">
                                    {icons[index]}
                                </div>
                                <div className="relative z-10">
                                    <p className="text-white/80 text-[11px] font-bold uppercase tracking-widest mb-1">{labels[index]}</p>
                                    <h3 className="text-xl font-bold mb-4">{customer.customer?.name}</h3>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-white/90">Total Revenue</p>
                                        <div className="text-3xl font-black">{formatCurrency(customer.totalSpent)}</div>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-white/20 flex justify-between items-center text-xs font-semibold">
                                        <span>{customer.rentalCount} Rentals</span>
                                        <span className="bg-white/20 px-2 py-1 rounded">Avg: {formatCurrency(customer.averageSpent)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white">Top 20 Rankings</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16">Rank</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Rentals</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Spent</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg/Rental</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Rental</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {topCustomers?.map((customer, index) => (
                                    <tr key={customer._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black ${index === 0 ? 'bg-amber-100 text-amber-600' :
                                                index === 1 ? 'bg-slate-100 text-slate-600' :
                                                    index === 2 ? 'bg-orange-100 text-orange-600' :
                                                        'bg-slate-50 text-slate-400'
                                                }`}>
                                                #{index + 1}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">{customer.customer?.name}</p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">{customer.customer?.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{customer.rentalCount}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(customer.totalSpent)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                                            {formatCurrency(customer.averageSpent)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(customer.lastRental)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 min-h-screen">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                    <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Customer Reports</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Analyze customer trends, activity, and rankings</p>
                </div>
            </div>

            <div className="z-10 flex p-1.5 bg-slate-100 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner max-w-2xl">
                {[
                    { id: 'activity', icon: ChartLine, label: 'Rental Activity' },
                    { id: 'top', icon: Star, label: 'Top Customers' },
                    { id: 'list', icon: List, label: 'Customer Directory' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveReport(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${activeReport === tab.id
                            ? 'bg-white dark:bg-slate-800 text-primary shadow-lg scale-[1.02]'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeReport === tab.id ? 'text-primary' : ''}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 z-40 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-2xl transition-all">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300 animate-pulse uppercase tracking-widest">Generating {activeReport} report...</p>
                    </div>
                )}

                {!loading && activeReport === 'list' && renderCustomerList()}
                {!loading && activeReport === 'activity' && renderCustomerActivity()}
                {!loading && activeReport === 'top' && renderTopCustomers()}
            </div>
        </div>
    );
};

export default CustomerReports;

