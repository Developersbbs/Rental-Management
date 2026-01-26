import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  Database,
  Eye
} from 'lucide-react';
import { Pie, Bar } from 'react-chartjs-2';
import billApiService from '../services/billApiService';
import productService from '../services/productService';
import categoryService from '../services/categoryService';

const SellingReport = () => {
  const navigate = useNavigate();
  const [sellingData, setSellingData] = useState([]);
  const [summary, setSummary] = useState({});
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('revenue');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchSellingReport();
  }, [startDate, endDate, selectedProduct, selectedCategory, sortBy, sortOrder]);

  const fetchInitialData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.getAllProducts(),
        categoryService.getAllCategories()
      ]);

      setProducts(productsData.products || productsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    }
  };

  const fetchSellingReport = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError('');

      const params = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        productId: selectedProduct !== 'all' ? selectedProduct : undefined,
        categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
        sortBy,
        sortOrder
      };

      const response = await billApiService.getSellingReport(params);
      setSellingData(response.products || []);
      setSummary(response.summary || {});
    } catch (err) {
      setError(err.message || 'Failed to fetch selling report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getCategoryChartData = () => {
    if (!sellingData.length) return null;

    const categoryData = sellingData.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = { revenue: 0, quantity: 0 };
      }
      acc[category].revenue += item.totalRevenue;
      acc[category].quantity += item.totalQuantity;
      return acc;
    }, {});

    const data = Object.entries(categoryData).map(([name, value]) => ({
      name,
      revenue: value.revenue,
      quantity: value.quantity
    }));

    return {
      labels: data.map(item => item.name),
      datasets: [
        {
          label: 'Revenue',
          data: data.map(item => item.revenue),
          backgroundColor: [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
            '#84cc16', '#f97316', '#ec4899', '#6366f1'
          ],
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };
  };

  const getTopProductsChartData = () => {
    if (!sellingData.length) return null;

    const topProducts = sellingData.slice(0, 10); // Top 10 products

    return {
      labels: topProducts.map(item => item.productName.length > 20 ?
        item.productName.substring(0, 20) + '...' : item.productName),
      datasets: [
        {
          label: 'Revenue',
          data: topProducts.map(item => item.totalRevenue),
          backgroundColor: '#8b5cf6',
          borderColor: '#8b5cf6',
          borderWidth: 1,
        },
      ],
    };
  };

  const exportToCSV = () => {
    const headers = ['Product Name', 'Category', 'Total Quantity', 'Total Revenue', 'Average Price', 'Min Price', 'Max Price', 'Bills Count'];
    const csvData = sellingData.map(product => [
      product.productName,
      product.category || 'Uncategorized',
      product.totalQuantity,
      `₹${product.totalRevenue.toLocaleString()}`,
      `₹${product.averagePrice.toLocaleString()}`,
      `₹${product.minPrice.toLocaleString()}`,
      `₹${product.maxPrice.toLocaleString()}`,
      product.billsCount
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selling-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading selling report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-200">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent text-gray-900">
              Selling Report
            </h1>
            <p className="mt-2 text-gray-600">Comprehensive analysis of product sales and revenue</p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={fetchSellingReport}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg backdrop-blur-sm bg-red-50 border border-red-200 text-red-700">
          <div className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Products Sold Card */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300 hover:border-gray-300 shadow-sm transition-all duration-300 hover:transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-lg mr-4 bg-blue-50">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Products Sold</h3>
              <p className="text-2xl font-bold text-gray-900">{sellingData.length}</p>
            </div>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300 hover:border-gray-300 shadow-sm transition-all duration-300 hover:transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-lg mr-4 bg-green-50">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
              <p className="text-2xl font-bold text-gray-900">₹{summary.totalRevenue?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Total Bills Card */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300 hover:border-gray-300 shadow-sm transition-all duration-300 hover:transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-lg mr-4 bg-purple-50">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Total Bills</h3>
              <p className="text-2xl font-bold text-gray-900">{summary.totalBills || 0}</p>
            </div>
          </div>
        </div>

        {/* Total Items Sold Card */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300 hover:border-gray-300 shadow-sm transition-all duration-300 hover:transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-lg mr-4 bg-blue-50">
              <TrendingUp className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Items Sold</h3>
              <p className="text-2xl font-bold text-gray-900">{summary.totalItems || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Revenue Distribution */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300">
          <div className="flex items-center mb-6">
            <div className="p-2 rounded-lg mr-3 bg-blue-50">
              <PieChartIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Revenue by Category</h3>
          </div>
          <div className="h-80">
            {getCategoryChartData() ? (
              <Pie data={getCategoryChartData()} options={chartOptions} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Database className="w-12 h-12 mb-2 opacity-50" />
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Top Products Revenue */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300">
          <div className="flex items-center mb-6">
            <div className="p-2 rounded-lg mr-3 bg-purple-50">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Top Products by Revenue</h3>
          </div>
          <div className="h-80">
            {getTopProductsChartData() ? (
              <Bar data={getTopProductsChartData()} options={barChartOptions} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Database className="w-12 h-12 mb-2 opacity-50" />
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="p-6 rounded-xl border mb-6 backdrop-blur-sm bg-gray-100 border-gray-300">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Product Sales Data</h3>
          <div className="flex flex-col sm:flex-row gap-3 flex-1 lg:flex-none lg:justify-end">
            {/* Date Range */}
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100 border-gray-300 text-gray-900 border"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100 border-gray-300 text-gray-900 border"
                placeholder="End Date"
              />
            </div>

            {/* Product Filter */}
            <div className="relative flex-1 sm:flex-none">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="pl-10 pr-8 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none w-full transition-all duration-200 bg-gray-100 border-gray-300 text-gray-900 border"
              >
                <option value="all">All Products</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
            </div>

            {/* Category Filter */}
            <div className="relative flex-1 sm:flex-none">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none w-full transition-all duration-200 bg-gray-100 border-gray-300 text-gray-900 border"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id || category} value={category._id || category}>
                    {category.name || category}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
            </div>

            {/* Sort By */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="pl-3 pr-8 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none w-full transition-all duration-200 bg-gray-100 border-gray-300 text-gray-900 border"
              >
                <option value="revenue-desc">Revenue (High to Low)</option>
                <option value="revenue-asc">Revenue (Low to High)</option>
                <option value="totalQuantity-desc">Quantity (High to Low)</option>
                <option value="totalQuantity-asc">Quantity (Low to High)</option>
                <option value="productName-asc">Product Name (A-Z)</option>
                <option value="productName-desc">Product Name (Z-A)</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border overflow-hidden bg-gray-100 border-gray-300">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Quantity Sold
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total Revenue
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Avg Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Price Range
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Bills Count
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sellingData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center text-gray-400">
                      <Database className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-lg">No sales data found</p>
                      <p className="text-sm">Try adjusting your filters or date range</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sellingData.map((product) => (
                  <tr key={product._id} className="transition-colors duration-150 hover:bg-gray-200">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                        {product.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.totalQuantity}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-green-600">₹{product.totalRevenue.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">₹{product.averagePrice.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        ₹{product.minPrice.toLocaleString()} - ₹{product.maxPrice.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{product.billsCount}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/product-selling-report/${product._id}`)}
                        className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      >
                        <Eye className="w-3 h-3" />
                        View Details
                      </button>
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

export default SellingReport;
