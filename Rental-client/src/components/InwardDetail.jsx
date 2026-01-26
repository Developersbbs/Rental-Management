import React from 'react';

const InwardDetail = ({
  inward,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onComplete,
  onSubmitForApproval,
  onAddToInventory,
  user
}) => {
  const formatDate = (dateString) => {
    try {
      if (!dateString || dateString === '0000-00-00' || dateString === '0000-00-00T00:00:00.000Z') return 'Not set';
      const date = new Date(dateString);
      return isNaN(date.getTime())
        ? 'Invalid date'
        : date.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'Asia/Kolkata'
        });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error';
    }
  };

  const formatCurrency = (amount) => {
    try {
      if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(Number(amount));
    } catch (error) {
      console.error('Error formatting currency:', error);
      return '₹0.00';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { text: 'Draft', class: 'bg-gray-100 text-gray-800' },
      pending: { text: 'Pending', class: 'bg-yellow-100 text-yellow-800' },
      approved: { text: 'Approved', class: 'bg-indigo-100 text-indigo-800' },
      rejected: { text: 'Rejected', class: 'bg-red-100 text-red-800' },
      completed: { text: 'Completed', class: 'bg-green-100 text-green-800' },
      unknown: { text: 'Unknown', class: 'bg-gray-100 text-gray-800' }
    };

    const statusKey = status?.toLowerCase() || 'unknown';
    const { text, class: statusClass } = statusConfig[statusKey] || statusConfig.unknown;

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
        {text}
      </span>
    );
  };

  const getQualityStatusBadge = (status) => {
    const statusConfig = {
      pending: { text: 'Pending', class: 'bg-yellow-100 text-yellow-800' },
      passed: { text: 'Passed', class: 'bg-green-100 text-green-800' },
      failed: { text: 'Failed', class: 'bg-red-100 text-red-800' },
      partial: { text: 'Partial', class: 'bg-indigo-100 text-indigo-800' },
      unknown: { text: 'Not Checked', class: 'bg-gray-100 text-gray-800' }
    };

    const statusKey = status?.toLowerCase() || 'unknown';
    const { text, class: statusClass } = statusConfig[statusKey] || statusConfig.unknown;

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
        {text}
      </span>
    );
  };

  if (!inward) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading inward details...</div>
      </div>
    );
  }

  // Helper function to get product name safely
  const getProductName = (item) => {
    if (!item) return 'Unknown Product';
    // If product is an object with name
    if (item.product && typeof item.product === 'object' && item.product.name) {
      return item.product.name;
    }
    // If product is a string
    if (typeof item.product === 'string') {
      // If it's an ObjectId, prefer productName from item
      if (/^[0-9a-fA-F]{24}$/.test(item.product)) {
        return item.productName || 'Unknown Product';
      }
      // Otherwise it's already a name string
      return item.product;
    }
    // Fallback to productName stored on item
    return item.productName || 'Unknown Product';
  };

  // Helper function to get product details safely
  const getProductDetails = (item) => {
    if (!item) return {};
    return {
      name: getProductName(item),
      unit: item.unit || 'pcs',
      price: item.unitCost || 0,
      quantity: item.receivedQuantity || 0,
      total: (item.receivedQuantity || 0) * (item.unitCost || 0)
    };
  };

  // Check if items exist and is an array
  const hasItems = inward.items && Array.isArray(inward.items) && inward.items.length > 0;

  return (
    <div className="bg-gray-100 shadow-md rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-300">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {inward.grnNumber ? `GRN: ${inward.grnNumber}` : 'New Inward (Draft)'}
            </h1>
            <p className="text-gray-600 mt-1">
              {inward.receivedDate && inward.receivedDate !== '0000-00-00' && inward.receivedDate !== '0000-00-00T00:00:00.000Z'
                ? `Received on ${formatDate(inward.receivedDate)}`
                : 'No received date'}
              {inward.updatedAt && (
                <span className="text-xs text-gray-500 ml-2">
                  (Last updated: {formatDate(inward.updatedAt)})
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {getStatusBadge(inward.status)}
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
                <dd className="text-sm text-gray-900">
                  {inward.supplier?.name || 'Not specified'}
                  {inward.supplier?.contactNumber && (
                    <div className="text-xs text-gray-500">{inward.supplier.contactNumber}</div>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Purchase Order</dt>
                <dd className="text-sm text-gray-900">
                  {inward.purchaseOrder?.purchaseOrderNumber || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Invoice Number</dt>
                <dd className="text-sm text-gray-900">{inward.invoiceNumber || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Invoice Date</dt>
                <dd className="text-sm text-gray-900">
                  {inward.invoiceDate ? formatDate(inward.invoiceDate) : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Delivery Challan</dt>
                <dd className="text-sm text-gray-900">{inward.deliveryChallanNumber || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Vehicle Number</dt>
                <dd className="text-sm text-gray-900">{inward.vehicleNumber || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created By</dt>
                <dd className="text-sm text-gray-900">
                  {inward.createdBy?.name || 'System'}
                  {inward.createdBy?.email && (
                    <div className="text-xs text-gray-500">{inward.createdBy.email}</div>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created Date</dt>
                <dd className="text-sm text-gray-900">
                  {inward.createdAt ? formatDate(inward.createdAt) : 'N/A'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Status Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Status Information</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-sm text-gray-900">
                  {getStatusBadge(inward.status || 'draft')}
                  {inward.status === 'draft' && (
                    <p className="text-xs text-gray-500 mt-1">Submit for approval to generate GRN</p>
                  )}
                </dd>
              </div>
              {inward.status === 'approved' && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Inventory Status</dt>
                  <dd className="text-sm text-gray-900">
                    {inward.inventoryAdded ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Added to Inventory
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending Inventory
                      </span>
                    )}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Quality Check Status</dt>
                <dd className="text-sm text-gray-900">
                  {getQualityStatusBadge(inward.qualityCheckStatus || 'pending')}
                  {inward.status === 'draft' && (
                    <p className="text-xs text-gray-500 mt-1">Quality check will be performed after submission</p>
                  )}
                </dd>
              </div>
              {inward.approvedBy && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Approved By</dt>
                  <dd className="text-sm text-gray-900">{inward.approvedBy?.name}</dd>
                </div>
              )}
              {inward.approvalDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Approval Date</dt>
                  <dd className="text-sm text-gray-900">{formatDate(inward.approvalDate)}</dd>
                </div>
              )}
              {inward.rejectionReason && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Rejection Reason</dt>
                  <dd className="text-sm text-gray-900">{inward.rejectionReason}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Items */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Items</h2>
          <div className="overflow-x-auto">
            {!hasItems ? (
              <div className="text-center py-4 text-gray-500">
                No items found in this inward
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Details</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-100 divide-y divide-gray-200">
                  {inward.items.map((item, index) => {
                    const product = getProductDetails(item);
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.quantity}</div>
                          <div className="text-xs text-gray-500">{product.unit}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(product.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>Batch: {item.batchNumber || 'N/A'}</div>
                          {item.manufacturingDate && (
                            <div>MFG: {formatDate(item.manufacturingDate)}</div>
                          )}
                          {item.expiryDate && (
                            <div>EXP: {formatDate(item.expiryDate)}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-right px-6 py-4 text-sm font-medium text-gray-900">
                      Grand Total:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {formatCurrency(
                        inward.items.reduce(
                          (sum, item) => sum + ((item.receivedQuantity || 0) * (item.unitCost || 0)),
                          0
                        )
                      )}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Quality Check Notes */}
          {inward.qualityCheckNotes && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">Quality Check Notes</h3>
              <p className="text-sm text-yellow-700">{inward.qualityCheckNotes}</p>
            </div>
          )}
        </div>

        {/* Notes */}
        {inward.notes && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
            <div className="bg-gray-200 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-line">{inward.notes}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          {inward.status === 'draft' && (
            <>
              {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'stockmanager') && (
                <button
                  onClick={onEdit}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 shadow-sm transition-colors"
                >
                  Edit
                </button>
              )}

              {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'stockmanager') && (
                <button
                  onClick={() => onDelete(inward._id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Delete
                </button>
              )}
            </>
          )}

          {/* Add to Inventory button for all statuses for admin/stockmanager */}
          {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'stockmanager') &&
            !inward.inventoryAdded && (
              <button
                onClick={() => onAddToInventory && onAddToInventory(inward._id)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              >
                Add to Inventory
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default InwardDetail;
