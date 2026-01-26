import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../redux/features/auth/loginSlice';
import { Plus, Edit2, Trash2, Search, Ban, Unlock } from 'lucide-react';
import rentalCustomerService from '../../services/rentalCustomerService';

const RentalCustomers = () => {
    const user = useSelector(selectUser);
    const isSuperAdmin = user?.role === 'superadmin';

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [blockAction, setBlockAction] = useState('block');
    const [selectedCustomer, setSelectedCustomer] = useState(null); // For block modal
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [search, setSearch] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        alternativePhone: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
        },
        customerType: 'individual',
        companyName: '',
        gstNumber: '',
        idProof: {
            type: '',
            number: ''
        },
        deposit: 0,
        notes: '',
        referral: { isGuest: false, source: '', details: '' }
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const data = await rentalCustomerService.getAllRentalCustomers({ limit: 100 });
            setCustomers(data.rentalCustomers || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch rental customers');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (editingCustomer) {
                await rentalCustomerService.updateRentalCustomer(editingCustomer._id, formData);
                setSuccess('Rental customer updated successfully!');
            } else {
                await rentalCustomerService.createRentalCustomer(formData);
                setSuccess('Rental customer created successfully!');
            }

            fetchCustomers();
            handleCloseModal();
        } catch (err) {
            setError(err.message || 'Failed to save rental customer');
        }
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            email: customer.email || '',
            phone: customer.phone,
            alternativePhone: customer.alternativePhone || '',
            address: typeof customer.address === 'object' && customer.address ? customer.address : {
                street: customer.address || '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
            },
            customerType: customer.customerType || 'individual',
            companyName: customer.companyName || '',
            gstNumber: customer.gstNumber || '',
            idProof: {
                type: customer.idProof?.type || '',
                number: customer.idProof?.number || ''
            },
            deposit: customer.deposit || 0,
            notes: customer.notes || '',
            referral: customer.referral || { isGuest: false, source: '', details: '' }
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this rental customer?')) {
            try {
                await rentalCustomerService.deleteRentalCustomer(id);
                setSuccess('Rental customer deleted successfully!');
                fetchCustomers();
            } catch (err) {
                setError(err.message || 'Failed to delete rental customer');
            }
        }
    };

    const openBlockModal = (customer) => {
        setSelectedCustomer(customer);
        const isBlocked = customer.status === 'blocked';
        setBlockAction(isBlocked ? 'unblock' : 'block');
        setShowBlockModal(true);
    };

    const handleBlockToggle = async () => {
        setError('');
        setSuccess('');
        try {
            if (blockAction === 'block') {
                await rentalCustomerService.blockRentalCustomer(selectedCustomer._id);
                setSuccess('Customer blocked successfully');
            } else {
                await rentalCustomerService.unblockRentalCustomer(selectedCustomer._id);
                setSuccess('Customer unblocked successfully');
            }
            setShowBlockModal(false);
            fetchCustomers();
        } catch (err) {
            setError(err.message || 'Failed to update customer status');
            setShowBlockModal(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCustomer(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            alternativePhone: '',
            address: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
            },
            customerType: 'individual',
            companyName: '',
            gstNumber: '',
            idProof: { type: '', number: '' },
            deposit: 0,
            notes: '',
            referral: { isGuest: false, source: '', details: '' }
        });
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.phone.includes(search) ||
        (customer.companyName && customer.companyName.toLowerCase().includes(search.toLowerCase())) ||
        (customer.alternativePhone && customer.alternativePhone.includes(search)) ||
        (customer.email && customer.email.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Rental Customers
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage customers for rental services
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Add Customer
                    </button>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3 rounded">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 p-3 rounded">
                        {success}
                    </div>
                )}

                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search customers..."
                            className="w-full pl-10 pr-4 py-2 border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading customers...</div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">No rental customers found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Contact</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID Proof</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Referral</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Deposit</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                    {filteredCustomers.map((customer) => (
                                        <tr key={customer._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/rentals/customers/${customer._id}`)}>
                                                <div>{customer.name}</div>
                                                {customer.companyName && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-normal">{customer.companyName}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                <div>{customer.phone}</div>
                                                {customer.alternativePhone && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">Alt: {customer.alternativePhone}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{customer.email || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                {customer.idProof?.type ? `${customer.idProof.type}: ${customer.idProof.number}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                {customer.referral?.isGuest ? (
                                                    <span className="italic text-gray-500">Guest</span>
                                                ) : (
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white">{customer.referral?.source}</div>
                                                        {customer.referral?.details && (
                                                            <div className="text-xs text-gray-500">{customer.referral.details}</div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 text-xs rounded-full ${customer.status === 'blocked'
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    }`}>
                                                    {customer.status || 'active'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">₹{customer.deposit || 0}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex space-x-2">
                                                    {isSuperAdmin && (
                                                        <button onClick={() => handleEdit(customer)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {isSuperAdmin && (
                                                        <button
                                                            onClick={() => openBlockModal(customer)}
                                                            className={`p-1.5 rounded ${customer.status === 'blocked'
                                                                ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                                : 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                                                }`}
                                                            title={customer.status === 'blocked' ? "Unblock" : "Block"}
                                                        >
                                                            {customer.status === 'blocked' ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                    {isSuperAdmin && (
                                                        <button onClick={() => handleDelete(customer._id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150]">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                {editingCustomer ? 'Edit Rental Customer' : 'Add Rental Customer'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alternative Phone</label><input type="tel" value={formData.alternativePhone} onChange={(e) => setFormData({ ...formData, alternativePhone: e.target.value })} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all" /></div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Type</label>
                                        <select value={formData.customerType} onChange={(e) => setFormData({ ...formData, customerType: e.target.value })} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all">
                                            <option value="individual">Individual</option>
                                            <option value="business">Business</option>
                                        </select>
                                    </div>

                                    {formData.customerType === 'business' && (
                                        <>
                                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label><input type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all" /></div>
                                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GST Number</label><input type="text" value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all" /></div>
                                        </>
                                    )}

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <input type="text" placeholder="Street" value={formData.address?.street || ''} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all" />
                                            <input type="text" placeholder="City" value={formData.address?.city || ''} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all" />
                                            <input type="text" placeholder="State" value={formData.address?.state || ''} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all" />
                                            <input type="text" placeholder="Zip Code" value={formData.address?.zipCode || ''} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all" />
                                            <input type="text" placeholder="Country" value={formData.address?.country || ''} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all" />
                                        </div>
                                    </div>

                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Proof Type</label><select value={formData.idProof.type} onChange={(e) => setFormData({ ...formData, idProof: { ...formData.idProof, type: e.target.value } })} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all"><option value="">Select Type</option><option value="aadhar">Aadhar</option><option value="pan">PAN</option><option value="driving_license">Driving License</option><option value="passport">Passport</option><option value="voter_id">Voter ID</option></select></div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Proof Number</label><input type="text" value={formData.idProof.number} onChange={(e) => setFormData({ ...formData, idProof: { ...formData.idProof, number: e.target.value } })} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deposit (₹)</label><input type="number" value={formData.deposit} onChange={(e) => setFormData({ ...formData, deposit: parseFloat(e.target.value) })} min="0" className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all" /></div><div className="md:col-span-2 border-t pt-4 mt-2"><h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Referral</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source</label><div className="flex items-center mb-2"><input type="checkbox" id="isGuest" checked={formData.referral?.isGuest || false} onChange={(e) => setFormData({ ...formData, referral: { ...formData.referral, isGuest: e.target.checked, source: e.target.checked ? '' : formData.referral.source, details: e.target.checked ? '' : formData.referral.details } })} className="h-4 w-4 text-primary focus:ring-ring border-gray-300 rounded" /><label htmlFor="isGuest" className="ml-2 block text-xs text-gray-500 hover:text-gray-700 cursor-pointer transition-colors">Is Guest (No referral)</label></div><select value={formData.referral?.source || ''} onChange={(e) => setFormData({ ...formData, referral: { ...formData.referral, source: e.target.value } })} disabled={formData.referral?.isGuest} required={!formData.referral?.isGuest} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all"><option value="">Select Source</option><option value="Social Media">Social Media</option><option value="Friend/Family">Friend/Family</option><option value="Advertisement">Advertisement</option><option value="Walk-in">Walk-in</option><option value="Existing Customer">Existing Customer</option><option value="Other">Other</option></select></div><div>{formData.referral?.source === 'Existing Customer' ? (<><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referred By</label><input type="text" value={formData.referral?.details || ''} onChange={(e) => setFormData({ ...formData, referral: { ...formData.referral, details: e.target.value } })} disabled={formData.referral?.isGuest} list="existingRentalCustomers" placeholder="Search customer..." className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all" /><datalist id="existingRentalCustomers">{customers.filter(c => c._id !== editingCustomer?._id).map(customer => (<option key={customer._id} value={`${customer.name} (${customer.phone})`} />))}</datalist></>) : (<><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Details (Optional)</label><input type="text" value={formData.referral?.details || ''} onChange={(e) => setFormData({ ...formData, referral: { ...formData.referral, details: e.target.value } })} disabled={formData.referral?.isGuest} placeholder="e.g., Name of referrer" className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all" /></>)}</div></div></div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                                    <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="3" className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all" />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={handleCloseModal} className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors shadow-sm">{editingCustomer ? 'Update' : 'Create'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Block Confirmation Modal */}
                {showBlockModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[150]">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-sm">
                            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-slate-100">
                                {blockAction === 'block' ? 'Block Customer' : 'Unblock Customer'}
                            </h3>
                            <p className="mb-6 text-gray-600 dark:text-slate-400">
                                Are you sure you want to {blockAction} <strong>{selectedCustomer?.name}</strong>?
                                {blockAction === 'block' && ' They will be prevented from creating new rentals.'}
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowBlockModal(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 hover:bg-gray-200 dark:hover:bg-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBlockToggle}
                                    className={`px-4 py-2 rounded-md text-white transition-colors ${blockAction === 'block' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}
                                >
                                    Confirm {blockAction === 'block' ? 'Block' : 'Unblock'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RentalCustomers;
