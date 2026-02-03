import instance from './instance';

// Note: instance already has baseURL configured, so we don't need API_URL
// instance handles auth headers automatically via interceptors

// =============================================
// FINANCIAL REPORTS
// =============================================

export const getRevenueReport = async (params = {}) => {
    const response = await instance.get('/reports/financial/revenue', { params });
    return response.data;
};

export const getTransactionReport = async (params = {}) => {
    const response = await instance.get('/reports/financial/transactions', { params });
    return response.data;
};

export const getOutstandingDuesReport = async (params = {}) => {
    const response = await instance.get('/reports/financial/outstanding-dues', { params });
    return response.data;
};

export const getPaymentMethodAnalysis = async (params = {}) => {
    const response = await instance.get('/reports/financial/payment-methods', { params });
    return response.data;
};

// =============================================
// RENTAL REPORTS
// =============================================

export const getActiveRentalsReport = async (params = {}) => {
    const response = await instance.get('/reports/rentals/active', { params });
    return response.data;
};

export const getRentalHistoryReport = async (params = {}) => {
    const response = await instance.get('/reports/rentals/history', { params });
    return response.data;
};

export const getOverdueRentalsReport = async (params = {}) => {
    const response = await instance.get('/reports/rentals/overdue', { params });
    return response.data;
};

export const getBookingCalendarReport = async (params = {}) => {
    const response = await instance.get('/reports/rentals/calendar', { params });
    return response.data;
};

// =============================================
// INVENTORY REPORTS
// =============================================

export const getInventoryStatusReport = async (params = {}) => {
    const response = await instance.get('/reports/inventory/status', { params });
    return response.data;
};

export const getItemUtilizationReport = async (params = {}) => {
    const response = await instance.get('/reports/inventory/utilization', { params });
    return response.data;
};

export const getMaintenanceReport = async (params = {}) => {
    const response = await instance.get('/reports/inventory/maintenance', { params });
    return response.data;
};

export const getDamageLossReport = async (params = {}) => {
    const response = await instance.get('/reports/inventory/damage-loss', { params });
    return response.data;
};

// =============================================
// CUSTOMER REPORTS
// =============================================

export const getCustomerListReport = async (params = {}) => {
    const response = await instance.get('/reports/customers/list', { params });
    return response.data;
};

export const getCustomerActivityReport = async (params = {}) => {
    const response = await instance.get('/reports/customers/activity', { params });
    return response.data;
};

export const getTopCustomersReport = async (params = {}) => {
    const response = await instance.get('/reports/customers/top', { params });
    return response.data;
};

// =============================================
// ANALYTICS REPORTS
// =============================================

export const getPerformanceDashboard = async (params = {}) => {
    const response = await instance.get('/reports/analytics/dashboard', { params });
    return response.data;
};

export const getSeasonalTrendsReport = async (params = {}) => {
    const response = await instance.get('/reports/analytics/trends', { params });
    return response.data;
};

export const getCategoryPerformanceReport = async (params = {}) => {
    const response = await instance.get('/reports/analytics/categories', { params });
    return response.data;
};

export const getAccessoryPerformanceReport = async (params = {}) => {
    const response = await instance.get('/reports/analytics/accessories', { params });
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
