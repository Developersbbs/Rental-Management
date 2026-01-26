import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  RefreshCw,
  Calendar,
  TrendingUp,
  Package,
  DollarSign,
  Search,
  Filter,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import productService from '../services/productService';
import billApiService from '../services/billApiService';

const ProductReportPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [stockQuantityRange, setStockQuantityRange] = useState({ min: '', max: '' });
  const [selectedStockStatuses, setSelectedStockStatuses] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [suppliers, setSuppliers] = useState([]);
  const [revenueRange, setRevenueRange] = useState({ min: '', max: '' });
  const [quantitySoldRange, setQuantitySoldRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      console.log('🔄 ProductReportPage: No authentication found, redirecting to login');
      navigate('/login');
      return;
    }

    fetchInitialData();
  }, []);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, priceRange, stockQuantityRange, selectedStockStatuses, selectedSupplier, revenueRange, quantitySoldRange, sortBy, sortOrder]);

  useEffect(() => {
    // Load monthly data by default for the last year if no dates are set
    if (!startDate && !endDate) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);
      
      setStartDate(startDate.toISOString().split('T')[0]);
      setEndDate(endDate.toISOString().split('T')[0]);
    } else if (startDate && endDate) {
      fetchMonthlyData();
    }
  }, [startDate, endDate]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Check if token exists
      const token = localStorage.getItem('token');

      const [productsData, categoriesData] = await Promise.all([
        productService.getProductReport(),
        productService.getCategories()
      ]);

      setProducts(productsData.products || []);
      setCategories(categoriesData);

      // Extract unique suppliers from products
      const allProducts = productsData.products || [];

      const suppliersFromProducts = allProducts.map(p => p.supplier).filter(s => s && s !== 'Unknown');
      const uniqueSuppliers = [...new Set(suppliersFromProducts)];

      setSuppliers(uniqueSuppliers);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyData = async () => {
    try {
      setRefreshing(true);
      const params = {
        startDate,
        endDate,
        limit: 24 // Last 2 years
      };

      const response = await billApiService.getMonthlySellingReport(params);
      setMonthlyData(response.monthlyData || []);
    } catch (err) {
      // Don't set error state for monthly data, just log it
      // Set empty array so the table shows 0s instead of crashing
      setMonthlyData([]);
    } finally {
      setRefreshing(false);
    }
  };

  const getProductMonthlyStats = (productId) => {
    const productMonthlyData = monthlyData.filter(item => item.productId === productId);
    if (productMonthlyData.length === 0) {
      return { totalSold: 0, totalRevenue: 0, monthsActive: 0 };
    }

    const totalSold = productMonthlyData.reduce((sum, item) => sum + item.totalQuantity, 0);
    const totalRevenue = productMonthlyData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const monthsActive = productMonthlyData.length;

    return { totalSold, totalRevenue, monthsActive };
  };

  const getMonthlyTopSellers = () => {
    const monthlyLeaders = {};
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Process monthly data to find top sellers
    monthlyData.forEach(monthData => {
      const monthKey = `${monthNames[monthData.month - 1]} ${monthData.year}`;
      const product = products.find(p => p._id === monthData.productId);

      if (product) {
        if (!monthlyLeaders[monthKey]) {
          monthlyLeaders[monthKey] = {
            product: product,
            quantity: monthData.totalQuantity,
            revenue: monthData.totalRevenue,
            month: monthData.month,
            year: monthData.year
          };
        } else if (monthData.totalRevenue > monthlyLeaders[monthKey].revenue) {
          monthlyLeaders[monthKey] = {
            product: product,
            quantity: monthData.totalQuantity,
            revenue: monthData.totalRevenue,
            month: monthData.month,
            year: monthData.year
          };
        }
      }
    });

    return Object.values(monthlyLeaders).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  };

  const getProductMonthlyBreakdown = (productId) => {
    const productMonthlyData = monthlyData.filter(item => item.productId === productId);
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return productMonthlyData.map(data => ({
      month: `${monthNames[data.month - 1]} ${data.year}`,
      quantity: data.totalQuantity,
      revenue: data.totalRevenue
    })).sort((a, b) => {
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      if (aYear !== bYear) return parseInt(bYear) - parseInt(aYear);
      return monthNames.indexOf(bMonth) - monthNames.indexOf(aMonth);
    });
  };

  const getPaginatedProducts = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  };

  const getPaginationInfo = () => {
    const totalItems = filteredProducts.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return {
      totalItems,
      totalPages,
      startItem,
      endItem,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, getPaginationInfo().totalPages)));
  };

  const goToNextPage = () => {
    if (getPaginationInfo().hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (getPaginationInfo().hasPrevPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setPriceRange({ min: '', max: '' });
    setStockQuantityRange({ min: '', max: '' });
    setSelectedStockStatuses([]);
    setSelectedSupplier('all');
    setRevenueRange({ min: '', max: '' });
    setQuantitySoldRange({ min: '', max: '' });
    setSortBy('name');
    setSortOrder('asc');
    setStartDate('');
    setEndDate('');
  };

  const toggleStockStatus = (status) => {
    setSelectedStockStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const filteredProducts = React.useMemo(() => {
    let filtered = products.filter(product => {
      // Basic search filter
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.supplier?.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

      // Price range filter - only apply if values are set
      const productPrice = product.price || 0;
      const hasMinPrice = priceRange.min !== '' && priceRange.min !== undefined;
      const hasMaxPrice = priceRange.max !== '' && priceRange.max !== undefined;
      const matchesPrice = (!hasMinPrice || productPrice >= Number(priceRange.min)) &&
                          (!hasMaxPrice || productPrice <= Number(priceRange.max));

      // Stock quantity range filter - only apply if values are set
      const productStock = product.quantity || 0;
      const hasMinStock = stockQuantityRange.min !== '' && stockQuantityRange.min !== undefined;
      const hasMaxStock = stockQuantityRange.max !== '' && stockQuantityRange.max !== undefined;
      const matchesStockQuantity = (!hasMinStock || productStock >= Number(stockQuantityRange.min)) &&
                                  (!hasMaxStock || productStock <= Number(stockQuantityRange.max));

      // Stock status filter
      const matchesStockStatus = selectedStockStatuses.length === 0 ||
                                selectedStockStatuses.includes(product.stockStatus);

      // Supplier filter
      const matchesSupplier = selectedSupplier === 'all' || product.supplier === selectedSupplier;

      // Get monthly stats for revenue and quantity filters - only apply if values are set
      const monthlyStats = getProductMonthlyStats(product._id);
      const hasMinRevenue = revenueRange.min !== '' && revenueRange.min !== undefined;
      const hasMaxRevenue = revenueRange.max !== '' && revenueRange.max !== undefined;
      const matchesRevenue = (!hasMinRevenue || monthlyStats.totalRevenue >= Number(revenueRange.min)) &&
                            (!hasMaxRevenue || monthlyStats.totalRevenue <= Number(revenueRange.max));

      const hasMinQtySold = quantitySoldRange.min !== '' && quantitySoldRange.min !== undefined;
      const hasMaxQtySold = quantitySoldRange.max !== '' && quantitySoldRange.max !== undefined;
      const matchesQuantitySold = (!hasMinQtySold || monthlyStats.totalSold >= Number(quantitySoldRange.min)) &&
                                 (!hasMaxQtySold || monthlyStats.totalSold <= Number(quantitySoldRange.max));

      const allMatches = matchesSearch && matchesCategory && matchesPrice && matchesStockQuantity &&
             matchesStockStatus && matchesSupplier && matchesRevenue && matchesQuantitySold;

      return allMatches;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'stock':
          aValue = a.quantity || 0;
          bValue = b.quantity || 0;
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'supplier':
          aValue = (a.supplier || '').toLowerCase();
          bValue = (b.supplier || '').toLowerCase();
          break;
        case 'revenue':
          aValue = getProductMonthlyStats(a._id).totalRevenue;
          bValue = getProductMonthlyStats(b._id).totalRevenue;
          break;
        case 'quantitySold':
          aValue = getProductMonthlyStats(a._id).totalSold;
          bValue = getProductMonthlyStats(b._id).totalSold;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, priceRange, stockQuantityRange, selectedStockStatuses, selectedSupplier, revenueRange, quantitySoldRange, sortBy, sortOrder]);

  const downloadCSV = () => {
    const headers = [
      'Product Name',
      'Category',
      'Price (₹)',
      'Stock Quantity',
      'Stock Status',
      'Supplier',
      'Monthly Sold Qty',
      'Monthly Revenue (₹)',
      'Active Months'
    ];

    const csvData = filteredProducts.map(product => {
      const monthlyStats = getProductMonthlyStats(product._id);
      return [
        product.name,
        product.category,
        product.price,
        product.quantity,
        product.stockStatus,
        product.supplier,
        monthlyStats.totalSold,
        monthlyStats.totalRevenue.toFixed(2),
        monthlyStats.monthsActive
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `product-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading product report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>Error: {error}</p>
        <button onClick={fetchInitialData} className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200">
          <RefreshCw className="h-4 w-4 mr-2 inline" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Report</h1>
          <p className="text-gray-600 mt-1">Comprehensive view of all products with selling analytics</p>
          
        </div>
        <button onClick={downloadCSV} className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200">
          <Download className="h-4 w-4 mr-2" />
          Download CSV
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border mb-6 backdrop-blur-sm bg-gray-100 border-gray-300">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters & Date Range</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category.name}>{category.name}</option>
              ))}
            </select>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t border-gray-300 pt-4 mt-4">
              <h4 className="text-md font-semibold text-gray-800 mb-4">Advanced Filters</h4>

              {/* Price Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (₹)</label>
                  <input
                    type="number"
                    placeholder="No limit"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Stock Quantity Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Qty</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={stockQuantityRange.min}
                    onChange={(e) => setStockQuantityRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock Qty</label>
                  <input
                    type="number"
                    placeholder="No limit"
                    value={stockQuantityRange.max}
                    onChange={(e) => setStockQuantityRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Stock Status & Supplier */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                  <div className="space-y-2">
                    {['In Stock', 'Low Stock', 'Out of Stock'].map(status => (
                      <label key={status} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedStockStatuses.includes(status)}
                          onChange={() => toggleStockStatus(status)}
                          className="mr-2"
                        />
                        <span className="text-sm">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Suppliers</option>
                    {suppliers.map(supplier => (
                      <option key={supplier} value={supplier}>{supplier}</option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    Suppliers found: {suppliers.length}
                  </div>
                </div>

                {/* Revenue Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Revenue (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={revenueRange.min}
                    onChange={(e) => setRevenueRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Revenue (₹)</label>
                  <input
                    type="number"
                    placeholder="No limit"
                    value={revenueRange.max}
                    onChange={(e) => setRevenueRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Quantity Sold Range & Sorting */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Qty Sold</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={quantitySoldRange.min}
                    onChange={(e) => setQuantitySoldRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Qty Sold</label>
                  <input
                    type="number"
                    placeholder="No limit"
                    value={quantitySoldRange.max}
                    onChange={(e) => setQuantitySoldRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="stock">Stock Quantity</option>
                    <option value="category">Category</option>
                    <option value="supplier">Supplier</option>
                    <option value="revenue">Revenue</option>
                    <option value="quantitySold">Quantity Sold</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Products Card */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300 hover:border-gray-300 shadow-sm transition-all duration-300 hover:transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-lg mr-4 bg-blue-50">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Total Products</h3>
              <p className="text-2xl font-bold text-gray-900">{filteredProducts.length}</p>
            </div>
          </div>
        </div>

        {/* In Stock Card */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300 hover:border-gray-300 shadow-sm transition-all duration-300 hover:transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-lg mr-4 bg-green-50">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">In Stock</h3>
              <p className="text-2xl font-bold text-gray-900">
                {filteredProducts.filter(p => p.stockStatus === 'In Stock').length}
              </p>
            </div>
          </div>
        </div>

        {/* Low Stock Card */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300 hover:border-gray-300 shadow-sm transition-all duration-300 hover:transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-lg mr-4 bg-yellow-50">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Low Stock</h3>
              <p className="text-2xl font-bold text-gray-900">
                {filteredProducts.filter(p => p.stockStatus === 'Low Stock').length}
              </p>
            </div>
          </div>
        </div>

        {/* Out of Stock Card */}
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300 hover:border-gray-300 shadow-sm transition-all duration-300 hover:transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-lg mr-4 bg-red-50">
              <RefreshCw className={`w-6 h-6 text-red-600 ${refreshing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Out of Stock</h3>
              <p className="text-2xl font-bold text-gray-900">
                {filteredProducts.filter(p => p.stockStatus === 'Out of Stock').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border overflow-hidden bg-gray-100 border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300">
          <h3 className="text-lg font-semibold text-gray-900">Product Inventory & Sales Report</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Product Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Price (₹)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Stock Qty
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Stock Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Supplier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Monthly Sold Qty
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Monthly Revenue (₹)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Active Months
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getPaginatedProducts().length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center text-gray-400">
                        <Package className="w-12 h-12 mb-3 opacity-50" />
                        <p className="text-lg">{searchTerm || selectedCategory !== 'all' ? 'No products match your filters.' : 'No products found in the database.'}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  getPaginatedProducts().map((product) => {
                    const monthlyStats = getProductMonthlyStats(product._id);
                    return (
                      <tr key={product._id} className="transition-colors duration-150 hover:bg-gray-200">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">₹{product.price.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{product.quantity}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                            product.stockStatus === 'In Stock' ? 'bg-green-100 text-green-800 border-green-200' :
                            product.stockStatus === 'Low Stock' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            'bg-red-100 text-red-800 border-red-200'
                          }`}>
                            {product.stockStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{product.supplier}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{monthlyStats.totalSold}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-green-600">₹{monthlyStats.totalRevenue.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{monthlyStats.monthsActive}</div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      {getPaginationInfo().totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-gray-100 border-t border-gray-300">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{getPaginationInfo().startItem}</span> to{' '}
            <span className="font-medium">{getPaginationInfo().endItem}</span> of{' '}
            <span className="font-medium">{getPaginationInfo().totalItems}</span> products
          </div>

          <div className="flex items-center space-x-2">
            {/* Items per page selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when changing items per page
                }}
                className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Page navigation */}
            <div className="flex items-center space-x-1">
              <button
                onClick={goToPrevPage}
                disabled={!getPaginationInfo().hasPrevPage}
                className="px-2 py-1 text-sm font-medium text-gray-500 bg-gray-100 border border-gray-300 rounded-l hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, getPaginationInfo().totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(
                  getPaginationInfo().totalPages - 4,
                  currentPage - 2
                )) + i;

                if (pageNum > getPaginationInfo().totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 text-sm font-medium border ${
                      currentPage === pageNum
                        ? 'text-blue-600 bg-blue-50 border-blue-500'
                        : 'text-gray-500 bg-gray-100 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={goToNextPage}
                disabled={!getPaginationInfo().hasNextPage}
                className="px-2 py-1 text-sm font-medium text-gray-500 bg-gray-100 border border-gray-300 rounded-r hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Monthly Breakdown */}
      <div className="rounded-xl border overflow-hidden bg-gray-100 border-gray-300 mt-8">
        <div className="px-6 py-4 border-b border-gray-300">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
            Product-wise Monthly Sales Breakdown
          </h3>
          <p className="text-sm text-gray-600 mt-1">Detailed monthly performance for each product</p>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {filteredProducts.slice(0, 10).map((product) => {
              const monthlyBreakdown = getProductMonthlyBreakdown(product._id);
              if (monthlyBreakdown.length === 0) return null;

              return (
                <div key={product._id} className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                        📊
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-600">Category: {product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total Revenue</div>
                      <div className="text-lg font-bold text-green-600">
                        ₹{monthlyBreakdown.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Month
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Qty Sold
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Revenue (₹)
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Avg Price (₹)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {monthlyBreakdown.map((monthData, index) => (
                          <tr key={index} className="transition-colors duration-150 hover:bg-gray-200">
                            <td className="px-4 py-2">
                              <div className="text-sm font-medium text-gray-900">{monthData.month}</div>
                            </td>
                            <td className="px-4 py-2">
                              <div className="text-sm text-gray-900">{monthData.quantity.toLocaleString()}</div>
                            </td>
                            <td className="px-4 py-2">
                              <div className="text-sm font-medium text-green-600">₹{monthData.revenue.toLocaleString()}</div>
                            </td>
                            <td className="px-4 py-2">
                              <div className="text-sm text-gray-900">
                                ₹{(monthData.revenue / monthData.quantity).toFixed(2)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length > 10 && (
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Showing monthly breakdown for first 10 products. Use filters to view specific products.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ProductReportPage;
