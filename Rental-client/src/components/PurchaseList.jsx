import React, { useState } from 'react';

const PurchaseList = ({
  purchases,
  isLoading,
  onViewDetails,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onReceive,
  onPay,
  filters,
  onFilterChange,
  user
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(filters.status);

  const handleSearch = (e) => {
    e.preventDefault();
    onFilterChange({ search: searchTerm, status: statusFilter });
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    onFilterChange({ status, search: searchTerm });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 shadow-md rounded-lg">
      {/* Filters */}
      <div className="p-4 border-b border-gray-300">
        <form onSubmit={handleSearch} className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by PO number, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="partially_received">Partially Received</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 shadow-sm transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PO Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier Invoice
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paid
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-100 divide-y divide-gray-200">
            {purchases && purchases.length > 0 ? (
              purchases.map((purchase) => (
                <tr key={purchase._id} className="hover:bg-gray-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {purchase.purchaseOrderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {purchase.supplierInvoiceNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {purchase.supplier?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(purchase.orderDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${purchase.status === 'completed' ? 'bg-green-100 text-green-800' :
                      purchase.status === 'approved' ? 'bg-indigo-100 text-indigo-800' :
                        purchase.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                      }`}>
                      {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1).replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(purchase.paidAmount || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(purchase.dueAmount || purchase.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${(purchase.paymentStatus === 'paid') ? 'bg-green-100 text-green-800' :
                      (purchase.paymentStatus === 'partial') ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                      {purchase.paymentStatus ? purchase.paymentStatus.charAt(0).toUpperCase() + purchase.paymentStatus.slice(1) : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(purchase.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onViewDetails(purchase._id)}
                        className="text-primary hover:text-primary/80"
                      >
                        View
                      </button>
                      {purchase.status === 'draft' && (
                        <button
                          onClick={() => onEdit(purchase._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Edit
                        </button>
                      )}
                      {purchase.status === 'pending' && user?.role === 'admin' && (
                        <>
                          <button
                            onClick={() => onApprove(purchase._id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onReject(purchase._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {(purchase.status === 'approved' || purchase.status === 'partially_received') && (
                        <button
                          onClick={() => onReceive(purchase._id)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Receive
                        </button>
                      )}
                      {(purchase.paymentStatus !== 'paid' && purchase.status !== 'rejected') && (
                        <button
                          onClick={() => onPay(purchase)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Pay
                        </button>
                      )}
                      {purchase.status === 'draft' && (
                        <button
                          onClick={() => onDelete(purchase._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No purchase orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div >
  );
};

export default PurchaseList;
