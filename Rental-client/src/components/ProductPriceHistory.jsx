import React from 'react';
import { format } from 'date-fns';

const ProductPriceHistory = ({ priceHistory = [], loading = false }) => {
  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-100 rounded-lg shadow">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mb-2"></div>
        <p className="text-gray-600">Loading price history...</p>
      </div>
    );
  }

  // Show empty state if no price history
  if (!priceHistory || priceHistory.length === 0) {
    return (
      <div className="bg-gray-100 p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Price History</h3>
        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
            />
          </svg>
          <p className="mt-2 text-sm">No price history available</p>
          <p className="text-xs text-gray-400">Price changes will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-300">
        <h3 className="text-lg font-medium text-gray-900">Price History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <span>Date</span>
                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Batch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-100 divide-y divide-gray-200">
            {priceHistory.map((item, index) => {
              const priceChange = index < priceHistory.length - 1 
                ? item.price - priceHistory[index + 1].price 
                : 0;
              const isPriceIncrease = priceChange > 0;
              const isPriceDecrease = priceChange < 0;
              
              return (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-200 hover:bg-gray-100'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex flex-col">
                      <span>{format(new Date(item.date), 'MMM d, yyyy')}</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(item.date), 'h:mm a')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        ₹{item.price?.toFixed(2) || '0.00'}
                      </span>
                      {index < priceHistory.length - 1 && (
                        <span className={`ml-2 text-xs font-medium ${isPriceIncrease ? 'text-red-600' : 'text-green-600'}`}>
                          {isPriceIncrease ? '↑' : isPriceDecrease ? '↓' : ''}
                          {priceChange !== 0 ? Math.abs(priceChange).toFixed(2) : ''}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${item.type === 'new' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {item.type?.charAt(0).toUpperCase() + item.type?.slice(1) || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.batchNumber ? (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                        {item.batchNumber}
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {index === 0 ? (
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Current
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        Historical
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductPriceHistory;
