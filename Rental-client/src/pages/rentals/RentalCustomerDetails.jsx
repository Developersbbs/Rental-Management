import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Building, CreditCard, FileText, User, Activity, Package, AlertCircle, Clock } from 'lucide-react';
import rentalCustomerService from '../../services/rentalCustomerService';
import rentalService from '../../services/rentalService';
import billService from '../../services/billService';

const RentalCustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [rentals, setRentals] = useState([]);
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('pendingItems'); // Default to Pending Items as per user priority

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const [customerData, rentalsData, billsData] = await Promise.all([
                    rentalCustomerService.getRentalCustomerById(id),
                    rentalService.getAllRentals({ customerId: id }),
                    billService.getBills({ customerId: id })
                ]);
                setCustomer(customerData);
                setRentals(Array.isArray(rentalsData) ? rentalsData : (rentalsData.rentals || []));
                setBills(billsData.bills || (Array.isArray(billsData) ? billsData : []));
            } catch (err) {
                console.error("Error fetching customer details:", err);
                setError("Failed to load customer details.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDetails();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
                <div className="text-blue-600">Loading details...</div>
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200">
                <p className="mb-4 text-red-500">{error || "Customer not found"}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
            </div>
        );
    }

    const { address } = customer;
    const formattedAddress = typeof address === 'object'
        ? `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`.replace(/^, /, '').replace(/, $/, '')
        : address;

    // --- Derived Data ---
    const pendingRentals = rentals.filter(r => r.status === 'active' || r.status === 'overdue');
    const pendingItems = pendingRentals.flatMap(r => r.items.map(i => ({
        ...i,
        rentalId: r.rentalId,
        rental_id: r._id, // Internal ID for linking
        outTime: r.outTime,
        expectedReturnTime: r.expectedReturnTime,
        status: r.status
    })));

    const pendingBills = bills.filter(b => b.paymentStatus === 'pending' || b.paymentStatus === 'partial');
    const totalDue = pendingBills.reduce((sum, b) => {
        const due = b.dueAmount !== undefined ? Number(b.dueAmount) : (Number(b.totalAmount || 0) - Number(b.paidAmount || 0));
        return sum + (isNaN(due) ? 0 : due);
    }, 0);

    const renderTabs = () => (
        <div className="flex space-x-4 border-b border-gray-200 dark:border-slate-700 mb-6 overflow-x-auto">
            <button
                onClick={() => setActiveTab('pendingItems')}
                className={`py-2 px-4 whitespace-nowrap border-b-2 font-medium transition-colors ${activeTab === 'pendingItems'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
            >
                Pending Items ({pendingItems.length})
            </button>
            <button
                onClick={() => setActiveTab('pendingPayments')}
                className={`py-2 px-4 whitespace-nowrap border-b-2 font-medium transition-colors ${activeTab === 'pendingPayments'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
            >
                Pending Payments (₹{totalDue})
            </button>
            <button
                onClick={() => setActiveTab('history')}
                className={`py-2 px-4 whitespace-nowrap border-b-2 font-medium transition-colors ${activeTab === 'history'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
            >
                Rental History
            </button>
            <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-4 whitespace-nowrap border-b-2 font-medium transition-colors ${activeTab === 'profile'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
            >
                Full Profile
            </button>
        </div>
    );

    const renderPendingItems = () => (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
            {pendingItems.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No items currently pending return.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-300 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">Item</th>
                                <th className="px-6 py-3">Rental ID</th>
                                <th className="px-6 py-3">Rented On</th>
                                <th className="px-6 py-3">Due Date</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700 text-gray-900 dark:text-white">
                            {pendingItems.map((item, idx) => (
                                <tr key={`${item.rentalId}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-medium">
                                        {item.item?.rentalProductId?.name || 'Unknown Item'}
                                        {item.item?.uniqueIdentifier && (
                                            <span className="text-xs text-gray-500 block">ID: {item.item.uniqueIdentifier}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-blue-600 hover:underline cursor-pointer" onClick={() => navigate(`/rentals/customers`)}>
                                            {item.rentalId}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(item.outTime).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`flex items-center gap-1 ${new Date(item.expectedReturnTime) < new Date() ? 'text-red-500 font-medium' : ''}`}>
                                            {new Date(item.expectedReturnTime) < new Date() && <AlertCircle className="w-4 h-4" />}
                                            {new Date(item.expectedReturnTime).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${item.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {item.status === 'overdue' ? 'Overdue' : 'Active'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const renderPendingPayments = () => (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">Outstanding Dues</h3>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">Total Due: ₹{totalDue.toLocaleString()}</span>
            </div>
            {pendingBills.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No pending payments.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-300 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">Bill No</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Total Amount</th>
                                <th className="px-6 py-3">Paid</th>
                                <th className="px-6 py-3">Due Amount</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700 text-gray-900 dark:text-white">
                            {pendingBills.map((bill) => (
                                <tr key={bill._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-medium">{bill.billNumber}</td>
                                    <td className="px-6 py-4">{new Date(bill.billDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">₹{bill.totalAmount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-green-600">₹{Number(bill.paidAmount || 0).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-red-600 font-bold">
                                        ₹{(bill.dueAmount !== undefined ? Number(bill.dueAmount) : (Number(bill.totalAmount || 0) - Number(bill.paidAmount || 0))).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 capitalize">
                                            {bill.paymentStatus}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const renderHistory = () => (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
            {rentals.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">No rental history.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-300 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Items</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Return Due</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700 text-gray-900 dark:text-white">
                            {rentals.map((rental) => (
                                <tr key={rental._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4">{new Date(rental.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        {rental.items?.length || 0} items
                                        {rental.items?.length > 0 && (
                                            <div className="text-xs text-gray-400 truncate max-w-[200px]">
                                                {rental.items.map(i => i.item?.rentalProductId?.name).join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${rental.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            rental.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                                rental.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {rental.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{new Date(rental.expectedReturnTime).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const renderProfile = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" /> Basic Information
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold">Customer Type</label>
                        <p className="text-gray-900 dark:text-slate-200 capitalize">{customer.customerType}</p>
                    </div>
                    {customer.companyName && (
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Company</label>
                            <p className="text-gray-900 dark:text-slate-200 flex items-center gap-2">
                                <Building className="w-4 h-4 text-gray-400" /> {customer.companyName}
                            </p>
                        </div>
                    )}
                    {customer.gstNumber && (
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">GST Number</label>
                            <p className="text-gray-900 dark:text-slate-200">{customer.gstNumber}</p>
                        </div>
                    )}
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold">Status</label>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${customer.status === 'blocked' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {customer.status}
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-green-500" /> Contact Details
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold">Phone</label>
                        <p className="text-gray-900 dark:text-slate-200">{customer.phone}</p>
                    </div>
                    {customer.alternativePhone && (
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Alt Phone</label>
                            <p className="text-gray-900 dark:text-slate-200">{customer.alternativePhone}</p>
                        </div>
                    )}
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold">Email</label>
                        <p className="text-gray-900 dark:text-slate-200 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" /> {customer.email || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold">Address</label>
                        <p className="text-gray-900 dark:text-slate-200 flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" /> {formattedAddress || 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-500" /> Additional Details
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold">ID Proof</label>
                        <p className="text-gray-900 dark:text-slate-200 capitalize">{customer.idProof?.type ? `${customer.idProof.type}: ${customer.idProof.number}` : 'N/A'}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold">Deposit Held</label>
                        <p className="text-gray-900 dark:text-slate-200 font-medium">₹{customer.deposit}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold">Referral</label>
                        <p className="text-gray-900 dark:text-slate-200">{customer.referral?.isGuest ? 'Guest' : (customer.referral?.source || 'N/A')}</p>
                    </div>
                    {customer.notes && (
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Notes</label>
                            <p className="text-gray-700 dark:text-slate-300 text-sm whitespace-pre-wrap">{customer.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{customer.name}</h1>
                        <p className="text-gray-500 dark:text-gray-400">Rental Customer Details</p>
                    </div>
                </div>

                {/* Tabs */}
                {renderTabs()}

                {/* Content */}
                <div>
                    {activeTab === 'pendingItems' && renderPendingItems()}
                    {activeTab === 'pendingPayments' && renderPendingPayments()}
                    {activeTab === 'history' && renderHistory()}
                    {activeTab === 'profile' && renderProfile()}
                </div>
            </div>
        </div>
    );
};

export default RentalCustomerDetails;
