import React, { useState } from 'react';

const InwardList = ({
  inwards,
  isLoading,
  onViewDetails,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onComplete,
  filters,
  onFilterChange,
  user,
  totalItems = 0,
  currentPage = 1,
  itemsPerPage = 10,
  onPageChange
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

  if (!isLoading && inwards.length === 0) {
    return (
      <div className="bg-gray-100 shadow-md rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Inwards Found</h3>
        <p className="text-gray-500 mb-4">There are no inwards to display. Create a new inward to get started.</p>
        <button
          onClick={() => onFilterChange({ status: '' })}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 shadow-sm transition-colors"
        >
          Refresh
        </button>
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
              placeholder="Search by GRN number, invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
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
                GRN Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Products
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Received Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
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
            {inwards && inwards.length > 0 ? (
              inwards.map((inward) => (
                <tr key={inward._id} className="hover:bg-gray-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {inward.grnNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {inward.supplier?.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs">
                      {inward.items && inward.items.length > 0 ? (
                        <div className="space-y-1">
                          {inward.items.slice(0, 2).map((item, index) => (
                            <div key={index} className="truncate">
                              • {item.product?.name || item.productName || 'N/A'} ({item.receivedQuantity})
                            </div>
                          ))}
                          {inward.items.length > 2 && (
                            <div className="text-xs text-gray-400">
                              +{inward.items.length - 2} more
                            </div>
                          )}
                        </div>
                      ) : (
                        'No items'
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(inward.receivedDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${!inward.status ? 'bg-gray-100 text-gray-800' :
                        inward.status === 'completed' ? 'bg-green-100 text-green-800' :
                          inward.status === 'approved' ? 'bg-indigo-100 text-indigo-800' :
                            inward.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              inward.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                      }`}>
                      {inward.status ? (inward.status.charAt(0).toUpperCase() + inward.status.slice(1)) : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(inward.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onViewDetails(inward._id)}
                        className="text-primary hover:text-primary/80"
                      >
                        View
                      </button>
                      {user?.role === 'superadmin' ? (
                        // Superadmin only sees delete, edit, and complete buttons regardless of status
                        <>
                          <button
                            onClick={() => onEdit(inward._id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(inward._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                          {inward.status === 'approved' && (
                            <button
                              onClick={() => onComplete(inward._id)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Add to Inventory
                            </button>
                          )}
                        </>
                      ) : (user?.role === 'admin' || user?.role === 'stockmanager') ? (
                        // Admin and Stockmanager see the full workflow
                        <>
                          {inward.status === 'draft' && (
                            <>
                              <button
                                onClick={() => onEdit(inward._id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => onDelete(inward._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </>
                          )}
                          {inward.status === 'pending' && (
                            <>
                              <button
                                onClick={() => onApprove(inward._id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => onReject(inward._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {inward.status === 'approved' && (
                            <button
                              onClick={() => onComplete(inward._id)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Add to Inventory
                            </button>
                          )}
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No inwards found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalItems > itemsPerPage && (
        <div className="px-6 py-4 border-t border-gray-300">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </span>{' '}
              of <span className="font-medium">{totalItems}</span> results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${currentPage === 1
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Previous
              </button>
              {Array.from({ length: Math.ceil(totalItems / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1 rounded-md ${currentPage === page
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage * itemsPerPage >= totalItems}
                className={`px-3 py-1 rounded-md ${currentPage * itemsPerPage >= totalItems
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InwardList;
