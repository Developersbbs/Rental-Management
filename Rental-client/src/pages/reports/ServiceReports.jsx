import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import {
    Wrench,
    Banknote,
    AlertTriangle,
    CalendarCheck,
    Loader2,
    TrendingUp,
    Download,
    History,
    Activity,
    ChevronDown,
    Filter,
    ArrowUpRight,
    PieChart,
    BarChart3
} from 'lucide-react';
import serviceRecordService from '../../services/serviceRecordService';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

const ServiceReports = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState('month');
    const [analyticsData, setAnalyticsData] = useState(null);
    const [upcomingMaintenance, setUpcomingMaintenance] = useState({ upcoming: [], overdue: [] });
    const [costAnalysis, setCostAnalysis] = useState(null);

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            let startDate = new Date();
            if (dateRange === 'month') {
                startDate.setMonth(startDate.getMonth() - 1);
            } else if (dateRange === 'quarter') {
                startDate.setMonth(startDate.getMonth() - 3);
            } else if (dateRange === 'year') {
                startDate.setFullYear(startDate.getFullYear() - 1);
            } else {
                startDate = null;
            }

            const params = startDate ? { startDate: startDate.toISOString() } : {};

            const [analytics, maintenance, costs] = await Promise.all([
                serviceRecordService.getServiceAnalytics(params),
                serviceRecordService.getUpcomingMaintenance(30),
                serviceRecordService.getCostAnalysis({ ...params, groupBy: dateRange === 'year' ? 'month' : 'week' })
            ]);

            setAnalyticsData(analytics);
            setUpcomingMaintenance(maintenance);
            setCostAnalysis(costs);
        } catch (err) {
            console.error('Error fetching service reports:', err);
            setError('Failed to load report data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-b-2 border-primary animate-spin"></div>
                    <Wrench className="w-5 h-5 text-primary/40 absolute inset-0 m-auto animate-pulse" />
                </div>
                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] animate-pulse">Analyzing Service Ecosystem...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-4 text-rose-700 dark:text-rose-400 animate-in fade-in duration-300">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <div>
                    <p className="font-bold text-sm">Synchronisation Error</p>
                    <p className="text-xs opacity-80">{error}</p>
                </div>
            </div>
        );
    }

    // Chart Data Preparation - Using Indigo/Slate Theme Colors
    const serviceTypeData = {
        labels: analyticsData?.serviceTypeBreakdown?.map(item => item._id.charAt(0).toUpperCase() + item._id.slice(1)) || [],
        datasets: [
            {
                data: analyticsData?.serviceTypeBreakdown?.map(item => item.count) || [],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',  // Indigo 500
                    'rgba(244, 63, 94, 0.8)',   // Rose 500
                    'rgba(245, 158, 11, 0.8)',  // Amber 500
                    'rgba(16, 185, 129, 0.8)',  // Emerald 500
                ],
                borderColor: [
                    '#4f46e5',
                    '#e11d48',
                    '#d97706',
                    '#059669',
                ],
                borderWidth: 2,
                hoverOffset: 12,
            },
        ],
    };

    const costTrendData = {
        labels: costAnalysis?.costOverTime?.map(item => item._id) || [],
        datasets: [
            {
                label: 'Total Cost',
                data: costAnalysis?.costOverTime?.map(item => item.totalCost) || [],
                backgroundColor: 'rgba(99, 102, 241, 0.6)',
                borderColor: '#6366f1',
                borderWidth: 2,
                borderRadius: 4,
                tension: 0.4,
            },
            {
                label: 'Labor Component',
                data: costAnalysis?.costOverTime?.map(item => item.laborCost) || [],
                backgroundColor: 'rgba(148, 163, 184, 0.4)',
                borderColor: '#94a6b8',
                borderWidth: 2,
                borderRadius: 4,
                tension: 0.4,
            }
        ],
    };

    const handleExport = () => {
        if (!analyticsData) return;

        const csvContent = [];
        csvContent.push('--- Service Health Metrics ---');
        csvContent.push('Metric,Value');
        csvContent.push(`Total Service Logs,${analyticsData.totalRecords}`);
        csvContent.push(`Aggregate Value,${analyticsData.totalCost}`);
        csvContent.push(`Unit Average Cost,${analyticsData.averageCost.toFixed(2)}`);
        csvContent.push('');

        if (analyticsData.serviceTypeBreakdown) {
            csvContent.push('--- Topology Breakdown ---');
            csvContent.push('Category,Volume,Financial Impact');
            analyticsData.serviceTypeBreakdown.forEach(item => {
                csvContent.push(`${item._id},${item.count},${item.totalCost}`);
            });
            csvContent.push('');
        }

        if (upcomingMaintenance.upcoming && upcomingMaintenance.upcoming.length > 0) {
            csvContent.push('--- Forecasted Maintenance ---');
            csvContent.push('Asset ID,Entity Registry,Target Window');
            upcomingMaintenance.upcoming.forEach(item => {
                csvContent.push(`${item.uniqueIdentifier},${item.rentalProductId?.name || 'N/A'},${new Date(item.nextServiceDue).toLocaleDateString()}`);
            });
            csvContent.push('');
        }

        if (analyticsData.mostServicedItems) {
            csvContent.push('--- Critical Service Assets ---');
            csvContent.push('Asset ID,Asset Identity,Frequency,Total Overhead');
            analyticsData.mostServicedItems.forEach(item => {
                csvContent.push(`${item.item?.uniqueIdentifier || 'N/A'},${item.item?.rentalProductId?.name || 'N/A'},${item.count},${item.totalCost}`);
            });
        }

        const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `service_intelligence_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-10 min-h-screen animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-primary/10 rounded-3xl backdrop-blur-md border border-primary/20 shadow-lg shadow-primary/5">
                        <Wrench className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Service Cockpit</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Maintenance performance tracking & financial optimization</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto self-end lg:self-center">
                    <div className="relative group">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary shadow-sm hover:border-primary/50 transition-all cursor-pointer"
                        >
                            <option value="month">T-30 Days Window</option>
                            <option value="quarter">Quarterly Horizon</option>
                            <option value="year">Annual Lifecycle</option>
                            <option value="all">Historical Depth</option>
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-primary transition-colors" />
                    </div>
                    <button
                        onClick={handleExport}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all font-black text-xs flex items-center gap-2 active:scale-95 shadow-lg shadow-emerald-200 dark:shadow-none"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Intelligence Export
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 shadow-sm transition-all hover:scale-[1.02] hover:border-indigo-500/30 group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Activity className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Total Logs</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{analyticsData?.totalRecords || 0}</h3>
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 shadow-sm transition-all hover:scale-[1.02] hover:border-emerald-500/30 group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <Banknote className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-emerald-600/70 dark:text-emerald-500/70 text-[10px] font-black uppercase tracking-wider mb-1">Financial Load</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">₹{analyticsData?.totalCost?.toLocaleString() || 0}</h3>
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 shadow-sm transition-all hover:scale-[1.02] hover:border-primary/30 group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-slate-600 dark:text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Unit Avg Cost</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">₹{Math.round(analyticsData?.averageCost || 0).toLocaleString()}</h3>
                </div>

                <div className="p-6 rounded-3xl bg-rose-600 text-white shadow-xl shadow-rose-200 dark:shadow-none transition-all hover:scale-[1.02] group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded uppercase tracking-widest">CRITICAL</span>
                    </div>
                    <p className="text-rose-100 text-[10px] font-black uppercase tracking-wider mb-1 text-opacity-80">Overdue Items</p>
                    <h3 className="text-3xl font-black">{upcomingMaintenance?.overdue?.length || 0}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-primary" />
                            Topology Breakdown
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Period</span>
                        </div>
                    </div>
                    <div className="h-72 flex justify-center">
                        <Pie data={serviceTypeData} options={{
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        padding: 20,
                                        usePointStyle: true,
                                        font: { size: 10, weight: '700' },
                                        color: '#94a3b8'
                                    }
                                }
                            }
                        }} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-emerald-500" />
                            Cost Dynamics
                        </h3>
                    </div>
                    <div className="h-72">
                        <Bar data={costTrendData} options={{
                            maintainAspectRatio: false,
                            responsive: true,
                            scales: {
                                y: {
                                    grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false },
                                    ticks: { font: { size: 10, weight: '600' }, color: '#94a3b8' }
                                },
                                x: {
                                    grid: { display: false },
                                    ticks: { font: { size: 10, weight: '600' }, color: '#94a3b8' }
                                }
                            }
                        }} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:shadow-md">
                    <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <CalendarCheck className="w-5 h-5 text-primary" />
                            Forecasted Maintenance
                        </h3>
                        <span className="px-3 py-1 bg-white dark:bg-slate-800 text-xs font-black text-primary border border-primary/20 rounded-full">Next 30D</span>
                    </div>
                    <div className="p-8">
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {upcomingMaintenance?.upcoming?.length > 0 ? (
                                upcomingMaintenance.upcoming.map(item => (
                                    <div key={item._id} className="group flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-white dark:hover:bg-slate-800 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-primary font-black text-xs group-hover:scale-110 transition-all">
                                                ID
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white text-sm tracking-tight">{item.uniqueIdentifier}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.rentalProductId?.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-primary px-3 py-1 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                                                {new Date(item.nextServiceDue).toLocaleDateString()}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">DUE DATE</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                                    <ShieldAlert className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="text-xs font-black uppercase tracking-widest">Horizon is clear</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:shadow-md">
                    <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <History className="w-5 h-5 text-amber-500" />
                            Critical Service Assets
                        </h3>
                    </div>
                    <div className="p-8">
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {analyticsData?.mostServicedItems?.length > 0 ? (
                                analyticsData.mostServicedItems.map(item => (
                                    <div key={item._id} className="group flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent hover:border-amber-500/20 hover:bg-white dark:hover:bg-slate-800 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 font-black text-xs group-hover:rotate-45 transition-all">
                                                <Wrench className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white text-sm tracking-tight">{item.item?.uniqueIdentifier || 'Asset Entry'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.item?.rentalProductId?.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 uppercase tracking-wider">
                                                {item.count} Iterations
                                            </span>
                                            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tighter">Impact: ₹{item.totalCost.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                                    <Activity className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="text-xs font-black uppercase tracking-widest">No historical spikes</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceReports;

const ShieldAlert = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
);
