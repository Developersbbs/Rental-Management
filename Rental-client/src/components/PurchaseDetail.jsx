import React from 'react';

const PurchaseDetail = ({
  purchase,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onReceive,
  user
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-indigo-100 text-indigo-800',
      rejected: 'bg-red-100 text-red-800',
      partially_received: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800'
    };

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  if (!purchase) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">No purchase selected</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 shadow-md rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-300">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PO: {purchase.purchaseOrderNumber}</h1>
            <p className="text-gray-600 mt-1">Created on {formatDate(purchase.orderDate)}</p>
          </div>
          <div className="flex gap-2">
            {getStatusBadge(purchase.status)}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Supplier</dt>
                <dd className="text-sm text-gray-900">{purchase.supplier?.name}</dd>
              </div>
              {purchase.supplierInvoiceNumber && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Supplier Invoice #</dt>
                  <dd className="text-sm text-gray-900">{purchase.supplierInvoiceNumber}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Expected Delivery Date</dt>
                <dd className="text-sm text-gray-900">
                  {purchase.expectedDeliveryDate ? formatDate(purchase.expectedDeliveryDate) : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created By</dt>
                <dd className="text-sm text-gray-900">{purchase.createdBy?.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created Date</dt>
                <dd className="text-sm text-gray-900">{formatDate(purchase.createdAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Status Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Status Information</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-sm text-gray-900">{getStatusBadge(purchase.status)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Completion</dt>
                <dd className="text-sm text-gray-900">{purchase.completionPercentage}%</dd>
              </div>
              {purchase.approvedBy && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Approved By</dt>
                  <dd className="text-sm text-gray-900">{purchase.approvedBy?.name}</dd>
                </div>
              )}
              {purchase.approvalDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Approval Date</dt>
                  <dd className="text-sm text-gray-900">{formatDate(purchase.approvalDate)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Items */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ordered Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Received Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-100 divide-y divide-gray-200">
                {purchase.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.product?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.receivedQuantity || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(item.unitCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 bg-gray-200 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-900">Total Amount:</span>
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(purchase.totalAmount)}
            </span>
          </div>
        </div>

        {/* Notes */}
        {purchase.notes && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
            <div className="bg-gray-200 p-4 rounded-lg">
              <p className="text-gray-700">{purchase.notes}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          {purchase.status === 'draft' && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 shadow-sm transition-colors"
            >
              Edit
            </button>
          )}

          {purchase.status === 'pending' && user?.role === 'admin' && (
            <>
              <button
                onClick={() => onApprove(purchase._id)}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(purchase._id)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Reject
              </button>
            </>
          )}

          {(purchase.status === 'approved' || purchase.status === 'partially_received') && (
            <button
              onClick={() => onReceive(purchase._id)}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
            >
              Receive Items
            </button>
          )}

          {purchase.status === 'draft' && (
            <button
              onClick={() => onDelete(purchase._id)}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseDetail;
