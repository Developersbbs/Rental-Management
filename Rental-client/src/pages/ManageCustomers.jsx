// components/ManageCustomers.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/features/auth/loginSlice';
import { Plus, Edit, Trash2, Eye, Users, UserPlus, AlertCircle, Search, Filter, Ban, Lock, Unlock } from 'lucide-react';
import customerService from '../services/customerService';

const ManageCustomers = () => {
  const user = useSelector(selectUser);
  const isSuperAdmin = user?.role === 'superadmin';

  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockAction, setBlockAction] = useState('block'); // 'block' or 'unblock'
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedCustomer, setSelectedCustomer] = useState(null); // Stores the customer data for view/edit

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    alternativePhone: '',
    companyName: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    gstNumber: '',
    customerType: 'individual',
    status: 'active',
    isBlocked: false,
    creditLimit: 0,
    notes: '',
    idProof: { type: '', number: '', imageUrl: '' },
    referral: { isGuest: false, source: '', details: '' }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [billSearchTerm, setBillSearchTerm] = useState('');

  const fetchCustomersAndStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [customersData, statsData] = await Promise.all([
        customerService.getAllCustomers(),
        customerService.getCustomerStats()
      ]);

      setCustomers(customersData.customers);
      setFilteredCustomers(customersData.customers);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomersAndStats();
  }, [fetchCustomersAndStats]);

  useEffect(() => {
    let filtered = customers;
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }
    setFilteredCustomers(filtered);
  }, [customers, searchTerm, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      let data;
      if (modalMode === 'create') {
        data = await customerService.createCustomer(formData);
      } else { // edit mode
        data = await customerService.updateCustomer(selectedCustomer._id, formData);
      }

      setSuccess(data.message);
      setShowModal(false);
      resetForm();
      fetchCustomersAndStats(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    setError('');
    setSuccess('');
    try {
      const data = await customerService.deleteCustomer(selectedCustomer._id);
      setSuccess(data.message);
      setShowDeleteModal(false);
      fetchCustomersAndStats(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  const openBlockModal = (customer) => {
    setSelectedCustomer(customer);
    setBlockAction(customer.isBlocked ? 'unblock' : 'block');
    setShowBlockModal(true);
  };

  const handleBlockToggle = async () => {
    setError('');
    setSuccess('');
    try {
      let data;
      if (blockAction === 'block') {
        data = await customerService.blockCustomer(selectedCustomer._id);
      } else {
        data = await customerService.unblockCustomer(selectedCustomer._id);
      }
      setSuccess(data.message);
      setShowBlockModal(false);
      fetchCustomersAndStats(); // Refresh the list
    } catch (err) {
      setError(err.message);
      setShowBlockModal(false); // Close on error too
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      alternativePhone: '',
      companyName: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      gstNumber: '',
      customerType: 'individual',
      status: 'active',
      isBlocked: false,
      creditLimit: 0,
      notes: '',
      idProof: { type: '', number: '', imageUrl: '' },
      referral: { isGuest: false, source: '', details: '' }
    });
    setSelectedCustomer(null);
    setModalMode('create');
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      alternativePhone: customer.alternativePhone || '',
      companyName: customer.companyName || '',
      address: customer.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      gstNumber: customer.gstNumber || '',
      customerType: customer.customerType || 'individual',
      status: customer.status,
      isBlocked: customer.isBlocked || false,
      creditLimit: customer.creditLimit || 0,
      notes: customer.notes || '',
      idProof: customer.idProof || { type: '', number: '', imageUrl: '' },
      referral: customer.referral || { isGuest: false, source: '', details: '' }
    });
    setSelectedCustomer(customer);
    setModalMode('edit');
    setShowModal(true);
  };

  // --- Updated openViewModal ---
  const openViewModal = async (customer) => {
    setError('');
    setSuccess('');
    setLoading(true); // Show loading for fetching detailed data
    try {
      // Fetch detailed customer data including billing history (bills virtual)
      const detailedCustomer = await customerService.getCustomerById(customer._id);
      setSelectedCustomer(detailedCustomer); // Use the detailed data
      setModalMode('view');
      setShowModal(true);
    } catch (err) {
      setError(err.message);
      // Optionally, still open the modal with basic data if fetch fails?
      // setSelectedCustomer(customer);
      // setModalMode('view');
      // setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }));
  };

  if (loading && customers.length === 0) { // Only show full page loading initially
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-200 dark:bg-slate-900 min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">Customer Management</h1>
        <p className="text-gray-600 dark:text-slate-400">Manage your customers and their details</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-100 dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-300 dark:border-slate-700 transition-colors duration-300">
          <div className="flex items-center">
            <Users className="w-10 h-10 text-blue-700 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Total Customers</h3>
              <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-300 dark:border-slate-700 transition-colors duration-300">
          <div className="flex items-center">
            <UserPlus className="w-10 h-10 text-green-600 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Active</h3>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-300 dark:border-slate-700 transition-colors duration-300">
          <div className="flex items-center">
            <Users className="w-10 h-10 text-red-600 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Inactive</h3>
              <p className="text-3xl font-bold text-red-600">{stats.inactive}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-100 dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-700 w-full"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-700 appearance-none bg-gray-100 dark:bg-slate-700 dark:text-slate-100 min-w-40"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Add Customer Button */}
          <button
            onClick={openCreateModal}
            className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-gray-100 dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-200 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Referral
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Credit Limit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-100 dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-600 dark:divide-gray-600">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-slate-400">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-200 dark:hover:bg-slate-700 dark:bg-slate-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-slate-100 cursor-pointer hover:text-blue-600" onClick={() => navigate(`/manage-customers/${customer._id}`)}>{customer.name}</div>
                        <div className="text-sm text-gray-500 dark:text-slate-400">{customer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-slate-100">{customer.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 capitalize">
                        {customer.customerType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {customer.isBlocked ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300">
                          Blocked
                        </span>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${customer.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
                          }`}>
                          {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-slate-100">
                        {customer.referral?.isGuest ? (
                          <span className="text-gray-500 italic">Guest</span>
                        ) : (
                          <div>
                            <span className="font-medium">{customer.referral?.source}</span>
                            {customer.referral?.details && (
                              <p className="text-xs text-gray-500">{customer.referral.details}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-slate-100">
                        ₹{customer.creditLimit?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openViewModal(customer)} // Use updated function
                          className="text-blue-700 hover:text-blue-900 p-1 rounded transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => openEditModal(customer)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button
                            onClick={() => openBlockModal(customer)}
                            className={`${customer.isBlocked ? 'text-green-600 hover:text-green-900' : 'text-orange-600 hover:text-orange-900'} p-1 rounded transition-colors`}
                            title={customer.isBlocked ? "Unblock" : "Block"}
                          >
                            {customer.isBlocked ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button
                            onClick={() => openDeleteModal(customer)}
                            className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Modal (Create/Edit/View) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-6 w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto flex flex-col">
            <h2 className="text-xl font-bold mb-4 flex-shrink-0">
              {modalMode === 'create' && 'Add New Customer'}
              {modalMode === 'edit' && 'Edit Customer'}
              {modalMode === 'view' && 'Customer Details'}
            </h2>

            {/* --- Loading indicator inside modal for detailed view --- */}
            {modalMode === 'view' && loading && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {modalMode === 'view' && !loading && selectedCustomer ? (
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-slate-100">{selectedCustomer?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-slate-100">{selectedCustomer?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-slate-100">{selectedCustomer?.phone}</p>
                  </div>
                  {selectedCustomer?.alternativePhone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Alternative Phone</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-slate-100">{selectedCustomer.alternativePhone}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer Type</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-slate-100 capitalize">{selectedCustomer?.customerType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-slate-100 capitalize">{selectedCustomer?.status}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Credit Limit</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-slate-100">₹{selectedCustomer?.creditLimit?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Outstanding Balance</label>
                    <p className={`mt-1 text-sm ${selectedCustomer?.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{selectedCustomer?.outstandingBalance?.toLocaleString() || '0'}
                    </p>
                  </div>
                  {selectedCustomer?.gstNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">GST Number</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-slate-100">{selectedCustomer?.gstNumber}</p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-slate-100">
                      {selectedCustomer?.address?.street && `${selectedCustomer.address.street}, `}
                      {selectedCustomer?.address?.city && `${selectedCustomer.address.city}, `}
                      {selectedCustomer?.address?.state && `${selectedCustomer.address.state} `}
                      {selectedCustomer?.address?.zipCode && `${selectedCustomer.address.zipCode}`}
                      {selectedCustomer?.address?.country && `, ${selectedCustomer.address.country}`}
                    </p>
                  </div>
                  {selectedCustomer?.notes && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-slate-100">{selectedCustomer?.notes}</p>
                    </div>
                  )}
                  {selectedCustomer?.idProof && (
                    <div className="md:col-span-2 border-t pt-2 mt-2">
                      <h4 className="text-md font-medium text-gray-900 dark:text-slate-100 mb-2">ID Proof</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500">Type</label>
                          <p className="text-sm text-gray-900 dark:text-slate-100">{selectedCustomer.idProof.type || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500">Number</label>
                          <p className="text-sm text-gray-900 dark:text-slate-100">{selectedCustomer.idProof.number || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedCustomer?.referral && (
                    <div className="md:col-span-2 border-t pt-2 mt-2">
                      <h4 className="text-md font-medium text-gray-900 dark:text-slate-100 mb-2">Referral</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500">Source</label>
                          <p className="text-sm text-gray-900 dark:text-slate-100">{selectedCustomer.referral.source || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500">Details</label>
                          <p className="text-sm text-gray-900 dark:text-slate-100">{selectedCustomer.referral.details || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* --- Billing History Section --- */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Billing History</h3>
                    {selectedCustomer?.bills && selectedCustomer.bills.length > 0 && (
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search bills..."
                          value={billSearchTerm}
                          onChange={(e) => setBillSearchTerm(e.target.value)}
                          className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-600 focus:border-blue-700"
                        />
                      </div>
                    )}
                  </div>
                  {selectedCustomer?.bills && selectedCustomer.bills.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                          <thead className="bg-gray-200 dark:bg-slate-700 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Bill Number</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Amount (₹)</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-gray-100 dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-600 dark:divide-gray-600">
                            {selectedCustomer.bills
                              .filter(bill =>
                                bill.billNumber?.toLowerCase().includes(billSearchTerm.toLowerCase()) ||
                                bill.paymentStatus?.toLowerCase().includes(billSearchTerm.toLowerCase()) ||
                                bill.totalAmount?.toString().includes(billSearchTerm)
                              )
                              .map((bill) => (
                                <tr key={bill._id} className="hover:bg-gray-200 dark:hover:bg-slate-700 dark:bg-slate-700">
                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100 whitespace-nowrap">{bill.billNumber}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100 whitespace-nowrap">
                                    {bill.billDate ? new Date(bill.billDate).toLocaleDateString() : "N/A"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100 whitespace-nowrap">₹{bill.totalAmount?.toLocaleString() || "0"}</td>
                                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${bill.paymentStatus === "paid"
                                      ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300"
                                      : bill.paymentStatus === "partial"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300"
                                      }`}>
                                      {bill.paymentStatus?.charAt(0).toUpperCase() + (bill.paymentStatus?.slice(1) || "")}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        {selectedCustomer.bills.filter(bill =>
                          bill.billNumber?.toLowerCase().includes(billSearchTerm.toLowerCase()) ||
                          bill.paymentStatus?.toLowerCase().includes(billSearchTerm.toLowerCase()) ||
                          bill.totalAmount?.toString().includes(billSearchTerm)
                        ).length === 0 && (
                            <div className="text-center py-4 text-sm text-gray-500 dark:text-slate-400">
                              No bills found matching your search.
                            </div>
                          )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-slate-400 italic">No billing history found for this customer.</p>
                  )}
                </div>
                {/* --- End Billing History Section --- */}
                {/* --- End Billing History Section --- */}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 hover:bg-gray-200 dark:hover:bg-slate-700 dark:bg-slate-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              // --- Create/Edit Form (remains largely the same) ---
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      disabled={modalMode === 'view'}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={modalMode === 'view'}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone *
                    </label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      disabled={modalMode === 'view'}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="alternativePhone" className="block text-sm font-medium text-gray-700">
                      Alternative Phone
                    </label>
                    <input
                      type="text"
                      id="alternativePhone"
                      name="alternativePhone"
                      value={formData.alternativePhone}
                      onChange={(e) => setFormData({ ...formData, alternativePhone: e.target.value })}
                      disabled={modalMode === 'view'}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="customerType" className="block text-sm font-medium text-gray-700">
                    Customer Type
                  </label>
                  <select
                    id="customerType"
                    name="customerType"
                    value={formData.customerType}
                    onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                    disabled={modalMode === 'view'}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="individual">Individual</option>
                    <option value="business">Business</option>
                  </select>
                </div>
                {formData.customerType === 'business' && (
                  <>
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                        Company Name
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        disabled={modalMode === 'view'}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700">
                        GST Number
                      </label>
                      <input
                        type="text"
                        id="gstNumber"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                        disabled={modalMode === 'view'}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={modalMode === 'view'}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    id="isBlocked"
                    name="isBlocked"
                    checked={formData.isBlocked}
                    onChange={(e) => setFormData({ ...formData, isBlocked: e.target.checked })}
                    disabled={modalMode === 'view'}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isBlocked" className="ml-2 block text-sm font-medium text-gray-700">
                    Block this customer
                  </label>
                </div>
                <div>
                  <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700">
                    Credit Limit
                  </label>
                  <input
                    type="number"
                    id="creditLimit"
                    name="creditLimit"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    min="0"
                    disabled={modalMode === 'view'}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                  />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                      <input
                        type="text"
                        name="street"
                        placeholder="Street"
                        value={formData.address.street}
                        onChange={handleAddressChange}
                        disabled={modalMode === 'view'}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                      />
                      <input
                        type="text"
                        name="city"
                        placeholder="City"
                        value={formData.address.city}
                        onChange={handleAddressChange}
                        disabled={modalMode === 'view'}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                      />
                      <input
                        type="text"
                        name="state"
                        placeholder="State"
                        value={formData.address.state}
                        onChange={handleAddressChange}
                        disabled={modalMode === 'view'}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                      />
                      <input
                        type="text"
                        name="zipCode"
                        placeholder="ZIP Code"
                        value={formData.address.zipCode}
                        onChange={handleAddressChange}
                        disabled={modalMode === 'view'}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                      />
                      <input
                        type="text"
                        name="country"
                        placeholder="Country"
                        value={formData.address.country}
                        onChange={handleAddressChange}
                        disabled={modalMode === 'view'}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows="3"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      disabled={modalMode === 'view'}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  {/* ID Proof Section */}
                  <div className="md:col-span-2 border-t pt-4 mt-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-3">ID Proof</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="idProofType" className="block text-sm font-medium text-gray-700">
                          ID Type
                        </label>
                        <select
                          id="idProofType"
                          name="idProofType"
                          value={formData.idProof?.type || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            idProof: { ...formData.idProof, type: e.target.value }
                          })}
                          disabled={modalMode === 'view'}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                        >
                          <option value="">Select ID Type</option>
                          <option value="Aadhar">Aadhar Card</option>
                          <option value="PAN">PAN Card</option>
                          <option value="Driving License">Driving License</option>
                          <option value="Voter ID">Voter ID</option>
                          <option value="Passport">Passport</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="idProofNumber" className="block text-sm font-medium text-gray-700">
                          ID Number
                        </label>
                        <input
                          type="text"
                          id="idProofNumber"
                          name="idProofNumber"
                          value={formData.idProof?.number || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            idProof: { ...formData.idProof, number: e.target.value }
                          })}
                          disabled={modalMode === 'view'}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Referral Section */}
                  <div className="md:col-span-2 border-t pt-4 mt-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-3">Referral</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="referralSource" className="block text-sm font-medium text-gray-700">
                          Source
                        </label>
                        <div className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            id="isGuest"
                            checked={formData.referral?.isGuest || false}
                            onChange={(e) => setFormData({
                              ...formData,
                              referral: {
                                ...formData.referral,
                                isGuest: e.target.checked,
                                source: e.target.checked ? '' : formData.referral.source,
                                details: e.target.checked ? '' : formData.referral.details
                              }
                            })}
                            disabled={modalMode === 'view'}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="isGuest" className="ml-2 block text-xs text-gray-500">
                            Is Guest (No referral)
                          </label>
                        </div>
                        <select
                          id="referralSource"
                          name="referralSource"
                          value={formData.referral?.source || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            referral: { ...formData.referral, source: e.target.value }
                          })}
                          disabled={modalMode === 'view' || formData.referral?.isGuest}
                          required={!formData.referral?.isGuest}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                        >
                          <option value="">Select Source</option>
                          <option value="Social Media">Social Media</option>
                          <option value="Friend/Family">Friend/Family</option>
                          <option value="Advertisement">Advertisement</option>
                          <option value="Walk-in">Walk-in</option>
                          <option value="Existing Customer">Existing Customer</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        {formData.referral?.source === 'Existing Customer' ? (
                          <>
                            <label htmlFor="referralDetails" className="block text-sm font-medium text-gray-700">
                              Referred By
                            </label>
                            <input
                              type="text"
                              id="referralDetails"
                              name="referralDetails"
                              list="existingCustomers"
                              placeholder="Search customer..."
                              value={formData.referral?.details || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                referral: { ...formData.referral, details: e.target.value }
                              })}
                              disabled={formData.referral?.isGuest}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                            />
                            <datalist id="existingCustomers">
                              {customers
                                .filter(c => c._id !== selectedCustomer?._id) // Exclude self if editing
                                .map(customer => (
                                  <option key={customer._id} value={`${customer.name} (${customer.phone})`} />
                                ))}
                            </datalist>
                          </>
                        ) : (
                          <>
                            <label htmlFor="referralDetails" className="block text-sm font-medium text-gray-700">
                              Details (Optional)
                            </label>
                            <input
                              type="text"
                              id="referralDetails"
                              name="referralDetails"
                              placeholder="e.g., Name of referrer"
                              value={formData.referral?.details || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                referral: { ...formData.referral, details: e.target.value }
                              })}
                              disabled={modalMode === 'view' || formData.referral?.isGuest}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-500 disabled:bg-gray-100"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 hover:bg-gray-200 dark:hover:bg-slate-700 dark:bg-slate-700"
                  >
                    Cancel
                  </button>
                  {(modalMode === 'create' || modalMode === 'edit') && (
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                    >
                      {modalMode === 'create' ? 'Create Customer' : 'Update Customer'}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">Delete Customer</h3>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <span className="font-semibold">{selectedCustomer?.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 hover:bg-gray-200 dark:hover:bg-slate-700 dark:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Block Confirmation Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-slate-100">
              {blockAction === 'block' ? 'Block Customer' : 'Unblock Customer'}
            </h3>
            <p className="mb-6 text-gray-600 dark:text-slate-400">
              Are you sure you want to {blockAction} <strong>{selectedCustomer?.name}</strong>?
              {blockAction === 'block' && ' They will be prevented from creating new bills or rentals.'}
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
                className={`px-4 py-2 rounded-md text-white ${blockAction === 'block' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                Confirm {blockAction === 'block' ? 'Block' : 'Unblock'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageCustomers;