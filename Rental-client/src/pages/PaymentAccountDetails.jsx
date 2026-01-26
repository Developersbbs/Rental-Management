import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Calendar, User, Package, Building2, Smartphone, Wallet, CreditCard, Download, X } from 'lucide-react';
import paymentAccountService from '../services/paymentAccountService';

const PaymentAccountDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [account, setAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showProductsModal, setShowProductsModal] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);

    useEffect(() => {
        fetchAccountDetails();
    }, [id]);

    const fetchAccountDetails = async () => {
        try {
            setLoading(true);
            const accountData = await paymentAccountService.getPaymentAccountById(id);
            setAccount(accountData.account);

            const transactionsData = await paymentAccountService.getAccountTransactions(id);
            setTransactions(transactionsData.transactions || []);
        } catch (err) {
            console.error('Error fetching account details:', err);
            setError(err.message || 'Failed to load account details');
        } finally {
            setLoading(false);
        }
    };

    const getAccountIcon = (type) => {
        switch (type) {
            case 'bank': return <Building2 className="w-6 h-6" />;
            case 'upi': return <Smartphone className="w-6 h-6" />;
            case 'cash': return <Wallet className="w-6 h-6" />;
            case 'card_terminal': return <CreditCard className="w-6 h-6" />;
            default: return <DollarSign className="w-6 h-6" />;
        }
    };

    const getAccountTypeColor = (type) => {
        switch (type) {
            case 'bank': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
            case 'upi': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200';
            case 'cash': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
            case 'card_terminal': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
        }
    };

    const handleDownloadCSV = () => {
        if (transactions.length === 0) {
            alert('No transactions to export');
            return;
        }

        // Prepare CSV data
        const headers = ['Date', 'Time', 'Type', 'Party Name', 'Party Phone', 'Reference Number', 'Products', 'Payment Method', 'Amount'];
        const rows = transactions.map(t => [
            new Date(t.paymentDate).toLocaleDateString('en-IN'),
            new Date(t.paymentDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            t.type === 'purchase' ? 'Expense' : 'Income',
            t.partyName || 'N/A',
            t.partyPhone || 'N/A',
            t.number || 'N/A',
            t.details?.items?.map(item => item.name || item.product?.name).join('; ') || 'N/A',
            t.paymentMethod.replace('_', ' ').toUpperCase(),
            t.type === 'purchase' ? `-${t.amount}` : t.amount
        ]);

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${account.name}_transactions_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShowProducts = (items) => {
        setSelectedProducts(items || []);
        setShowProductsModal(true);
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !account) {
        return (
            <div className="p-6">
                <button onClick={() => navigate('/payment-accounts')} className="mb-4 flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </button>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg">
                    {error || 'Account not found'}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            <button onClick={() => navigate('/payment-accounts')} className="mb-4 flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Payment Accounts
            </button>

            {/* Account Header */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-xl ${getAccountTypeColor(account.accountType)}`}>
                            {getAccountIcon(account.accountType)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{account.name}</h1>
                            <span className={`text-sm px-3 py-1 rounded-full ${getAccountTypeColor(account.accountType)} inline-block mt-1`}>
                                {account.accountType.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            ₹{(account.currentBalance || 0).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Account Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t dark:border-slate-700">
                    {account.accountType === 'bank' && account.bankName && (
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Bank Name</p>
                            <p className="text-gray-900 dark:text-white font-medium">{account.bankName}</p>
                        </div>
                    )}
                    {account.accountType === 'bank' && account.accountNumber && (
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Account Number</p>
                            <p className="text-gray-900 dark:text-white font-medium">****{account.accountNumber.slice(-4)}</p>
                        </div>
                    )}
                    {account.accountType === 'bank' && account.ifscCode && (
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">IFSC Code</p>
                            <p className="text-gray-900 dark:text-white font-medium">{account.ifscCode}</p>
                        </div>
                    )}
                    {account.accountType === 'upi' && account.upiId && (
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">UPI ID</p>
                            <p className="text-gray-900 dark:text-white font-medium">{account.upiId}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Opening Balance</p>
                        <p className="text-gray-900 dark:text-white font-medium">₹{(account.openingBalance || 0).toLocaleString()}</p>
                    </div>
                </div>

                {account.description && (
                    <div className="mt-4 pt-4 border-t dark:border-slate-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                        <p className="text-gray-900 dark:text-white">{account.description}</p>
                    </div>
                )}
            </div>

            {/* Transaction History */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transaction History</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{transactions.length} transactions</p>
                    </div>
                    {transactions.length > 0 && (
                        <button
                            onClick={handleDownloadCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    )}
                </div>

                {transactions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No transactions found for this account
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Party</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reference</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Products</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Method</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {transactions.map((transaction, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-900 dark:text-white">
                                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                {new Date(transaction.paymentDate).toLocaleDateString('en-IN')}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(transaction.paymentDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {transaction.partyName || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {transaction.partyPhone || (transaction.type === 'purchase' ? 'Supplier' : 'Customer')}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {transaction.number || 'N/A'}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {transaction.type === 'purchase' ? 'Purchase Order' : 'Bill'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start">
                                                <Package className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                                                <div className="text-sm text-gray-900 dark:text-white max-w-xs">
                                                    <div className="text-sm text-gray-900 dark:text-white max-w-xs">
                                                        {transaction.details?.items && transaction.details.items.length > 0 ? (
                                                            <button
                                                                onClick={() => handleShowProducts(transaction.details.items)}
                                                                className="text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                            >
                                                                <div className="font-medium">
                                                                    {transaction.details.items[0].name || transaction.details.items[0].product?.name || 'Item'}
                                                                </div>
                                                                {transaction.details.items.length > 1 && (
                                                                    <div className="text-xs text-blue-600 dark:text-blue-400 underline">
                                                                        Click to view all {transaction.details.items.length} items
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ) : 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                                                {transaction.paymentMethod.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className={`text-lg font-bold ${transaction.type === 'purchase'
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-green-600 dark:text-green-400'
                                                }`}>
                                                {transaction.type === 'purchase' ? '-' : '+'}
                                                ₹{transaction.amount.toLocaleString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Products Modal */}
            {showProductsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Products in Transaction</h2>
                            <button onClick={() => setShowProductsModal(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <div className="space-y-3">
                                {selectedProducts.map((item, index) => (
                                    <div key={index} className="flex justify-between items-start p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                Quantity: {item.quantity} × ₹{item.price.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-gray-900 dark:text-white">
                                                ₹{item.total.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 border-t dark:border-slate-700">
                            <button
                                onClick={() => setShowProductsModal(false)}
                                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentAccountDetails;
