import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import paymentAccountService from '../services/paymentAccountService';

const PurchasePaymentModal = ({ isOpen, onClose, purchase, onSubmit }) => {
    const [formData, setFormData] = useState({
        amount: '',
        paymentMethod: 'cash',
        paymentAccountId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: ''
    });
    const [paymentAccounts, setPaymentAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchPaymentAccounts();
            // Default amount to due amount
            if (purchase) {
                setFormData(prev => ({
                    ...prev,
                    amount: purchase.dueAmount || 0
                }));
            }
        }
    }, [isOpen, purchase]);

    const fetchPaymentAccounts = async () => {
        try {
            const response = await paymentAccountService.getAllPaymentAccounts();
            setPaymentAccounts(response.accounts || []);
        } catch (err) {
            console.error('Failed to fetch payment accounts', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await onSubmit(purchase._id, formData);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to record payment');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Method *
                        </label>
                        <select
                            name="paymentMethod"
                            value={formData.paymentMethod}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="upi">UPI</option>
                            <option value="bank_transfer">Bank Transfer</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Account
                        </label>
                        <select
                            name="paymentAccountId"
                            value={formData.paymentAccountId}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Account (Optional)</option>
                            {paymentAccounts.map(acc => (
                                <option key={acc._id} value={acc._id}>
                                    {acc.name} ({acc.accountType}) - Balance: ₹{acc.currentBalance}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Select account to deduct balance from (optional for Cash).</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount * (Max: ₹{purchase?.dueAmount})
                        </label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            max={purchase?.dueAmount}
                            min="0.01"
                            step="0.01"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Date
                        </label>
                        <input
                            type="date"
                            name="paymentDate"
                            value={formData.paymentDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Recording...' : 'Record Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PurchasePaymentModal;
