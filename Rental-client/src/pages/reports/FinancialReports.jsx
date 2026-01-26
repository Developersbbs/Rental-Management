import React, { useState, useEffect } from 'react';
import {
    Banknote,
    FileText,
    AlertCircle,
    CreditCard,
    Download,
    Calendar,
    Filter,
    TrendingUp,
    History,
    PieChart,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Clock
} from 'lucide-react';
import {
    getRevenueReport,
    getTransactionReport,
    getOutstandingDuesReport,
    getPaymentMethodAnalysis
} from '../../services/reportService';

const FinancialReports = () => {
    const [activeReport, setActiveReport] = useState('revenue');
    const [loading, setLoading] = useState(false);
    const [revenueData, setRevenueData] = useState(null);
    const [transactions, setTransactions] = useState(null);
    const [outstandingDues, setOutstandingDues] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState(null);

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        groupBy: 'month',
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
                case 'revenue':
                    const revResponse = await getRevenueReport(filters);
                    if (revResponse.success) setRevenueData(revResponse.data);
                    break;
                case 'transactions':
                    const transResponse = await getTransactionReport(filters);
                    if (transResponse.success) setTransactions(transResponse.data);
                    break;
                case 'dues':
                    const duesResponse = await getOutstandingDuesReport();
                    if (duesResponse.success) setOutstandingDues(duesResponse.data);
                    break;
                case 'payment-methods':
                    const pmResponse = await getPaymentMethodAnalysis(filters);
                    if (pmResponse.success) setPaymentMethods(pmResponse.data);
                    break;
            }
        } catch (error) {
            console.error('Error fetching financial report:', error);
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

    const renderRevenueReport = () => {
        if (!revenueData) return null;

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none transition-all hover:scale-[1.02]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Banknote className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded">Total</span>
                        </div>
                        <p className="text-indigo-100 text-sm font-medium">Total Revenue</p>
                        <h3 className="text-3xl font-black">{formatCurrency(revenueData.totalRevenue)}</h3>
                        <p className="mt-4 text-xs text-indigo-100 font-medium">For selected period</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-700/50 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            <h3 className="font-bold text-slate-800 dark:text-white">Revenue by Type</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Count</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {revenueData.revenueByType?.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors text-sm">
                                            <td className="px-6 py-3 font-medium capitalize text-slate-700 dark:text-slate-300">{item._id}</td>
                                            <td className="px-6 py-3 text-center text-slate-600 dark:text-slate-400">{item.count}</td>
                                            <td className="px-6 py-3 text-right font-bold text-slate-800 dark:text-white">{formatCurrency(item.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>t
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-700/50 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-indigo-500" />
                            <h3 className="font-bold text-slate-800 dark:text-white transition-colors">Revenue by Payment Method</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Payment Method</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Transactions</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {revenueData.revenueByPaymentMethod?.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors text-sm">
                                            <td className="px-6 py-3 font-medium capitalize text-slate-700 dark:text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                                    {item._id?.replace('_', ' ')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-center text-slate-600 dark:text-slate-400">{item.count}</td>
                                            <td className="px-6 py-3 text-right font-bold text-slate-800 dark:text-white">{formatCurrency(item.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderTransactionReport = () => {
        if (!transactions) return null;

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-primary/30">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400">
                                <Banknote className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Amount</span>
                        </div>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white">{formatCurrency(transactions.summary?.totalAmount)}</h4>
                    </div>

                    <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-emerald-500/30">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                                <ArrowUpRight className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paid Amount</span>
                        </div>
                        <h4 className="text-xl font-black text-emerald-600 dark:text-emerald-500">{formatCurrency(transactions.summary?.paidAmount)}</h4>
                    </div>

                    <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-rose-500/30">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-rose-600">
                                <ArrowDownRight className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Due Amount</span>
                        </div>
                        <h4 className="text-xl font-black text-rose-600 dark:text-rose-500">{formatCurrency(transactions.summary?.dueAmount)}</h4>
                    </div>

                    <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-indigo-500/30">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600">
                                <History className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transactions</span>
                        </div>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white">{transactions.summary?.count || 0}</h4>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 font-medium">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bill Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Financials</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {transactions.transactions?.map((transaction) => (
                                    <tr key={transaction._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-200 transition-colors">#{transaction.billNumber}</p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(transaction.billDate)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{transaction.customerName}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-[10px] font-bold uppercase tracking-wider">
                                                {transaction.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex justify-between items-center w-32">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatCurrency(transaction.totalAmount)}</span>
                                                </div>
                                                <div className="flex justify-between items-center w-32">
                                                    <span className="text-[10px] text-emerald-500 font-bold uppercase">Paid</span>
                                                    <span className="text-xs font-bold text-emerald-600">{formatCurrency(transaction.paidAmount)}</span>
                                                </div>
                                                {transaction.dueAmount > 0 && (
                                                    <div className="flex justify-between items-center w-32 border-t border-slate-100 dark:border-slate-700 pt-1 mt-1">
                                                        <span className="text-[10px] text-rose-500 font-bold uppercase">Due</span>
                                                        <span className="text-xs font-black text-rose-600">{formatCurrency(transaction.dueAmount)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${transaction.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                transaction.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                }`}>
                                                {transaction.paymentStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {transactions.pagination && (
                    <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">
                            Page <span className="text-slate-900 dark:text-white font-bold">{transactions.pagination.page}</span> of <span className="text-slate-900 dark:text-white font-bold">{transactions.pagination.pages}</span>
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={transactions.pagination.page === 1}
                                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 text-slate-400 hover:text-primary transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                disabled={transactions.pagination.page === transactions.pagination.pages}
                                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                className="p-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-primary/90 transition-all shadow-sm"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderOutstandingDues = () => {
        if (!outstandingDues) return null;

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-100 dark:shadow-none col-span-1 sm:col-span-2">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <span className="bg-white/20 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded">Action Required</span>
                        </div>
                        <p className="text-rose-100 text-sm font-medium">Total Outstanding</p>
                        <h3 className="text-3xl font-black">{formatCurrency(outstandingDues.summary?.totalOutstanding)}</h3>
                        <p className="mt-4 text-xs font-bold text-rose-100 italic">{outstandingDues.summary?.billCount} unpaid bills across platform</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">0-30 Days (Current)</div>
                        <div className="text-2xl font-black text-emerald-600 transition-colors">{formatCurrency(outstandingDues.aging?.current)}</div>
                        <div className="mt-2 h-1.5 w-full bg-slate-50 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">90+ Days (Critical)</div>
                        <div className="text-2xl font-black text-rose-600 transition-colors">{formatCurrency(outstandingDues.aging?.days90Plus)}</div>
                        <div className="mt-2 h-1.5 w-full bg-slate-50 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-700/50 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-rose-500" />
                        <h3 className="font-bold text-slate-800 dark:text-white transition-colors">Outstanding Bills Tracking</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bill #</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer Contact</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Overdue Period</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {outstandingDues.outstandingBills?.map((bill) => {
                                    const daysOverdue = Math.floor((new Date() - new Date(bill.billDate)) / (1000 * 60 * 60 * 24));
                                    return (
                                        <tr key={bill._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">#{bill.billNumber}</td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">{bill.customerName}</p>
                                                    <p className="text-[11px] text-slate-500 font-medium italic">{bill.customerPhone}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center w-32">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Total</span>
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatCurrency(bill.totalAmount)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center w-32">
                                                        <span className="text-[10px] text-rose-500 font-bold uppercase tracking-tight">Due</span>
                                                        <span className="text-xs font-black text-rose-600">{formatCurrency(bill.dueAmount)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${daysOverdue > 60 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 shadow-sm' :
                                                    daysOverdue > 30 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    }`}>
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {daysOverdue} Days Overdue
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderPaymentMethods = () => {
        if (!paymentMethods) return null;

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2 mb-2">
                    <PieChart className="w-6 h-6 text-indigo-500" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">Payment Method Distribution</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {paymentMethods.map((method) => (
                        <div key={method._id} className="group p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md hover:border-primary/50 hover:-translate-y-1">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 w-fit mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 transition-colors">{method._id?.replace('_', ' ')}</h3>
                            <div className="text-2xl font-black text-slate-800 dark:text-white mb-2 transition-colors">{formatCurrency(method.totalAmount)}</div>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-400 pt-3 border-t border-slate-50 dark:border-slate-700 transition-colors">
                                <span>{method.count} Trx</span>
                                <span className="text-indigo-500">Avg: {formatCurrency(method.averageTransaction)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const handleExport = () => {
        let csvContent = [];
        let filename = `financial_report_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`;

        if (activeReport === 'revenue' && revenueData) {
            csvContent.push('--- Revenue Report ---');
            csvContent.push(`Total Revenue,${revenueData.totalRevenue}`);
            csvContent.push('');
            csvContent.push('--- Revenue by Type ---');
            csvContent.push('Type,Count,Revenue');
            revenueData.revenueByType?.forEach(item => {
                csvContent.push(`${item._id},${item.count},${item.revenue}`);
            });
            csvContent.push('');
            csvContent.push('--- Revenue by Payment Method ---');
            csvContent.push('Method,Transactions,Amount');
            revenueData.revenueByPaymentMethod?.forEach(item => {
                csvContent.push(`${item._id},${item.count},${item.revenue}`);
            });
        } else if (activeReport === 'transactions' && transactions) {
            csvContent.push('--- Transaction Report ---');
            csvContent.push(`Total Amount,${transactions.summary?.totalAmount}`);
            csvContent.push(`Paid Amount,${transactions.summary?.paidAmount}`);
            csvContent.push(`Due Amount,${transactions.summary?.dueAmount}`);
            csvContent.push(`Count,${transactions.summary?.count}`);
            csvContent.push('');
            csvContent.push('Bill #,Date,Customer,Type,Total,Paid,Due,Status');
            transactions.transactions?.forEach(t => {
                csvContent.push(`${t.billNumber},${new Date(t.billDate).toLocaleDateString()},${t.customerName},${t.type},${t.totalAmount},${t.paidAmount},${t.dueAmount},${t.paymentStatus}`);
            });
        } else if (activeReport === 'dues' && outstandingDues) {
            csvContent.push('--- Outstanding Dues Report ---');
            csvContent.push(`Total Outstanding,${outstandingDues.summary?.totalOutstanding}`);
            csvContent.push(`Bill Count,${outstandingDues.summary?.billCount}`);
            csvContent.push('');
            csvContent.push('Bill #,Date,Customer,Phone,Total,Paid,Due,Days Overdue');
            outstandingDues.outstandingBills?.forEach(bill => {
                const daysOverdue = Math.floor((new Date() - new Date(bill.billDate)) / (1000 * 60 * 60 * 24));
                csvContent.push(`${bill.billNumber},${new Date(bill.billDate).toLocaleDateString()},${bill.customerName},${bill.customerPhone},${bill.totalAmount},${bill.paidAmount},${bill.dueAmount},${daysOverdue}`);
            });
        } else if (activeReport === 'payment-methods' && paymentMethods) {
            csvContent.push('--- Payment Method Analysis ---');
            csvContent.push('Method,Total Amount,Count,Average Transaction');
            paymentMethods.forEach(method => {
                csvContent.push(`${method._id},${method.totalAmount},${method.count},${method.averageTransaction}`);
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
        <div className="space-y-8 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4 transition-all">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <Banknote className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Financial Hub</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Monitor revenue, transactions and outstanding payments</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 transition-all">
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-0 px-2 cursor-pointer"
                        />
                        <span className="text-slate-300">|</span>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-0 px-2 cursor-pointer"
                        />
                    </div>
                    <button
                        onClick={fetchReportData}
                        className="px-5 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-bold text-xs flex items-center gap-2 active:scale-95 shadow-lg shadow-primary/20"
                    >
                        <Filter className="w-3.5 h-3.5" />
                        Apply Filters
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold text-xs flex items-center gap-2 active:scale-95 shadow-sm"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export Report
                    </button>
                </div>
            </div>

            <div className="z-10 flex p-1.5 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner max-w-4xl transition-all">
                {[
                    { id: 'revenue', icon: TrendingUp, label: 'Revenue Insights' },
                    { id: 'transactions', icon: History, label: 'Transaction Logs' },
                    { id: 'dues', icon: AlertCircle, label: 'Outstanding Dues' },
                    { id: 'payment-methods', icon: CreditCard, label: 'Payment Channels' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveReport(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeReport === tab.id
                            ? 'bg-white dark:bg-slate-800 text-primary shadow-lg scale-[1.02]'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeReport === tab.id ? 'text-primary' : ''}`} />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="relative min-h-[500px]">
                {loading && (
                    <div className="absolute inset-0 z-40 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-3xl transition-all">
                        <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-primary border-t-2 border-t-transparent mb-4"></div>
                        <p className="text-sm font-black text-primary animate-pulse uppercase tracking-[0.3em] transition-all">Analyzing Finances...</p>
                    </div>
                )}

                {!loading && activeReport === 'revenue' && renderRevenueReport()}
                {!loading && activeReport === 'transactions' && renderTransactionReport()}
                {!loading && activeReport === 'dues' && renderOutstandingDues()}
                {!loading && activeReport === 'payment-methods' && renderPaymentMethods()}
            </div>
        </div>
    );
};

export default FinancialReports;

