import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, DollarSign, Building2, Smartphone, Wallet, CreditCard, Eye, X, CheckCircle } from 'lucide-react';
import paymentAccountService from '../services/paymentAccountService';
import { toast } from 'react-toastify';

const PaymentAccounts = () => {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        accountType: 'bank',
        accountNumber: '',
        bankName: '',
        ifscCode: '',
        upiId: '',
        openingBalance: 0,
        description: ''
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const data = await paymentAccountService.getAllPaymentAccounts(); // Show all accounts
            console.log('Payment Accounts Data:', data);
            console.log('Accounts:', data.accounts);
            setAccounts(data.accounts || []);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAccount) {
                await paymentAccountService.updatePaymentAccount(editingAccount._id, formData);
                toast.success('Account updated successfully');
            } else {
                await paymentAccountService.createPaymentAccount(formData);
                toast.success('Account created successfully');
            }
            setShowModal(false);
            resetForm();
            fetchAccounts();
        } catch (error) {
            console.error('Error saving account:', error);
            toast.error(error.message);
        }
    };

    const handleEdit = (account) => {
        console.log('Editing account:', account);
        console.log('Account status:', account.status);
        setEditingAccount(account);
        setFormData({
            name: account.name,
            accountType: account.accountType,
            accountNumber: account.accountNumber || '',
            bankName: account.bankName || '',
            ifscCode: account.ifscCode || '',
            upiId: account.upiId || '',
            openingBalance: account.openingBalance || 0,
            description: account.description || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to deactivate this account?')) {
            try {
                await paymentAccountService.deletePaymentAccount(id);
                toast.success('Account deactivated successfully');
                fetchAccounts();
            } catch (error) {
                console.error('Error deleting account:', error);
                toast.error(error.message);
            }
        }
    };

    const resetForm = () => {
        setEditingAccount(null);
        setFormData({
            name: '',
            accountType: 'bank',
            accountNumber: '',
            bankName: '',
            ifscCode: '',
            upiId: '',
            openingBalance: 0,
            description: ''
        });
    };

    const getAccountIcon = (type) => {
        switch (type) {
            case 'bank': return <Building2 className="w-5 h-5" />;
            case 'upi': return <Smartphone className="w-5 h-5" />;
            case 'cash': return <Wallet className="w-5 h-5" />;
            case 'card_terminal': return <CreditCard className="w-5 h-5" />;
            default: return <DollarSign className="w-5 h-5" />;
        }
    };

    const getAccountTypeColor = (type) => {
        switch (type) {
            case 'bank': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200';
            case 'upi': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200';
            case 'cash': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
            case 'card_terminal': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
        }
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Accounts</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage your bank accounts and payment methods</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Add Account
                </button>
            </div>

            {/* Total Balance Card */}
            <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 mb-6 text-white shadow-lg shadow-primary/20">
                <p className="text-white/80 text-sm mb-1">Total Balance</p>
                <h2 className="text-4xl font-bold">₹{totalBalance.toLocaleString()}</h2>
                <p className="text-white/80 text-sm mt-2">{accounts.length} Active Accounts</p>
            </div>

            {/* Accounts Grid */}
            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : accounts.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No payment accounts found. Click "Add Account" to create one.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accounts.map(account => (
                        <div
                            key={account._id}
                            onClick={() => navigate(`/payment-accounts/${account._id}`)}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-lg ${getAccountTypeColor(account.accountType)}`}>
                                            {getAccountIcon(account.accountType)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{account.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-xs px-2 py-1 rounded-full ${getAccountTypeColor(account.accountType)}`}>
                                                    {account.accountType.replace('_', ' ').toUpperCase()}
                                                </span>
                                                {account.status === 'inactive' && (
                                                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                        INACTIVE
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        ₹{(account.currentBalance || 0).toLocaleString()}
                                    </p>
                                </div>

                                {account.accountType === 'bank' && account.accountNumber && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        A/C: ****{account.accountNumber.slice(-4)}
                                    </p>
                                )}
                                {account.accountType === 'bank' && account.bankName && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        {account.bankName}
                                    </p>
                                )}
                                {account.accountType === 'upi' && account.upiId && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        UPI: {account.upiId}
                                    </p>
                                )}

                                <div className="flex gap-2 mt-4 pt-4 border-t dark:border-slate-700">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(account);
                                        }}
                                        className="flex-1 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Edit2 className="w-4 h-4" /> Edit
                                    </button>
                                    {account.status === 'active' ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Are you sure you want to deactivate this account? It will no longer appear in payment dropdowns.')) {
                                                    handleDelete(account._id);
                                                }
                                            }}
                                            className="flex-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" /> Deactivate
                                        </button>
                                    ) : (
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Reactivate this account? It will appear in payment dropdowns again.')) {
                                                    try {
                                                        await paymentAccountService.updatePaymentAccount(account._id, { status: 'active' });
                                                        toast.success('Account reactivated successfully');
                                                        fetchAccounts();
                                                    } catch (error) {
                                                        toast.error(error.message);
                                                    }
                                                }
                                            }}
                                            className="flex-1 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Reactivate
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingAccount ? 'Edit Payment Account' : 'Add Payment Account'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Account Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all"
                                    placeholder="e.g., HDFC Current Account"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Account Type *
                                </label>
                                <select
                                    required
                                    value={formData.accountType}
                                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all"
                                    disabled={!!editingAccount}
                                >
                                    <option value="bank">Bank Account</option>
                                    <option value="upi">UPI Account</option>
                                    <option value="cash">Cash Register</option>
                                    <option value="card_terminal">Card Terminal</option>
                                </select>
                            </div>

                            {formData.accountType === 'bank' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Bank Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.bankName}
                                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                            className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all"
                                            placeholder="e.g., HDFC Bank"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Account Number
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.accountNumber}
                                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                            className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all"
                                            placeholder="Account number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            IFSC Code
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.ifscCode}
                                            onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                                            className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all"
                                            placeholder="IFSC code"
                                        />
                                    </div>
                                </>
                            )}

                            {formData.accountType === 'upi' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        UPI ID
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.upiId}
                                        onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all"
                                        placeholder="e.g., business@ybl"
                                    />
                                </div>
                            )}

                            {!editingAccount && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Opening Balance
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.openingBalance}
                                        onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all"
                                    placeholder="Optional description"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
                                >
                                    Cancel
                                </button>
                                {editingAccount && editingAccount.status === 'active' && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (window.confirm('Are you sure you want to deactivate this account? It will no longer appear in payment dropdowns.')) {
                                                try {
                                                    await paymentAccountService.updatePaymentAccount(editingAccount._id, { status: 'inactive' });
                                                    toast.success('Account deactivated successfully');
                                                    setShowModal(false);
                                                    resetForm();
                                                    fetchAccounts();
                                                } catch (error) {
                                                    toast.error(error.message);
                                                }
                                            }
                                        }}
                                        className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                                    >
                                        Deactivate Account
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                                >
                                    {editingAccount ? 'Update Account' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentAccounts;
