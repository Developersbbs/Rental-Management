import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  RefreshCw,
  Calendar,
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import billApiService from '../services/billApiService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
);

const YearlySalesReport = () => {
  const navigate = useNavigate();
  const [yearlyData, setYearlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyStats, setMonthlyStats] = useState({});

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      console.log('🔄 YearlySalesReport: No authentication found, redirecting to login');
      navigate('/login');
      return;
    }

    fetchYearlyData();
  }, [selectedYear]);

  const fetchYearlyData = async () => {
    try {
      setLoading(true);
      console.log('🔄 YearlySalesReport: Fetching data for year:', selectedYear);

      // Get start and end dates for the selected year
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      const response = await billApiService.getMonthlySellingReport({
        startDate,
        endDate,
        limit: 12
      });

      console.log('🔄 YearlySalesReport: Response:', response);

      // Process the data to create monthly summaries
      const monthlyData = response.monthlyData || [];
      setYearlyData(monthlyData);

      // Calculate monthly statistics
      const stats = {};
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      months.forEach((monthName, index) => {
        const monthData = monthlyData.filter(item =>
          item.month === (index + 1) && item.year === selectedYear
        );

        const totalRevenue = monthData.reduce((sum, item) => sum + item.totalRevenue, 0);
        const totalQuantity = monthData.reduce((sum, item) => sum + item.totalQuantity, 0);
        const billsCount = monthData.reduce((sum, item) => sum + item.billsCount, 0);

        stats[monthName] = {
          month: index + 1,
          revenue: totalRevenue,
          quantity: totalQuantity,
          bills: billsCount,
          products: monthData.length
        };
      });

      setMonthlyStats(stats);

    } catch (err) {
      console.error('❌ YearlySalesReport: Error fetching data:', err);
      console.error('❌ YearlySalesReport: Error details:', err.response?.data || err.message);
      setError(err.message || 'Failed to fetch yearly sales data');
      setYearlyData([]);
      setMonthlyStats({});
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Map abbreviated month names to full month names
    const monthMapping = {
      'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
      'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
      'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
    };

    const revenueData = months.map(month => monthlyStats[monthMapping[month]]?.revenue || 0);
    const quantityData = months.map(month => monthlyStats[monthMapping[month]]?.quantity || 0);

    const chartData = {
      labels: months,
      datasets: [
        {
          label: 'Monthly Revenue (₹)',
          data: revenueData,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: 'Monthly Quantity Sold',
          data: quantityData,
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2,
          yAxisID: 'y1',
        }
      ]
    };

    return chartData;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart',
    },
    transitions: {
      active: {
        animation: {
          duration: 400
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.datasetIndex === 0) {
              label += '₹' + context.parsed.y.toLocaleString();
            } else {
              label += context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Revenue (₹)'
        },
        grid: {
          color: '#e5e7eb'
        },
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Quantity Sold'
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      }
    }
  };

  const downloadCSV = () => {
    const headers = [
      'Month',
      'Year',
      'Total Revenue (₹)',
      'Total Quantity Sold',
      'Total Bills',
      'Products Sold'
    ];

    const csvData = Object.entries(monthlyStats).map(([monthName, data]) => [
      monthName,
      selectedYear,
      data.revenue.toFixed(2),
      data.quantity,
      data.bills,
      data.products
    ]);

    // Add summary row
    const totalRevenue = Object.values(monthlyStats).reduce((sum, data) => sum + data.revenue, 0);
    const totalQuantity = Object.values(monthlyStats).reduce((sum, data) => sum + data.quantity, 0);
    const totalBills = Object.values(monthlyStats).reduce((sum, data) => sum + data.bills, 0);
    const totalProducts = Object.values(monthlyStats).reduce((sum, data) => sum + data.products, 0);

    csvData.push([
      'TOTAL',
      selectedYear,
      totalRevenue.toFixed(2),
      totalQuantity,
      totalBills,
      totalProducts
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `yearly-sales-report-${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years.reverse(); // Most recent first
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading yearly sales report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>Error: {error}</p>
        <Button onClick={fetchYearlyData} className="mt-2">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const totalRevenue = Object.values(monthlyStats).reduce((sum, data) => sum + data.revenue, 0);
  const totalQuantity = Object.values(monthlyStats).reduce((sum, data) => sum + data.quantity, 0);
  const totalBills = Object.values(monthlyStats).reduce((sum, data) => sum + data.bills, 0);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Yearly Sales Report</h1>
          <p className="text-gray-600 mt-1">Monthly sales breakdown for {selectedYear}</p>

        </div>
        <div className="flex gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {getYearOptions().map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button onClick={downloadCSV} className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200">
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300 hover:border-gray-300 shadow-sm transition-all duration-300 hover:transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-lg mr-4 bg-blue-50">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Year</h3>
              <p className="text-2xl font-bold text-gray-900">{selectedYear}</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300 hover:border-gray-300 shadow-sm transition-all duration-300 hover:transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-lg mr-4 bg-green-50">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
              <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300 hover:border-gray-300 shadow-sm transition-all duration-300 hover:transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-lg mr-4 bg-purple-50">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Total Quantity</h3>
              <p className="text-2xl font-bold text-gray-900">{totalQuantity.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border bg-gray-100 border-gray-300 hover:border-gray-300 shadow-sm transition-all duration-300 hover:transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 rounded-lg mr-4 bg-red-50">
              <BarChart3 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Total Bills</h3>
              <p className="text-2xl font-bold text-gray-900">{totalBills}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6 rounded-xl border mb-6 backdrop-blur-sm bg-gray-100 border-gray-300">
        <div className="flex items-center mb-6">
          <BarChart3 className="h-5 w-5 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Monthly Sales Trend - {selectedYear}</h3>
        </div>

        <div className="h-80">
          <Bar data={getChartData()} options={chartOptions} />
        </div>
      </div>

      {/* Monthly Data Table */}
      <div className="rounded-xl border overflow-hidden bg-gray-100 border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Sales Breakdown</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Month
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Revenue (₹)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Quantity Sold
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Bills Count
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Products Sold
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(monthlyStats).map(([monthName, data]) => (
                  <tr key={monthName} className="transition-colors duration-150 hover:bg-gray-200">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{monthName} {selectedYear}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-green-600">₹{data.revenue.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{data.quantity.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{data.bills}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{data.products}</div>
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-gray-200 font-semibold">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">TOTAL - {selectedYear}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-green-600">₹{totalRevenue.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">{totalQuantity.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">{totalBills}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">
                      {Object.values(monthlyStats).reduce((sum, data) => sum + data.products, 0)}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YearlySalesReport;
