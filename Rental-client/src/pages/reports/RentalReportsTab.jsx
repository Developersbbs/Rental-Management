import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
    getActiveRentalsReport,
    getRentalHistoryReport,
    getOverdueRentalsReport,
    getBookingCalendarReport,
    getInventoryStatusReport
} from '../../services/reportService';
import rentalService from '../../services/rentalService';
import { TrendingUp, DollarSign, Package as PackageIcon, LineChart, Clock, AlertCircle, Calendar, FileDown, Filter, ChevronLeft, ChevronRight, Archive } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const RentalReportsTab = () => {
    const [activeReport, setActiveReport] = useState('performance');
    const [loading, setLoading] = useState(false);
    const [activeRentals, setActiveRentals] = useState(null);
    const [rentalHistory, setRentalHistory] = useState(null);
    const [overdueRentals, setOverdueRentals] = useState(null);
    const [bookings, setBookings] = useState(null);
    const [inventoryReport, setInventoryReport] = useState(null);
    const [performanceData, setPerformanceData] = useState({
        revenue: [],
        popularProducts: [],
        stats: { activeRentals: 0, completedRentals: 0, totalRevenue: 0 }
    });

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        page: 1,
        limit: 20
    });

    useEffect(() => {
        fetchReportData();
    }, [activeReport]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            switch (activeReport) {
                case 'active':
                    const activeRes = await getActiveRentalsReport();
                    if (activeRes.success) setActiveRentals(activeRes.data);
                    break;
                case 'history':
                    const historyRes = await getRentalHistoryReport(filters);
                    if (historyRes.success) setRentalHistory(historyRes.data);
                    break;
                case 'overdue':
                    const overdueRes = await getOverdueRentalsReport();
                    if (overdueRes.success) setOverdueRentals(overdueRes.data);
                    break;
                case 'calendar':
                    const calendarRes = await getBookingCalendarReport(filters);
                    if (calendarRes.success) setBookings(calendarRes.data);
                    break;
                case 'inventory':
                    const invRes = await getInventoryStatusReport({ status: 'scrap' });
                    if (invRes.success) setInventoryReport(invRes.data);
                    break;
                case 'performance':
                    const [statsData, revData, popData] = await Promise.all([
                        rentalService.getRentalStats(),
                        rentalService.getRevenueReport(),
                        rentalService.getMostRentedProducts()
                    ]);
                    setPerformanceData({
                        stats: statsData,
                        revenue: revData,
                        popularProducts: popData
                    });
                    break;
            }
        } catch (error) {
            console.error('Error fetching rental report:', error);
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

    const formatDateTime = (date) => {
        return new Date(date).toLocaleString('en-IN');
    };

    const getStatusBadge = (status) => {
        const styles = {
            completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            overdue: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
            pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            cancelled: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
        };
        return `px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status.toLowerCase()] || styles.pending}`;
    };

    const renderActiveRentals = () => {
        if (!activeRentals) return null;

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Active Rentals</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">{activeRentals.summary?.totalActive || 0}</h3>
                        <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                            {activeRentals.summary?.totalItems} items currently out
                        </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Expected Revenue</p>
                        <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">{formatCurrency(activeRentals.summary?.expectedRevenue)}</h3>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Advance Collected</p>
                        <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight">{formatCurrency(activeRentals.summary?.advanceCollected)}</h3>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-bottom border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rental ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Out Time</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Exp. Return</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Amount</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {activeRentals.rentals?.map((rental) => (
                                <tr key={rental._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-200 font-mono">{rental.rentalId}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-slate-800 dark:text-white">{rental.customer?.name}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">{rental.customer?.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{rental.items?.length} item(s)</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatDateTime(rental.outTime)}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">{rental.expectedReturnTime ? formatDateTime(rental.expectedReturnTime) : 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(rental.totalAmount)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={getStatusBadge(rental.status)}>
                                            {rental.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderRentalHistory = () => {
        if (!rentalHistory) return null;

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Rentals</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">{rentalHistory.stats?.totalRentals || 0}</h3>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">{formatCurrency(rentalHistory.stats?.totalRevenue)}</h3>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Average Rental</p>
                        <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight">{formatCurrency(rentalHistory.stats?.averageRental)}</h3>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-bottom border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rental ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Out Time</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Return Time</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Items</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {rentalHistory.rentals?.map((rental) => (
                                <tr key={rental._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-200 font-mono">{rental.rentalId}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-white">{rental.customer?.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(rental.outTime)}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{rental.returnTime ? formatDate(rental.returnTime) : 'Still Active'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 text-center">{rental.items?.length}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(rental.totalAmount)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={getStatusBadge(rental.status)}>
                                            {rental.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {rentalHistory.pagination && (
                    <div className="flex items-center justify-between px-4 py-8 border-t border-slate-100 dark:border-slate-800">
                        <button
                            disabled={rentalHistory.pagination.page === 1}
                            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Page <span className="text-primary font-bold">{rentalHistory.pagination.page}</span> of <span className="text-slate-800 dark:text-slate-200">{rentalHistory.pagination.pages}</span>
                        </span>
                        <button
                            disabled={rentalHistory.pagination.page === rentalHistory.pagination.pages}
                            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderOverdueRentals = () => {
        if (!overdueRentals) return null;

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 rounded-2xl text-white shadow-lg shadow-rose-200 dark:shadow-none">
                        <p className="text-rose-100 text-sm font-medium mb-1">Overdue Rentals</p>
                        <h3 className="text-3xl font-black">{overdueRentals.summary?.totalOverdue || 0}</h3>
                        <p className="mt-2 text-xs text-rose-100 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Immediate follow-up required
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                        <p className="text-indigo-100 text-sm font-medium mb-1">Estimated Late Fees</p>
                        <h3 className="text-3xl font-black">{formatCurrency(overdueRentals.summary?.estimatedLateFees)}</h3>
                        <p className="mt-2 text-xs text-indigo-100 font-medium">Projected revenue adjustment</p>
                    </div>
                </div>

                {overdueRentals.overdueRentals?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                            <Clock className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">No overdue rentals!</h3>
                        <p className="text-slate-500">Everything is on schedule. Good job!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-rose-200 dark:border-rose-900/30 bg-white dark:bg-slate-800 shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-rose-50 dark:bg-rose-900/20 border-bottom border-rose-100 dark:border-rose-800">
                                    <th className="px-6 py-4 text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Rental ID</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Exp. Return</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider text-center">Hrs Overdue</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Late Fee</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-rose-50 dark:divide-rose-900/10">
                                {overdueRentals.overdueRentals?.map((rental) => (
                                    <tr key={rental._id} className="hover:bg-rose-50/30 dark:hover:bg-rose-900/5 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-rose-700 dark:text-rose-400 font-mono">{rental.rentalId}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-slate-800 dark:text-white">{rental.customer?.name}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{rental.customer?.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatDateTime(rental.expectedReturnTime)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-black">
                                                {rental.hoursOverdue} hrs
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-rose-600 dark:text-rose-400">{formatCurrency(rental.estimatedLateFee)}</td>
                                        <td className="px-6 py-4 text-sm font-black text-rose-800 dark:text-rose-200 text-right">{formatCurrency(rental.totalAmount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    const renderBookingCalendar = () => {
        if (!bookings) return null;

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white transition-colors">Upcoming & Active Bookings</h3>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-bottom border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rental ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Out Time</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Exp. Return</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Items</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {bookings.bookings?.map((booking) => (
                                <tr key={booking._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-200 font-mono">{booking.rentalId}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-white">{booking.customer?.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatDateTime(booking.outTime)}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{booking.expectedReturnTime ? formatDateTime(booking.expectedReturnTime) : 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 text-center">{booking.items?.length}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={getStatusBadge(booking.status)}>
                                            {booking.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderInventoryReport = () => {
        if (!inventoryReport) return null;

        const scrappedItems = inventoryReport.items || [];
        const totalScrappedCost = scrappedItems.reduce((sum, item) => sum + (item.purchaseCost || 0), 0);

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-2xl text-white shadow-lg shadow-orange-200 dark:shadow-none">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-orange-100 text-sm font-medium mb-1">Total Scrapped Items</p>
                                <h3 className="text-3xl font-black">{inventoryReport.summary?.total || 0}</h3>
                            </div>
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Archive className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-orange-100 font-medium">
                            Items permanently removed from inventory
                        </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Asset Value Lost</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">{formatCurrency(totalScrappedCost)}</h3>
                        <p className="mt-2 text-xs text-slate-400">Based on original purchase cost</p>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-bottom border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scrapped Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {scrappedItems.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        No scrapped items found.
                                    </td>
                                </tr>
                            ) : (
                                scrappedItems.map((item) => {
                                    // Find the history entry for scrap action
                                    const scrapEntry = item.history?.slice().reverse().find(h => h.action === 'scrapped') || {};

                                    return (
                                        <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-200 font-mono">{item.uniqueIdentifier}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                                {item.rentalProductId?.name || 'Unknown Product'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                                {scrapEntry.date ? formatDate(scrapEntry.date) : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 italic">
                                                {scrapEntry.details || 'No reason provided'}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100 text-right">
                                                {formatCurrency(item.purchaseCost)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderPerformance = () => {
        const { revenue, popularProducts, stats } = performanceData;

        const chartData = {
            labels: revenue.map(d => {
                const date = new Date();
                date.setMonth(d._id - 1);
                return date.toLocaleString('default', { month: 'short' });
            }),
            datasets: [
                {
                    label: 'Monthly Revenue (₹)',
                    data: revenue.map(d => d.totalRevenue),
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderColor: 'rgb(99, 102, 241)',
                    borderWidth: 2,
                    borderRadius: 8,
                },
            ],
        };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: false },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        };

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded">Annual</span>
                        </div>
                        <p className="text-indigo-100 text-sm font-medium">Total Revenue</p>
                        <h3 className="text-3xl font-black">{formatCurrency(stats.totalRevenue)}</h3>
                    </div>

                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:scale-[1.02]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Clock className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Active Rentals</p>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white">{stats.activeRentals}</h3>
                    </div>

                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:scale-[1.02]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                <PackageIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Completed</p>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white">{stats.completedRentals}</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Revenue Chart */}
                    <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Revenue Trends
                            </h3>
                        </div>
                        <div className="h-[300px]">
                            <Bar options={chartOptions} data={chartData} />
                        </div>
                    </div>

                    {/* Popular Products */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <PackageIcon className="w-5 h-5 text-primary" />
                            Top Products
                        </h3>
                        <div className="space-y-4">
                            {popularProducts.slice(0, 5).map((product, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 transition-all hover:border-primary/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[120px]">{product.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{product.rentCount} Rentals</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(product.totalRevenue)}</p>
                                </div>
                            ))}
                            {popularProducts.length === 0 && (
                                <p className="text-center text-slate-400 py-8 text-sm italic">No data available for the current period</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleExport = () => {
        let csvContent = [];
        let filename = `rental_report_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`;

        if (activeReport === 'active' && activeRentals) {
            csvContent.push('--- Active Rentals Report ---');
            csvContent.push(`Total Active,${activeRentals.summary?.totalActive}`);
            csvContent.push(`Expected Revenue,${activeRentals.summary?.expectedRevenue}`);
            csvContent.push('');
            csvContent.push('Rental ID,Customer,Phone,Items,Out Time,Expected Return,Advance,Total,Status');
            activeRentals.rentals?.forEach(r => {
                csvContent.push(`${r.rentalId},${r.customer?.name},${r.customer?.phone},${r.items?.length},${new Date(r.outTime).toLocaleString()},${r.expectedReturnTime ? new Date(r.expectedReturnTime).toLocaleString() : 'N/A'},${r.advancePayment},${r.totalAmount},${r.status}`);
            });
        } else if (activeReport === 'history' && rentalHistory) {
            csvContent.push('--- Rental History Report ---');
            csvContent.push(`Total Rentals,${rentalHistory.stats?.totalRentals}`);
            csvContent.push(`Total Revenue,${rentalHistory.stats?.totalRevenue}`);
            csvContent.push('');
            csvContent.push('Rental ID,Customer,Out Time,Return Time,Items,Amount,Status');
            rentalHistory.rentals?.forEach(r => {
                csvContent.push(`${r.rentalId},${r.customer?.name},${new Date(r.outTime).toLocaleDateString()},${r.returnTime ? new Date(r.returnTime).toLocaleDateString() : 'Active'},${r.items?.length},${r.totalAmount},${r.status}`);
            });
        } else if (activeReport === 'overdue' && overdueRentals) {
            csvContent.push('--- Overdue Rentals Report ---');
            csvContent.push(`Total Overdue,${overdueRentals.summary?.totalOverdue}`);
            csvContent.push(`Est. Late Fees,${overdueRentals.summary?.estimatedLateFees}`);
            csvContent.push('');
            csvContent.push('Rental ID,Customer,Phone,Expected Return,Hours Overdue,Late Fee,Total Amount');
            overdueRentals.overdueRentals?.forEach(r => {
                csvContent.push(`${r.rentalId},${r.customer?.name},${r.customer?.phone},${new Date(r.expectedReturnTime).toLocaleString()},${r.hoursOverdue},${r.estimatedLateFee},${r.totalAmount}`);
            });
        } else if (activeReport === 'calendar' && bookings) {
            csvContent.push('--- Booking Calendar Report ---');
            csvContent.push('Rental ID,Customer,Out Time,Expected Return,Items,Status');
            bookings.bookings?.forEach(b => {
                csvContent.push(`${b.rentalId},${b.customer?.name},${new Date(b.outTime).toLocaleString()},${b.expectedReturnTime ? new Date(b.expectedReturnTime).toLocaleString() : 'N/A'},${b.items?.length},${b.status}`);
            });
        }

        if (csvContent.length > 0) {
            const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                <LineChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">Rental Reports</h2>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {[
                                { id: 'performance', icon: <TrendingUp className="w-4 h-4" />, label: 'Performance' },
                                { id: 'active', icon: <LineChart className="w-4 h-4" />, label: 'Active Rentals' },
                                { id: 'history', icon: <Clock className="w-4 h-4" />, label: 'Rental History' },
                                { id: 'overdue', icon: <AlertCircle className="w-4 h-4" />, label: 'Overdue' },
                                { id: 'calendar', icon: <Calendar className="w-4 h-4" />, label: 'Calendar' },
                                { id: 'inventory', icon: <Archive className="w-4 h-4" />, label: 'Scrapped Items' }
                            ].map((report) => (
                                <button
                                    key={report.id}
                                    onClick={() => setActiveReport(report.id)}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeReport === report.id
                                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
                                        : 'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {report.icon}
                                    {report.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {(activeReport === 'history' || activeReport === 'calendar') && (
                        <div className="mt-8 flex flex-col md:flex-row md:items-end gap-6 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                        className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all transition-colors"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">End Date</label>
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                        className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={fetchReportData}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                >
                                    <Filter className="w-4 h-4" /> Apply Filters
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                                >
                                    <FileDown className="w-4 h-4" /> Export
                                </button>
                            </div>
                        </div>
                    )}



                    {(activeReport === 'active' || activeReport === 'overdue' || activeReport === 'inventory') && (
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                            >
                                <FileDown className="w-4 h-4" /> Export Report
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
                            <p className="text-slate-500 font-medium animate-pulse">Gathering report intelligence...</p>
                        </div>
                    ) : (
                        <>
                            {activeReport === 'performance' && renderPerformance()}
                            {activeReport === 'active' && renderActiveRentals()}
                            {activeReport === 'history' && renderRentalHistory()}
                            {activeReport === 'overdue' && renderOverdueRentals()}
                            {activeReport === 'calendar' && renderBookingCalendar()}
                            {activeReport === 'inventory' && renderInventoryReport()}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RentalReportsTab;

