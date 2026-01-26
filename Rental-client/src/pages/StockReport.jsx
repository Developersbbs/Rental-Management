import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  ChevronDown,
  Database
} from 'lucide-react';
import productService from '../services/productService';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

const StockReport = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [stats, setStats] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [chartThemeKey, setChartThemeKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  // Helper function to get display quantity
  const getDisplayQuantity = (product) => {
    if (product.unit === 'liter') {
      return (product.quantity / 1000).toFixed(2);
    } else if (product.unit === 'kilogram') {
      return (product.quantity / 1000).toFixed(2);
    } else {
      return product.quantity || 0;
    }
  };

  // Helper function to get display unit
  const getDisplayUnit = (product) => {
    if (product.unit === 'liter') {
      return 'L';
    } else if (product.unit === 'kilogram') {
      return 'KG';
    } else {
      return 'PCS';
    }
  };

  // Configure Chart.js for light theme
  useEffect(() => {
    const textColor = '#64748b';
    const gridColor = '#e2e8f0';
    const borderColor = '#cbd5e1';

    ChartJS.defaults.color = textColor;
    ChartJS.defaults.borderColor = borderColor;
    if (ChartJS.defaults.scales) {
      ChartJS.defaults.scales.linear = {
        ...(ChartJS.defaults.scales.linear || {}),
        grid: { color: gridColor },
        ticks: { color: textColor }
      };
      ChartJS.defaults.scales.category = {
        ...(ChartJS.defaults.scales.category || {}),
        grid: { color: gridColor },
        ticks: { color: textColor }
      };
    }

    setChartThemeKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory, stockFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError('');

      console.log('🔄 StockReport: Fetching products and categories...');

      const [productsData, categoriesData] = await Promise.all([
        productService.getAllProducts(),
        productService.getCategories()
      ]);

      console.log('🔄 StockReport: Products response:', productsData);
      console.log('🔄 StockReport: Categories response:', categoriesData);

      const products = productsData.products || productsData;
      setProducts(products);
      setFilteredProducts(products);
      setCategories(categoriesData.categories || categoriesData || []);
      setStats(productService.calculateStats(products));

      console.log('🔄 StockReport: Data processed successfully');
    } catch (err) {
      console.error('❌ StockReport: Primary fetch failed:', err);
      console.error('❌ StockReport: Error details:', err.response?.data || err.message);

      try {
        console.log('🔄 StockReport: Attempting fallback fetch...');
        const productsData = await productService.getAllProducts();
        const products = productsData.products || productsData;

        console.log('🔄 StockReport: Fallback products:', products);

        setProducts(products);
        setFilteredProducts(products);
        setCategories([]); // Set empty categories as fallback
        setStats(productService.calculateStats(products));

        console.log('🔄 StockReport: Fallback data processed successfully');
      } catch (fallbackErr) {
        console.error('❌ StockReport: Fallback fetch also failed:', fallbackErr);
        console.error('❌ StockReport: Fallback error details:', fallbackErr.response?.data || fallbackErr.message);
        setError(`Failed to load product data: ${fallbackErr.message || 'Unknown error'}`);
        setProducts([]);
        setFilteredProducts([]);
        setCategories([]);
        setStats(productService.calculateStats([]));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category?.name || product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product =>
        (product.category?.name || product.category) === selectedCategory
      );
    }

    if (stockFilter !== 'all') {
      switch (stockFilter) {
        case 'in_stock':
          filtered = filtered.filter(product => getDisplayQuantity(product) > 10);
          break;
        case 'low_stock':
          filtered = filtered.filter(product => getDisplayQuantity(product) > 0 && getDisplayQuantity(product) <= 10);
          break;
        case 'out_of_stock':
          filtered = filtered.filter(product => getDisplayQuantity(product) === 0);
          break;
      }
    }

    setFilteredProducts(filtered);
  };

  const getCategoryChartData = () => {
    if (!stats.categories) return null;
    const data = Object.entries(stats.categories).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / stats.total) * 100).toFixed(1)
    }));

    return {
      labels: data.map(item => item.name),
      datasets: [
        {
          data: data.map(item => item.value),
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

  const getStockStatusChartData = () => {
    if (!stats.inStock && !stats.lowStock && !stats.outOfStock) return null;
    return {
      labels: ['In Stock', 'Low Stock', 'Out of Stock'],
      datasets: [
        {
          data: [stats.inStock || 0, stats.lowStock || 0, stats.outOfStock || 0],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };
  };

  const getPriceRangeChartData = () => {
    if (!stats.priceRanges) return null;
    return {
      labels: Object.keys(stats.priceRanges),
      datasets: [
        {
          label: 'Products',
          data: Object.values(stats.priceRanges),
          backgroundColor: '#8b5cf6',
          borderColor: '#8b5cf6',
          borderWidth: 1,
        },
      ],
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

  const exportToCSV = () => {
    const headers = ['Name', 'Category', 'Price', 'Quantity', 'Unit', 'Total Value', 'Stock Status'];
    const csvData = filteredProducts.map(product => {
      const displayQuantity = getDisplayQuantity(product);
      const displayUnit = getDisplayUnit(product);
      const totalValue = (product.price * product.quantity).toFixed(2);
      const stockStatus = displayQuantity === 0 ? 'Out of Stock' : displayQuantity <= 10 ? 'Low Stock' : 'In Stock';

      return [
        product.name,
        product.category?.name || product.category || 'No Category',
        product.price,
        `${displayQuantity} ${displayUnit}`,
        displayUnit,
        totalValue,
        stockStatus
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading stock report...</p>
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
              Stock Report
            </h1>
            <p className="mt-2 text-gray-600">Comprehensive analysis of your inventory with charts and insights</p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={fetchData}
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
            <XCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Products Card */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300 hover:border-gray-300 shadow-sm transition-all duration-300 hover:transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-lg mr-4 bg-blue-50">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Total Products</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
          </div>
        </div>

        {/* In Stock Card */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300 hover:border-gray-300 shadow-sm transition-all duration-300 hover:transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-lg mr-4 bg-green-50">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">In Stock</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.inStock || 0}</p>
            </div>
          </div>
        </div>

        {/* Low Stock Card */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300 hover:border-gray-300 shadow-sm transition-all duration-300 hover:transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-lg mr-4 bg-yellow-50">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Low Stock</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStock || 0}</p>
            </div>
          </div>
        </div>

        {/* Out of Stock Card */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300 hover:border-gray-300 shadow-sm transition-all duration-300 hover:transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-lg mr-4 bg-red-50">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Out of Stock</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.outOfStock || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Distribution */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300">
          <div className="flex items-center mb-6">
            <div className="p-2 rounded-lg mr-3 bg-blue-50">
              <PieChartIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Category Distribution</h3>
          </div>
          <div className="h-80">
            {getCategoryChartData() ? (
              <Pie key={`category-${chartThemeKey}`} data={getCategoryChartData()} options={chartOptions} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Database className="w-12 h-12 mb-2 opacity-50" />
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Stock Status Distribution */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300">
          <div className="flex items-center mb-6">
            <div className="p-2 rounded-lg mr-3 bg-green-50">
              <PieChartIcon className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Stock Status Distribution</h3>
          </div>
          <div className="h-80">
            {getStockStatusChartData() ? (
              <Pie key={`status-${chartThemeKey}`} data={getStockStatusChartData()} options={chartOptions} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Database className="w-12 h-12 mb-2 opacity-50" />
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Price Range Distribution */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300">
          <div className="flex items-center mb-6">
            <div className="p-2 rounded-lg mr-3 bg-purple-50">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Price Range Distribution</h3>
          </div>
          <div className="h-80">
            {getPriceRangeChartData() ? (
              <Bar key={`price-${chartThemeKey}`} data={getPriceRangeChartData()} options={barChartOptions} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Database className="w-12 h-12 mb-2 opacity-50" />
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Inventory Value */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300">
          <div className="flex items-center mb-6">
            <div className="p-2 rounded-lg mr-3 bg-blue-50">
              <TrendingUp className="w-5 h-5 text-blue-700" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Inventory Value</h3>
          </div>
          <div className="h-80 flex flex-col justify-center items-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-4">
              ₹{(stats.totalValue || 0).toLocaleString()}
            </div>
            <p className="text-center mb-6 text-gray-600">
              Current total value of all products in stock
            </p>
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-gray-900">{Object.keys(stats.categories || {}).length}</div>
                <div className="text-gray-400">Categories</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">{stats.total || 0}</div>
                <div className="text-gray-400">Products</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="p-6 rounded-xl border mb-6 backdrop-blur-sm bg-gray-100 border-gray-300">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Product Inventory</h3>
          <div className="flex flex-col sm:flex-row gap-3 flex-1 lg:flex-none lg:justify-end">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full transition-all duration-200 bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 border"
              />
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
                {categories.map((category) => {
                  const categoryName = typeof category === 'object' ? category.name : category;
                  const categoryValue = typeof category === 'object' ? category.name : category;
                  return (
                    <option key={categoryValue} value={categoryValue}>
                      {categoryName}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
            </div>

            {/* Stock Filter */}
            <div className="relative flex-1 sm:flex-none">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none w-full transition-all duration-200 bg-gray-100 border-gray-300 text-gray-900 border"
              >
                <option value="all">All Stock</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
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
                  Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Quantity
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total Value
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Stock Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center text-gray-400">
                      <Database className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-lg">No products found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="transition-colors duration-150 hover:bg-gray-200">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                        {product.category?.name || product.category || 'No Category'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">₹{product.price?.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {getDisplayQuantity(product)} {getDisplayUnit(product)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{(product.price * product.quantity)?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${(() => {
                          const displayQuantity = getDisplayQuantity(product);
                          return displayQuantity === 0
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : displayQuantity <= 10
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : 'bg-green-100 text-green-800 border-green-200';
                        })()
                        }`}>
                        {(() => {
                          const displayQuantity = getDisplayQuantity(product);
                          return displayQuantity === 0 ? 'Out of Stock' : displayQuantity <= 10 ? 'Low Stock' : 'In Stock';
                        })()}
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

export default StockReport;