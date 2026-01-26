// components/ManageSuppliers.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/features/auth/loginSlice';
import {
  Plus, Edit, Trash2, Eye, Building, Truck, AlertCircle,
  Search, Filter, Phone, Mail, MapPin
} from 'lucide-react';
import supplierService from '../services/supplierService';

const ManageSuppliers = () => {
  const user = useSelector(selectUser);
  const isSuperAdmin = user?.role === 'superadmin';

  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    products: [],
    status: 'active',
    paymentTerms: 'Net 30',
    notes: ''
  });
  const [newProduct, setNewProduct] = useState('');
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 3000);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchSuppliersAndStats = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit: pagination.limit,
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      };

      const [suppliersData, statsData] = await Promise.all([
        supplierService.getAllSuppliers(params),
        supplierService.getSupplierStats()
      ]);

      setSuppliers(suppliersData.suppliers);
      setFilteredSuppliers(suppliersData.suppliers);
      setStats(statsData);
      setPagination({
        page: suppliersData.currentPage,
        totalPages: suppliersData.totalPages,
        total: suppliersData.total,
        limit: pagination.limit
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter, pagination.limit]);

  useEffect(() => {
    fetchSuppliersAndStats();
  }, [fetchSuppliersAndStats]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      let data;
      if (modalMode === 'create') {
        data = await supplierService.createSupplier(formData);
      } else {
        data = await supplierService.updateSupplier(selectedSupplier._id, formData);
      }

      setSuccess(data.message || `Supplier ${modalMode === 'create' ? 'created' : 'updated'} successfully!`);
      setShowModal(false);
      resetForm();
      fetchSuppliersAndStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    setError('');
    setSuccess('');
    try {
      const data = await supplierService.deleteSupplier(selectedSupplier._id);
      setSuccess(data.message || 'Supplier deleted successfully!');
      setShowDeleteModal(false);
      fetchSuppliersAndStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const addProduct = () => {
    if (newProduct.trim()) {
      setFormData({
        ...formData,
        products: [...formData.products, newProduct.trim()]
      });
      setNewProduct('');
    }
  };

  const removeProduct = (index) => {
    const updatedProducts = [...formData.products];
    updatedProducts.splice(index, 1);
    setFormData({ ...formData, products: updatedProducts });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      products: [],
      status: 'active',
      paymentTerms: 'Net 30',
      notes: ''
    });
    setSelectedSupplier(null);
    setModalMode('create');
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (supplier) => {
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      products: supplier.products || [],
      status: supplier.status,
      paymentTerms: supplier.paymentTerms || 'Net 30',
      notes: supplier.notes || ''
    });
    setSelectedSupplier(supplier);
    setModalMode('edit');
    setShowModal(true);
  };

  const openViewModal = (supplier) => {
    setSelectedSupplier(supplier);
    setModalMode('view');
    setShowModal(true);
    setSupplierProducts([]);
    setProductsError('');
    setProductsLoading(true);

    supplierService
      .getSupplierProducts(supplier._id)
      .then((data) => {
        setSupplierProducts(data.products || []);
      })
      .catch((err) => {
        console.error('Error fetching supplier products:', err);
        setProductsError(err.message);
      })
      .finally(() => {
        setProductsLoading(false);
      });
  };

  const openDeleteModal = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteModal(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchSuppliersAndStats(newPage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-200 dark:bg-slate-900 min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">Supplier Management</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400">Manage your suppliers and vendor relationships</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          <span className="flex-1 text-sm sm:text-base">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-3 rounded-lg">
          <span className="text-sm sm:text-base">{success}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-100 dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-300 dark:border-slate-700 transition-colors duration-300">
          <div className="flex items-center">
            <Building className="w-10 h-10 text-primary mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Total Suppliers</h3>
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-300 dark:border-slate-700 transition-colors duration-300">
          <div className="flex items-center">
            <Truck className="w-10 h-10 text-green-600 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Active</h3>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-300 dark:border-slate-700 transition-colors duration-300">
          <div className="flex items-center">
            <Building className="w-10 h-10 text-yellow-600 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Pending</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-300 dark:border-slate-700 transition-colors duration-300">
          <div className="flex items-center">
            <Building className="w-10 h-10 text-red-600 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Inactive</h3>
              <p className="text-3xl font-bold text-red-600">{stats.inactive}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent w-full"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent appearance-none bg-gray-100 min-w-40"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Add Supplier Button */}
          {isSuperAdmin && (
            <button
              onClick={openCreateModal}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Supplier
            </button>
          )}
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-gray-100 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-100 divide-y divide-gray-200">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No suppliers found
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier._id} className="hover:bg-gray-200">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{supplier.name}</div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Mail className="w-4 h-4 mr-1" />
                          {supplier.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900 dark:text-slate-100">{supplier.contactPerson}</div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Phone className="w-4 h-4 mr-1" />
                          {supplier.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-slate-100">
                        {supplier.products && supplier.products.length > 0 ? (
                          <span className="inline-flex flex-wrap gap-1">
                            {supplier.products.slice(0, 3).map((product, index) => (
                              <span key={index} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                                {product}
                              </span>
                            ))}
                            {supplier.products.length > 3 && (
                              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                +{supplier.products.length - 3} more
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">No products listed</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${supplier.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : supplier.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                        {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openViewModal(supplier)}
                          className="text-primary hover:text-primary/80 p-1 rounded transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => openEditModal(supplier)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button
                            onClick={() => openDeleteModal(supplier)}
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-100 px-4 py-3 flex items-center justify-between border-t border-gray-300 sm:px-6">
            <div className="flex-1 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span> of{' '}
                  <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-gray-100 text-sm font-medium text-gray-500 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pagination.page === page
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-gray-100 text-sm font-medium text-gray-500 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Supplier Modal (Create/Edit/View) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-100 rounded-lg shadow-xl p-6 w-full max-w-4xl my-8 max-h-[85vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {modalMode === 'create' && 'Add New Supplier'}
              {modalMode === 'edit' && 'Edit Supplier'}
              {modalMode === 'view' && 'Supplier Details'}
            </h2>

            {modalMode === 'view' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-slate-100">{selectedSupplier?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-slate-100">{selectedSupplier?.contactPerson}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-slate-100">{selectedSupplier?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-slate-100">{selectedSupplier?.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-slate-100 capitalize">{selectedSupplier?.status}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-slate-100">{selectedSupplier?.paymentTerms || 'Net 30'}</p>
                  </div>
                </div>

                {selectedSupplier?.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-slate-100 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {selectedSupplier.address.street && `${selectedSupplier.address.street}, `}
                      {selectedSupplier.address.city && `${selectedSupplier.address.city}, `}
                      {selectedSupplier.address.state && `${selectedSupplier.address.state} `}
                      {selectedSupplier.address.zipCode && `${selectedSupplier.address.zipCode}, `}
                      {selectedSupplier.address.country}
                    </p>
                  </div>
                )}

                {modalMode === 'view' && selectedSupplier && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Products</label>
                    <div className="mt-2">
                      {productsLoading ? (
                        <div className="flex items-center text-sm text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Loading products...
                        </div>
                      ) : productsError ? (
                        <p className="text-sm text-red-600">{productsError}</p>
                      ) : supplierProducts.length > 0 ? (
                        <div className="overflow-hidden border border-gray-300 rounded-md">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-200">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                              </tr>
                            </thead>
                            <tbody className="bg-gray-100 divide-y divide-gray-200">
                              {supplierProducts.map((product) => (
                                <tr key={product._id || `${product.name}-${product.batchNumber || product.category || product.quantity}`}>
                                  <td className="px-3 py-2 text-gray-900">{product.name}</td>
                                  <td className="px-3 py-2 text-gray-500">{product.category?.name || '—'}</td>
                                  <td className="px-3 py-2 text-gray-500">
                                    {product.price !== undefined ? `₹${Number(product.price).toFixed(2)}` : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-gray-500">{product.quantity ?? '—'}</td>
                                  <td className="px-3 py-2 text-gray-500">{product.batchNumber || '—'}</td>
                                  <td className="px-3 py-2 text-gray-500">
                                    {product.manufacturingDate ? new Date(product.manufacturingDate).toLocaleDateString() : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No products found for this supplier.</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedSupplier?.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-slate-100">{selectedSupplier.notes}</p>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-600 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Person *</label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone *</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >

                      <option value="Due on receipt">Due on receipt</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Street"
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={formData.address.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="ZIP Code"
                      value={formData.address.zipCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, zipCode: e.target.value }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Country"
                      value={formData.address.country}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, country: e.target.value }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 md:col-span-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Products</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a product"
                      value={newProduct}
                      onChange={(e) => setNewProduct(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProduct())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addProduct}
                      className="px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-900"
                    >
                      Add
                    </button>
                  </div>
                  {formData.products.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.products.map((product, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center">
                          {product}
                          <button
                            type="button"
                            onClick={() => removeProduct(index)}
                            className="ml-1 text-blue-700 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-800 border border-transparent rounded-md hover:bg-blue-900 transition-colors"
                  >
                    {modalMode === 'create' ? 'Create Supplier' : 'Update Supplier'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-100 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Delete Supplier</h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete <strong>{selectedSupplier?.name}</strong>?
              This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSuppliers;