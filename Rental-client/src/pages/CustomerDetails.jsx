import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Building, FileText, User, ShoppingBag } from 'lucide-react';
import customerService from '../services/customerService';
import billService from '../services/billService';

const CustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                // Fetch customer details
                const customerData = await customerService.getCustomerById(id);
                setCustomer(customerData);

                // Fetch bills for this customer
                // Assuming billService.getBills accepts params to filter by customer
                // Using generic check because I can't be 100% sure of backend query param name without checking backend code deeply,
                // but usually 'customer', 'customerId', or 'search' works.
                // Based on rentalController logic, it used customerId. 
                // Let's try passing customer: id
                try {
                    const billsData = await billService.getBills({ customerId: id });
                    setBills(billsData.bills || (Array.isArray(billsData) ? billsData : []));
                } catch (billErr) {
                    console.warn("Could not fetch bills:", billErr);
                    // Don't fail the whole page if bills fail
                }

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
    // Regular customer address is usually object: street, city, state, zipCode, country
    const formattedAddress = address && typeof address === 'object'
        ? `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}, ${address.country || ''}`.replace(/^, /, '').replace(/, $/, '')
        : address;

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{customer.name}</h1>
                        <p className="text-gray-500 dark:text-gray-400">Customer Details</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Profile Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Basic Info Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-500" />
                                Basic Information
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
                                            <Building className="w-4 h-4 text-gray-400" />
                                            {customer.companyName}
                                        </p>
                                    </div>
                                )}
                                {customer.gstNumber && (
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-semibold">GST Number</label>
                                        <p className="text-gray-900 dark:text-slate-200">{customer.gstNumber}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Contact Info Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Phone className="w-5 h-5 text-green-500" />
                                Contact Details
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
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        {customer.email || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Address</label>
                                    <p className="text-gray-900 dark:text-slate-200 flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                        {formattedAddress || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Billing History */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-orange-500" />
                                Purchase History
                            </h2>

                            {bills.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No purchase history found.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-300 uppercase text-xs">
                                            <tr>
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3">Bill No</th>
                                                <th className="px-4 py-3">Amount</th>
                                                <th className="px-4 py-3">Payment</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                            {bills.map((bill) => (
                                                <tr key={bill._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                                                        {new Date(bill.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                        {bill.billNumber}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                        ₹{bill.totalAmount}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                        {bill.paymentMethod}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetails;
