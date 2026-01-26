import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  Calendar,
  ArrowLeft,
  Eye,
  FileText,
  TrendingDown,
  Activity,
  Clock,
  Target
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import billApiService from '../services/billApiService';
import productService from '../services/productService';

const ProductSellingReport = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [sellingData, setSellingData] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    if (productId) {
      fetchProductData();
    }
  }, [productId]);

  useEffect(() => {
    if (product) {
      fetchSellingData();
    }
  }, [product, startDate, endDate, timeRange]);

  const fetchProductData = async () => {
    try {
      const productData = await productService.getProductById(productId);
      setProduct(productData);
    } catch (err) {
      setError('Failed to fetch product details');
      console.error('Error fetching product:', err);
    }
  };

  const fetchSellingData = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 50
      };

      const response = await billApiService.getProductSellingDetails(productId, params);

      // The response structure should match what we expect
      if (response) {
        setSellingData(response.metrics || {});
        setBillHistory(response.salesHistory || []);
      }

    } catch (err) {
      setError(err.message || 'Failed to fetch selling data');
    } finally {
      setLoading(false);
    }
  };

  const getSalesTrendData = () => {
    if (!billHistory.length) return null;

    // Group by date
    const dailySales = billHistory.reduce((acc, bill) => {
      const date = new Date(bill.billDate).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { quantity: 0, revenue: 0, count: 0 };
      }
      acc[date].quantity += bill.quantity;
      acc[date].revenue += bill.total;
      acc[date].count += 1;
      return acc;
    }, {});

    const dates = Object.keys(dailySales).sort();
    const quantities = dates.map(date => dailySales[date].quantity);
    const revenues = dates.map(date => dailySales[date].revenue);

    return {
      labels: dates,
      datasets: [
        {
          label: 'Quantity Sold',
          data: quantities,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          yAxisID: 'y',
        },
        {
          label: 'Revenue',
          data: revenues,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          yAxisID: 'y1',
        },
      ],
    };
  };

  const getPriceTrendData = () => {
    if (!billHistory.length) return null;

    const priceData = billHistory.map(bill => ({
      date: new Date(bill.billDate).toLocaleDateString(),
      price: bill.price,
      quantity: bill.quantity
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      labels: priceData.map(item => item.date),
      datasets: [
        {
          label: 'Selling Price',
          data: priceData.map(item => item.price),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: true,
        },
      ],
    };
  };

  const calculateMetrics = () => {
    if (!sellingData) return null;

    const totalRevenue = sellingData.totalRevenue || 0;
    const totalQuantity = sellingData.totalQuantity || 0;
    const averagePrice = totalRevenue / totalQuantity;
    const billsCount = sellingData.billsCount || 0;

    return {
      totalRevenue,
      totalQuantity,
      averagePrice,
      billsCount,
      priceRange: sellingData.minPrice && sellingData.maxPrice ? `${sellingData.minPrice} - ${sellingData.maxPrice}` : 'N/A'
    };
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#64748b',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#cbd5e1',
        borderWidth: 1
      }
    }
  };

  const trendChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Quantity Sold'
        },
        grid: {
          color: '#e2e8f0'
        },
        ticks: {
          color: '#64748b'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Revenue (₹)'
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#64748b'
        }
      },
      x: {
        grid: {
          color: '#e2e8f0'
        },
        ticks: {
          color: '#64748b'
        }
      }
    }
  };

  const priceChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Price (₹)'
        },
        grid: {
          color: '#e2e8f0'
        },
        ticks: {
          color: '#64748b'
        }
      },
      x: {
        grid: {
          color: '#e2e8f0'
        },
        ticks: {
          color: '#64748b'
        }
      }
    }
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading product selling report...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-200">
        <div className="text-center">
          <div className="text-red-500">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
            <p>The requested product could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-200">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/selling-report')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
              {product.name}
            </h1>
            <p className="mt-2 text-gray-600">Detailed selling analysis for this product</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg backdrop-blur-sm bg-red-50 border border-red-200 text-red-700">
          <div className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* Product Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-2 p-6 rounded-xl border bg-gray-100 border-gray-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Product Name</p>
              <p className="font-medium text-gray-900">{product.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p className="font-medium text-gray-900">{product.category?.name || 'No Category'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Stock</p>
              <p className="font-medium text-gray-900">{product.quantity} {product.unit || 'PCS'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Base Price</p>
              <p className="font-medium text-gray-900">₹{product.price?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Sold</span>
              <span className="font-medium">{metrics?.totalQuantity || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Revenue</span>
              <span className="font-medium text-green-600">₹{metrics?.totalRevenue?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Price</span>
              <span className="font-medium">₹{metrics?.averagePrice?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Bill Count</span>
              <span className="font-medium">{metrics?.billsCount || 0}</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Analytics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Price Range</span>
              <span className="font-medium">{metrics?.priceRange}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Current Stock</span>
              <span className="font-medium">{product.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Stock Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.quantity === 0 ? 'bg-red-100 text-red-800' :
                product.quantity <= 10 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                {product.quantity === 0 ? 'Out of Stock' :
                  product.quantity <= 10 ? 'Low Stock' : 'In Stock'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Trend */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300">
          <div className="flex items-center mb-6">
            <div className="p-2 rounded-lg mr-3 bg-blue-50">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
          </div>
          <div className="h-80">
            {getSalesTrendData() ? (
              <Line data={getSalesTrendData()} options={trendChartOptions} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Activity className="w-12 h-12 mb-2 opacity-50" />
                No sales data available
              </div>
            )}
          </div>
        </div>

        {/* Price Trend */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300">
          <div className="flex items-center mb-6">
            <div className="p-2 rounded-lg mr-3 bg-blue-50">
              <TrendingUp className="w-5 h-5 text-blue-700" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Price Trend</h3>
          </div>
          <div className="h-80">
            {getPriceTrendData() ? (
              <Line data={getPriceTrendData()} options={priceChartOptions} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <TrendingUp className="w-12 h-12 mb-2 opacity-50" />
                No price data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Bills */}
      <div className="rounded-xl border overflow-hidden bg-gray-100 border-gray-300">
        <div className="p-6 border-b border-gray-300">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Sales History</h3>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100 border-gray-300 text-gray-900 border text-sm"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100 border-gray-300 text-gray-900 border text-sm"
                placeholder="End Date"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Bill Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Quantity
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Unit Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Payment Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {billHistory.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center text-gray-400">
                      <FileText className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-lg">No sales history found</p>
                      <p className="text-sm">This product hasn't been sold yet or try adjusting the date filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                billHistory.map((bill) => (
                  <tr key={bill._id} className="transition-colors duration-150 hover:bg-gray-200">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{bill.billNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{new Date(bill.billDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{bill.customerName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{bill.quantity}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">₹{bill.price.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-green-600">₹{bill.total.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${bill.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 border-green-200' :
                        bill.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }`}>
                        {bill.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductSellingReport;
