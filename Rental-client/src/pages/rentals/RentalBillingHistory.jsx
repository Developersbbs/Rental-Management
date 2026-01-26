import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Download, Printer, Search, Filter, Calendar, DollarSign, X, AlertCircle } from 'lucide-react';
import rentalService from '../../services/rentalService';
import billService from '../../services/billService';
import paymentAccountService from '../../services/paymentAccountService';

const RentalBillingHistory = () => {
    const navigate = useNavigate();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [downloading, setDownloading] = useState(null);

    // Payment modal state
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
    const [paymentFormData, setPaymentFormData] = useState({
        amount: '',
        paymentMethod: 'cash',
        paymentAccountId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: ''
    });
    const [paymentSubmitting, setPaymentSubmitting] = useState(false);
    const [paymentError, setPaymentError] = useState('');
    const [showPaymentHistory, setShowPaymentHistory] = useState(false);
    const [paymentAccounts, setPaymentAccounts] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        paymentStatus: '',
        search: '',
        page: 1,
        limit: 10
    });

    const [pagination, setPagination] = useState({
        totalPages: 1,
        currentPage: 1,
        total: 0
    });

    useEffect(() => {
        fetchBills();
    }, [filters.page, filters.paymentStatus, filters.startDate, filters.endDate]);

    const fetchBills = async () => {
        try {
            setLoading(true);
            setError('');

            const params = {
                page: filters.page,
                limit: filters.limit,
                type: 'rental'
            };

            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;

            const data = await rentalService.getRentalBills(params);
            setBills(data.bills || []);
            setPagination({
                totalPages: data.totalPages || 1,
                currentPage: data.currentPage || 1,
                total: data.total || 0
            });
        } catch (err) {
            setError(err.message || 'Failed to fetch billing history');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setFilters({ ...filters, page: 1 });
        fetchBills();
    };

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value, page: 1 });
    };

    const handlePageChange = (newPage) => {
        setFilters({ ...filters, page: newPage });
    };

    const handlePreviewPDF = async (billId, billNumber) => {
        try {
            setDownloading(billId);
            const blob = await rentalService.downloadInvoice(billId);
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } catch (err) {
            setError(err.message || 'Failed to preview invoice');
        } finally {
            setDownloading(null);
        }
    };

    const handlePrintPDF = async (billId, billNumber) => {
        try {
            setDownloading(billId);
            const blob = await rentalService.downloadInvoice(billId);
            const url = window.URL.createObjectURL(blob);

            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = url;
            document.body.appendChild(iframe);

            iframe.onload = () => {
                iframe.contentWindow.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    window.URL.revokeObjectURL(url);
                }, 1000);
            };
        } catch (err) {
            setError(err.message || 'Failed to print invoice');
        } finally {
            setDownloading(null);
        }
    };

    const handleDownloadPDF = async (billId, billNumber) => {
        try {
            setDownloading(billId);
            const blob = await rentalService.downloadInvoice(billId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice-${billNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err.message || 'Failed to download invoice');
        } finally {
            setDownloading(null);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            paid: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', label: 'Paid' },
            partial: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', label: 'Partial' },
            pending: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', label: 'Pending' }
        };
        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`px-2 py-1 rounded text-xs font-semibold ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const openPaymentModal = (bill) => {
        setSelectedBillForPayment(bill);
        setPaymentFormData({
            amount: (bill.dueAmount || bill.totalAmount).toString(),
            paymentMethod: 'cash',
            paymentAccountId: '',
            paymentDate: new Date().toISOString().split('T')[0],
            notes: ''
        });
        setPaymentError('');
        setShowPaymentModal(true);
        fetchPaymentAccounts();
    };

    const fetchPaymentAccounts = async () => {
        try {
            const data = await paymentAccountService.getAllPaymentAccounts({ status: 'active' });
            setPaymentAccounts(data.accounts || []);
        } catch (error) {
            console.error('Error fetching payment accounts:', error);
            setPaymentAccounts([]);
        }
    };

    const resetPaymentForm = () => {
        setPaymentFormData({
            amount: '',
            paymentMethod: 'cash',
            paymentAccountId: '',
            paymentDate: new Date().toISOString().split('T')[0],
            notes: ''
        });
        setPaymentError('');
        setSelectedBillForPayment(null);
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (paymentSubmitting) return;
        setPaymentError('');
        setPaymentSubmitting(true);
        try {
            const paymentData = {
                amount: parseFloat(paymentFormData.amount),
                paymentMethod: paymentFormData.paymentMethod,
                paymentAccountId: paymentFormData.paymentAccountId || undefined,
                paymentDate: paymentFormData.paymentDate,
                notes: paymentFormData.notes
            };
            await billService.recordPayment(selectedBillForPayment._id, paymentData);
            setSuccess(`Payment of ₹${paymentData.amount} recorded successfully!`);
            setShowPaymentModal(false);
            resetPaymentForm();
            fetchBills();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setPaymentError(err.message || 'Failed to record payment');
        } finally {
            setPaymentSubmitting(false);
        }
    };

    const filteredBills = bills.filter(bill => {
        if (!filters.search) return true;
        const searchLower = filters.search.toLowerCase();
        return (
            bill.billNumber?.toLowerCase().includes(searchLower) ||
            bill.customerName?.toLowerCase().includes(searchLower) ||
            bill.rentalDetails?.rentalId?.toString().includes(searchLower)
        );
    });

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Rental Billing History
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        View and manage all rental invoices
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Date Range */}
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

                        {/* Payment Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Payment Status
                            </label>
                            <select
                                value={filters.paymentStatus}
                                onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            >
                                <option value="">All</option>
                                <option value="paid">Paid</option>
                                <option value="partial">Partial</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>

                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Search
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Bill#, Customer, Rental ID"
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="w-full p-2 pr-10 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                />
                                <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 p-3 rounded mb-4">
                        {success}
                    </div>
                )}

                {/* Table */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            Loading billing history...
                        </div>
                    ) : filteredBills.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            No bills found
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-slate-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Bill Number
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Rental ID
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Total Amount
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                        {filteredBills.map((bill) => (
                                            <tr key={bill._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                                    {bill.billNumber}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                    {new Date(bill.billDate).toLocaleDateString('en-IN')}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                    {bill.customerName}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                    {bill.rentalDetails?.rentalId || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                                                    ₹{bill.totalAmount?.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {getStatusBadge(bill.paymentStatus)}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="flex space-x-2">
                                                        {((bill.dueAmount && bill.dueAmount > 0) || bill.paymentStatus === 'pending' || bill.paymentStatus === 'partial') && (
                                                            <button
                                                                onClick={() => openPaymentModal(bill)}
                                                                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded flex items-center gap-1 bg-green-50 dark:bg-green-900/10"
                                                                title="Record Payment"
                                                            >
                                                                <DollarSign className="w-4 h-4" />
                                                                <span className="text-xs font-medium">Pay</span>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handlePreviewPDF(bill._id, bill.billNumber)}
                                                            disabled={downloading === bill._id}
                                                            className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded disabled:opacity-50"
                                                            title="Preview"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handlePrintPDF(bill._id, bill.billNumber)}
                                                            disabled={downloading === bill._id}
                                                            className="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded disabled:opacity-50"
                                                            title="Print"
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownloadPDF(bill._id, bill.billNumber)}
                                                            disabled={downloading === bill._id}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded disabled:opacity-50"
                                                            title="Download"
                                                        >
                                                            <Download className="w-4 h-4" />
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
                                        Showing {((pagination.currentPage - 1) * filters.limit) + 1} to {Math.min(pagination.currentPage * filters.limit, pagination.total)} of {pagination.total} bills
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

                {/* Payment Modal */}
                {showPaymentModal && selectedBillForPayment && (
                    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[150] p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 z-10">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Record Payment</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Bill #{selectedBillForPayment.billNumber} - {selectedBillForPayment.customerName}
                                        </p>
                                    </div>
                                    <button onClick={() => { setShowPaymentModal(false); resetPaymentForm(); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-6">
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">₹{selectedBillForPayment.totalAmount?.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
                                            <p className="text-lg font-bold text-green-600 dark:text-green-400">₹{(selectedBillForPayment.paidAmount || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Due</p>
                                            <p className="text-lg font-bold text-red-600 dark:text-red-400">₹{(selectedBillForPayment.dueAmount || selectedBillForPayment.totalAmount).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                                {paymentError && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center">
                                        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                                        {paymentError}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Payment Amount <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input type="number" step="0.01" min="0.01" max={selectedBillForPayment.dueAmount || selectedBillForPayment.totalAmount} value={paymentFormData.amount} onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })} className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white" required />
                                        <button type="button" onClick={() => setPaymentFormData({ ...paymentFormData, amount: (selectedBillForPayment.dueAmount || selectedBillForPayment.totalAmount).toString() })} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">Full Amount</button>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum: ₹{(selectedBillForPayment.dueAmount || selectedBillForPayment.totalAmount).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method <span className="text-red-500">*</span></label>
                                    <select value={paymentFormData.paymentMethod} onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white" required>
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="upi">UPI</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="credit">Credit</option>
                                    </select>
                                </div>

                                {/* Payment Account - Only show for non-cash payments */}
                                {paymentFormData.paymentMethod !== 'cash' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Payment Account {paymentFormData.paymentMethod === 'bank_transfer' && <span className="text-red-500">*</span>}
                                        </label>
                                        <select
                                            value={paymentFormData.paymentAccountId}
                                            onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentAccountId: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                                            required={paymentFormData.paymentMethod === 'bank_transfer'}
                                        >
                                            <option value="">Select Account</option>
                                            {paymentAccounts.map(account => (
                                                <option key={account._id} value={account._id}>
                                                    {account.name} - ₹{account.currentBalance.toLocaleString()}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {paymentFormData.paymentMethod === 'bank_transfer' ? 'Required for bank transfers' : 'Optional - Select account to record this transaction'}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Date</label>
                                    <input type="date" value={paymentFormData.paymentDate} onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
                                    <textarea value={paymentFormData.notes} onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })} rows="3" className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white resize-none" placeholder="Add payment reference or notes..." />
                                </div>
                                {selectedBillForPayment.paymentHistory && selectedBillForPayment.paymentHistory.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment History</h3>
                                            <button type="button" onClick={() => setShowPaymentHistory(!showPaymentHistory)} className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                                                {showPaymentHistory ? 'Hide' : 'Show'} ({selectedBillForPayment.paymentHistory.length})
                                            </button>
                                        </div>
                                        {showPaymentHistory && (
                                            <div className="border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-50 dark:bg-slate-700">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Date</th>
                                                            <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Amount</th>
                                                            <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Method</th>
                                                            <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Notes</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                                                        {selectedBillForPayment.paymentHistory.map((payment, index) => (
                                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                                                <td className="px-3 py-2 text-gray-900 dark:text-white">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                                                <td className="px-3 py-2 font-medium text-green-600 dark:text-green-400">₹{payment.amount.toLocaleString()}</td>
                                                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300 capitalize">{payment.paymentMethod.replace('_', ' ')}</td>
                                                                <td className="px-3 py-2 text-gray-600 dark:text-gray-400 text-xs">{payment.notes || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                                    <button type="button" onClick={() => { setShowPaymentModal(false); resetPaymentForm(); }} className="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors" disabled={paymentSubmitting}>Cancel</button>
                                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" disabled={paymentSubmitting}>
                                        {paymentSubmitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Recording...
                                            </>
                                        ) : (
                                            <>
                                                <DollarSign className="w-4 h-4" />
                                                Record Payment
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RentalBillingHistory;
