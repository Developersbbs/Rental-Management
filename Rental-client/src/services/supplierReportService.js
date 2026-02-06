// services/supplierReportService.js
import instance from './instance';

const supplierReportService = {
    /**
     * Get all suppliers with statistics
     */
    getAllSuppliersWithStats: async () => {
        try {
            const response = await instance.get('/supplier-reports');
            return response.data;
        } catch (error) {
            console.error('Error fetching supplier reports:', error);
            throw error.response?.data || error;
        }
    },

    /**
     * Get detailed report for a specific supplier
     */
    getSupplierDetailedReport: async (supplierId) => {
        try {
            const response = await instance.get(`/supplier-reports/${supplierId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching supplier detailed report:', error);
            throw error.response?.data || error;
        }
    },

    /**
     * Get products from a specific supplier
     */
    getSupplierProducts: async (supplierId, params = {}) => {
        try {
            const response = await instance.get(`/supplier-reports/${supplierId}/products`, {
                params
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching supplier products:', error);
            throw error.response?.data || error;
        }
    },

    /**
     * Get supplier comparison data
     */
    getSupplierComparison: async () => {
        try {
            const response = await instance.get('/supplier-reports/comparison');
            return response.data;
        } catch (error) {
            console.error('Error fetching supplier comparison:', error);
            throw error.response?.data || error;
        }
    },
    /**
     * Download products CSV for a specific supplier
     */
    downloadSupplierProductsCSV: async (supplierId) => {
        try {
            const response = await instance.get(`/supplier-reports/${supplierId}/products/csv`, {
                responseType: 'blob'
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Extract filename from header or generate default
            const contentDisposition = response.headers['content-disposition'];
            let fileName = `supplier_products.csv`;
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename=(.+)/);
                if (fileNameMatch && fileNameMatch.length === 2) {
                    fileName = fileNameMatch[1];
                }
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            console.error('Error downloading supplier products CSV:', error);
            throw error.response?.data || error;
        }
    }
};

export default supplierReportService;
