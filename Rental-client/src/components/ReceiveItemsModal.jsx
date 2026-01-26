import React, { useState, useEffect } from 'react';

const ReceiveItemsModal = ({ purchase, onClose, onSubmit, isLoading }) => {
  const [receivedItems, setReceivedItems] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (purchase && purchase.items) {
      setReceivedItems(
        purchase.items.map(item => ({
          itemId: item._id,
          productName: item.product?.name || '',
          orderedQuantity: item.quantity,
          receivedQuantity: item.receivedQuantity || 0,
          maxReceivable: item.quantity - (item.receivedQuantity || 0)
        }))
      );
    }
  }, [purchase]);

  const updateReceivedQuantity = (index, quantity) => {
    const newReceivedItems = [...receivedItems];
    newReceivedItems[index].receivedQuantity = Math.max(0, Math.min(quantity, newReceivedItems[index].maxReceivable));
    setReceivedItems(newReceivedItems);
  };

  const validateForm = () => {
    const newErrors = {};
    let hasReceivedItems = false;

    receivedItems.forEach((item, index) => {
      if (item.receivedQuantity > 0) {
        hasReceivedItems = true;
        if (item.receivedQuantity > item.maxReceivable) {
          newErrors[`item_${index}`] = `Cannot receive more than ${item.maxReceivable} items`;
        }
      }
    });

    if (!hasReceivedItems) {
      newErrors.general = 'Please receive at least one item';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const itemsToReceive = receivedItems
        .filter(item => item.receivedQuantity > 0)
        .map(item => ({
          itemId: item.itemId,
          receivedQuantity: item.receivedQuantity
        }));

      onSubmit(itemsToReceive);
    }
  };

  if (!purchase) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-gray-100">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Receive Items - PO: {purchase.purchaseOrderNumber}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {errors.general}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ordered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Already Received
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Max Receivable
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receive Now
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-100 divide-y divide-gray-200">
                  {receivedItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.orderedQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.orderedQuantity - item.maxReceivable}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.maxReceivable}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          max={item.maxReceivable}
                          value={item.receivedQuantity}
                          onChange={(e) => updateReceivedQuantity(index, parseInt(e.target.value) || 0)}
                          className={`w-20 px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`item_${index}`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`item_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`item_${index}`]}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-2000 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? 'Receiving...' : 'Receive Items'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReceiveItemsModal;
