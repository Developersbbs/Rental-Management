import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

// =============================================
// FINANCIAL REPORTS
// =============================================

export const getRevenueReport = async (params = {}) => {
    const response = await axios.get(`${API_URL}/reports/financial/revenue`, {
        ...getAuthHeaders(),
        params
    });
    return response.data;
};

export const getTransactionReport = async (params = {}) => {
    const response = await axios.get(`${API_URL}/reports/financial/transactions`, {
        ...getAuthHeaders(),
        params
    });
    return response.data;
};

export const getOutstandingDuesReport = async (params = {}) => {
    const response = await axios.get(`${API_URL}/reports/financial/outstanding-dues`, {
        ...getAuthHeaders(),
        params
    });
    return response.data;
};

export const getPaymentMethodAnalysis = async (params = {}) => {
    const response = await axios.get(`${API_URL}/reports/financial/payment-methods`, {
        ...getAuthHeaders(),
        params
    });
    return response.data;
};

// =============================================
// RENTAL REPORTS
// =============================================

export const getActiveRentalsReport = async (params = {}) => {
    const response = await axios.get(`${API_URL}/reports/rentals/active`, {
        ...getAuthHeaders(),
        params
    });
    return response.data;
};

export const getRentalHistoryReport = async (params = {}) => {
    const response = await axios.get(`${API_URL}/reports/rentals/history`, {
        ...getAuthHeaders(),
        params
    });
    return response.data;
};

export const getOverdueRentalsReport = async (params = {}) => {
    const response = await axios.get(`${API_URL}/reports/rentals/overdue`, {
        ...getAuthHeaders(),
        params
    });
    return response.data;
};

export const getBookingCalendarReport = async (params = {}) => {
    const response = await axios.get(`${API_URL}/reports/rentals/calendar`, {
        ...getAuthHeaders(),
        params
    });
    return response.data;
};

// =============================================
// INVENTORY REPORTS
// =============================================

export const getInventoryStatusReport = async (params = {}) => {
    const response = await axios.get(`${API_URL}/reports/inventory/status`, {
        ...getAuthHeaders(),
        params
    });
    return response.data;
};

export const getItemUtilizationReport = async (params = {}) => {
    const response = await axios.get(`${API_URL}/reports/inventory/utilization`, {
        ...getAuthHeaders(),
        params
    });
    return response.data;
};

export const getMaintenanceReport = async (params = {}) => {
    const response = await axios.get(`${API_URL}/reports/inventory/maintenance`, {
        ...getAuthHeaders(),
        params
    });
    return response.data;
};

export const getDamageLossReport = async (params = {}) => {
    const response = await axios.get(`${API_URL}/reports/inventory/damage-loss`, {
        ...getAuthHeaders(),
        params
    });
    return response.data;
};

// =============================================
// CUSTOMER REPORTS
// =============================================

export const getCustomerListReport = async (params = {}) => {
    const response = await axios.get(`${API_URL}/reports/customers/list`, {
        ...getAuthHeaders(),
        params
    });
    return response.data;
};

export const getCustomerActivityReport = async (params = {}) => {
    const response = await axios.get(`${API_URL}/reports/customers/activity`, {
        ...getAuthHeaders(),
        params
    });
    return response.data;
};

export const getTopCustomersReport = async (params = {}) => {
    const response = await axios.get(`${API_URL}/reports/customers/top`, {
        ...getAuthHeaders(),
        params
    });
    return response.data;
};

// =============================================
// ANALYTICS REPORTS
// =============================================

export const getPerformanceDashboard = async (params = {}) => {
    const response = await axios.get(`${API_URL}/reports/analytics/dashboard`, {
        ...getAuthHeaders(),
        params
    });
    return response.data;
};

export const getSeasonalTrendsReport = async (params = {}) => {
    const response = await axios.get(`${API_URL}/reports/analytics/trends`, {
        ...getAuthHeaders(),
        params
    });
    return response.data;
};

export const getCategoryPerformanceReport = async (params = {}) => {
    const response = await axios.get(`${API_URL}/reports/analytics/categories`, {
        ...getAuthHeaders(),
        params
    });
    return response.data;
};

export const getAccessoryPerformanceReport = async (params = {}) => {
    const response = await axios.get(`${API_URL}/reports/analytics/accessories`, {
        ...getAuthHeaders(),
        params
    });
    return response.data;
};

// =============================================
// EXPORT FUNCTIONS
// =============================================

export const exportToPDF = async (reportType, params = {}) => {
    // This would need a PDF generation library on the backend
    // For now, we'll handle it on the frontend
    console.log('Export to PDF:', reportType, params);
};

export const exportToExcel = async (reportType, params = {}) => {
    // This would use a library like xlsx
    console.log('Export to Excel:', reportType, params);
};
