import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supplierReportService from '../services/supplierReportService';
import { FaBoxes, FaExclamationTriangle, FaDollarSign, FaChartBar, FaEye, FaCalendarAlt, FaDownload } from 'react-icons/fa';
import './VendorReports.css';

const VendorReports = () => {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('stockValue'); // 'name', 'products', 'stockValue'
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [detailedReport, setDetailedReport] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [selectedInward, setSelectedInward] = useState(null);
    const [showInwardModal, setShowInwardModal] = useState(false);

    useEffect(() => {
        fetchSupplierReports();
    }, []);

    const fetchSupplierReports = async () => {
        try {
            setLoading(true);
            const data = await supplierReportService.getAllSuppliersWithStats();
            setSuppliers(data.suppliers || []);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch supplier reports');
            console.error('Error fetching supplier reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSupplierDetails = async (supplierId) => {
        try {
            setLoadingDetails(true);
            const data = await supplierReportService.getSupplierDetailedReport(supplierId);
            setDetailedReport(data);
            setSelectedSupplier(suppliers.find(s => s._id === supplierId));
        } catch (err) {
            setError(err.message || 'Failed to fetch supplier details');
            console.error('Error fetching supplier details:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleViewDetails = (supplier) => {
        fetchSupplierDetails(supplier._id);
    };

    const handleViewProducts = (supplierId) => {
        navigate(`/vendor-reports/${supplierId}/products`);
    };

    const closeDetailModal = () => {
        setSelectedSupplier(null);
        setDetailedReport(null);
    };

    const handleViewInward = (inward) => {
        setSelectedInward(inward);
        setShowInwardModal(true);
    };

    const closeInwardModal = () => {
        setSelectedInward(null);
        setShowInwardModal(false);
    };

    // Download vendor reports as CSV
    const downloadCSV = () => {
        // Prepare CSV headers
        const headers = [
            'Vendor Name',
            'Email',
            'Phone',
            'Status',
            'Total Products',
            'In Stock',
            'Low Stock',
            'Out of Stock',
            'Stock Value (₹)',
            'Total Purchases (₹)',
            'Paid Amount (₹)',
            'Outstanding Balance (₹)',
            'Last Inward Date'
        ];

        // Prepare CSV rows
        const rows = filteredSuppliers.map(supplier => [
            supplier.name,
            supplier.email || 'N/A',
            supplier.phone || 'N/A',
            supplier.status,
            supplier.statistics.totalProducts,
            supplier.statistics.inStock,
            supplier.statistics.lowStock,
            supplier.statistics.outOfStock,
            supplier.statistics.totalStockValue.toFixed(2),
            (supplier.statistics.totalInwardValue || 0).toFixed(2),
            (supplier.statistics.totalPaidAmount || 0).toFixed(2),
            (supplier.statistics.outstandingBalance || 0).toFixed(2),
            supplier.statistics.lastInwardDate
                ? new Date(supplier.statistics.lastInwardDate).toLocaleDateString('en-IN')
                : 'N/A'
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `vendor_reports_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter and sort suppliers
    const filteredSuppliers = suppliers
        .filter(supplier =>
            supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            let aVal, bVal;

            switch (sortBy) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'products':
                    aVal = a.statistics.totalProducts;
                    bVal = b.statistics.totalProducts;
                    break;
                case 'stockValue':
                default:
                    aVal = a.statistics.totalStockValue;
                    bVal = b.statistics.totalStockValue;
                    break;
            }

            if (typeof aVal === 'string') {
                return sortOrder === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });

    // Calculate overall statistics
    const overallStats = {
        totalSuppliers: suppliers.length,
        totalProducts: suppliers.reduce((sum, s) => sum + s.statistics.totalProducts, 0),
        totalStockValue: suppliers.reduce((sum, s) => sum + s.statistics.totalStockValue, 0),
        totalLowStock: suppliers.reduce((sum, s) => sum + s.statistics.lowStock, 0),
    };

    if (loading) {
        return (
            <div className="vendor-reports-loading">
                <div className="spinner"></div>
                <p>Loading vendor reports...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="vendor-reports-error">
                <FaExclamationTriangle size={48} />
                <h2>Error Loading Reports</h2>
                <p>{error}</p>
                <button onClick={fetchSupplierReports} className="retry-btn">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="vendor-reports-container">
            <div className="vendor-reports-header">
                <div>
                    <h1>Vendor Reports</h1>
                    <p>Comprehensive analytics and reports for all suppliers</p>
                </div>
                <button
                    className="btn-download-csv"
                    onClick={downloadCSV}
                    disabled={filteredSuppliers.length === 0}
                    title="Download vendor reports as CSV"
                >
                    <FaDownload /> Download CSV
                </button>
            </div>

            {/* Overall Statistics */}
            <div className="overall-stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#4CAF50' }}>
                        <FaBoxes />
                    </div>
                    <div className="stat-content">
                        <h3>{overallStats.totalSuppliers}</h3>
                        <p>Total Vendors</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#2196F3' }}>
                        <FaChartBar />
                    </div>
                    <div className="stat-content">
                        <h3>{overallStats.totalProducts}</h3>
                        <p>Total Products</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#FF9800' }}>
                        <FaDollarSign />
                    </div>
                    <div className="stat-content">
                        <h3>₹{overallStats.totalStockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                        <p>Total Stock Value</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#F44336' }}>
                        <FaExclamationTriangle />
                    </div>
                    <div className="stat-content">
                        <h3>{overallStats.totalLowStock}</h3>
                        <p>Low Stock Items</p>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="vendor-controls">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search vendors by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="sort-controls">
                    <label>Sort by:</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="stockValue">Stock Value</option>
                        <option value="products">Product Count</option>
                        <option value="name">Name</option>
                    </select>
                    <button
                        className="sort-order-btn"
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                </div>
            </div>

            {/* Vendor List */}
            <div className="vendor-list">
                {filteredSuppliers.length === 0 ? (
                    <div className="no-vendors">
                        <p>No vendors found matching your search.</p>
                    </div>
                ) : (
                    filteredSuppliers.map((supplier) => (
                        <div key={supplier._id} className="vendor-card">
                            <div className="vendor-card-header">
                                <div className="vendor-info">
                                    <h3>{supplier.name}</h3>
                                    <p className="vendor-contact">{supplier.email} • {supplier.phone}</p>
                                </div>
                                <div className="vendor-status">
                                    <span className={`status-badge ${supplier.status}`}>
                                        {supplier.status}
                                    </span>
                                </div>
                            </div>

                            <div className="vendor-stats-grid">
                                <div className="vendor-stat">
                                    <FaBoxes className="stat-icon-small" />
                                    <div>
                                        <p className="stat-value">{supplier.statistics.totalProducts}</p>
                                        <p className="stat-label">Products</p>
                                    </div>
                                </div>
                                <div className="vendor-stat">
                                    <FaDollarSign className="stat-icon-small" />
                                    <div>
                                        <p className="stat-value">₹{supplier.statistics.totalStockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                        <p className="stat-label">Stock Value</p>
                                    </div>
                                </div>
                                <div className="vendor-stat warning">
                                    <FaExclamationTriangle className="stat-icon-small" />
                                    <div>
                                        <p className="stat-value">{supplier.statistics.lowStock}</p>
                                        <p className="stat-label">Low Stock</p>
                                    </div>
                                </div>
                                <div className="vendor-stat danger">
                                    <FaExclamationTriangle className="stat-icon-small" />
                                    <div>
                                        <p className="stat-value">{supplier.statistics.outOfStock}</p>
                                        <p className="stat-label">Out of Stock</p>
                                    </div>
                                </div>
                            </div>

                            {supplier.statistics.lastInwardDate && (
                                <div className="last-inward">
                                    <FaCalendarAlt />
                                    <span>Last Inward: {new Date(supplier.statistics.lastInwardDate).toLocaleDateString()}</span>
                                </div>
                            )}

                            {/* Payment Statistics Section */}
                            <div className="payment-stats-section">
                                <div className="payment-stat-row">
                                    <span className="payment-label">Total Purchases:</span>
                                    <span className="payment-value">₹{(supplier.statistics.totalInwardValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="payment-stat-row">
                                    <span className="payment-label">Paid:</span>
                                    <span className="payment-value paid">₹{(supplier.statistics.totalPaidAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="payment-stat-row">
                                    <span className="payment-label">Outstanding:</span>
                                    <span className={`payment-value outstanding ${supplier.statistics.outstandingBalance > 0 ? 'has-balance' : ''}`}>
                                        ₹{(supplier.statistics.outstandingBalance || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                            </div>

                            <div className="vendor-actions">
                                <button
                                    className="btn-view-details"
                                    onClick={() => handleViewDetails(supplier)}
                                >
                                    <FaEye /> View Details
                                </button>
                                <button
                                    className="btn-manage-products"
                                    onClick={() => handleViewProducts(supplier._id)}
                                >
                                    <FaBoxes /> Manage Products
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Detailed Report Modal */}
            {selectedSupplier && detailedReport && (
                <div className="modal-overlay" onClick={closeDetailModal}>
                    <div className="modal-content detailed-report" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedSupplier.name} - Detailed Report</h2>
                            <button className="modal-close" onClick={closeDetailModal}>×</button>
                        </div>

                        {loadingDetails ? (
                            <div className="modal-loading">
                                <div className="spinner"></div>
                                <p>Loading details...</p>
                            </div>
                        ) : (
                            <div className="modal-body">
                                {/* Detailed Statistics */}
                                <div className="detail-stats-grid">
                                    <div className="detail-stat">
                                        <h4>Total Products</h4>
                                        <p>{detailedReport.statistics.totalProducts}</p>
                                    </div>
                                    <div className="detail-stat">
                                        <h4>In Stock</h4>
                                        <p>{detailedReport.statistics.inStock}</p>
                                    </div>
                                    <div className="detail-stat warning">
                                        <h4>Low Stock</h4>
                                        <p>{detailedReport.statistics.lowStock}</p>
                                    </div>
                                    <div className="detail-stat danger">
                                        <h4>Out of Stock</h4>
                                        <p>{detailedReport.statistics.outOfStock}</p>
                                    </div>
                                    <div className="detail-stat">
                                        <h4>Stock Value</h4>
                                        <p>₹{detailedReport.statistics.totalStockValue.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="detail-stat">
                                        <h4>Total Inwards</h4>
                                        <p>{detailedReport.statistics.totalInwards}</p>
                                    </div>
                                </div>

                                {/* Category Breakdown */}
                                {Object.keys(detailedReport.categoryBreakdown).length > 0 && (
                                    <div className="category-breakdown">
                                        <h3>Category Breakdown</h3>
                                        <div className="category-list">
                                            {Object.entries(detailedReport.categoryBreakdown).map(([category, data]) => (
                                                <div key={category} className="category-item">
                                                    <span className="category-name">{category}</span>
                                                    <span className="category-count">{data.count} products</span>
                                                    <span className="category-value">₹{data.totalValue.toLocaleString('en-IN')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recent Inwards */}
                                {detailedReport.inwardHistory && detailedReport.inwardHistory.length > 0 && (
                                    <div className="recent-inwards">
                                        <h3>Recent Inward History</h3>
                                        <div className="inward-table">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>GRN Number</th>
                                                        <th>Date</th>
                                                        <th>Items</th>
                                                        <th>Amount</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {detailedReport.inwardHistory.slice(0, 10).map((inward, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                <span
                                                                    className="grn-link"
                                                                    onClick={() => handleViewInward(inward)}
                                                                    title="Click to view details"
                                                                >
                                                                    {inward.grnNumber || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td>{new Date(inward.receivedDate || inward.createdAt).toLocaleDateString()}</td>
                                                            <td>{inward.items?.length || 0} item(s)</td>
                                                            <td>₹{inward.totalAmount?.toLocaleString('en-IN') || 0}</td>
                                                            <td>
                                                                <span className={`status-badge-small ${inward.status}`}>
                                                                    {inward.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <div className="modal-actions">
                                    <button
                                        className="btn-primary"
                                        onClick={() => handleViewProducts(selectedSupplier._id)}
                                    >
                                        Manage Products
                                    </button>
                                    <button className="btn-secondary" onClick={closeDetailModal}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Inward Details Modal */}
            {showInwardModal && selectedInward && (
                <div className="modal-overlay" onClick={closeInwardModal}>
                    <div className="modal-content inward-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Inward Details - {selectedInward.grnNumber}</h2>
                            <button className="modal-close" onClick={closeInwardModal}>×</button>
                        </div>

                        <div className="modal-body">
                            {/* Inward Info */}
                            <div className="inward-info-grid">
                                <div className="info-item">
                                    <label>GRN Number:</label>
                                    <span>{selectedInward.grnNumber || 'N/A'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Received Date:</label>
                                    <span>{new Date(selectedInward.receivedDate || selectedInward.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="info-item">
                                    <label>Status:</label>
                                    <span className={`status-badge ${selectedInward.status}`}>
                                        {selectedInward.status}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>Total Amount:</label>
                                    <span className="amount">₹{selectedInward.totalAmount?.toLocaleString('en-IN') || 0}</span>
                                </div>
                                {selectedInward.invoiceNumber && (
                                    <div className="info-item">
                                        <label>Invoice Number:</label>
                                        <span>{selectedInward.invoiceNumber}</span>
                                    </div>
                                )}
                                {selectedInward.invoiceDate && (
                                    <div className="info-item">
                                        <label>Invoice Date:</label>
                                        <span>{new Date(selectedInward.invoiceDate).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {selectedInward.deliveryChallanNumber && (
                                    <div className="info-item">
                                        <label>Delivery Challan:</label>
                                        <span>{selectedInward.deliveryChallanNumber}</span>
                                    </div>
                                )}
                                {selectedInward.vehicleNumber && (
                                    <div className="info-item">
                                        <label>Vehicle Number:</label>
                                        <span>{selectedInward.vehicleNumber}</span>
                                    </div>
                                )}
                                {selectedInward.qualityCheckStatus && (
                                    <div className="info-item">
                                        <label>Quality Check:</label>
                                        <span className={`quality-badge ${selectedInward.qualityCheckStatus}`}>
                                            {selectedInward.qualityCheckStatus}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Items Table */}
                            {selectedInward.items && selectedInward.items.length > 0 && (
                                <div className="inward-items-section">
                                    <h3>Items</h3>
                                    <div className="inward-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Ordered</th>
                                                    <th>Received</th>
                                                    <th>Unit Cost</th>
                                                    <th>Total</th>
                                                    <th>Batch No.</th>
                                                    <th>Mfg Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedInward.items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>{item.productName || item.product?.name || 'N/A'}</td>
                                                        <td>{item.orderedQuantity}</td>
                                                        <td className={item.receivedQuantity < item.orderedQuantity ? 'text-warning' : ''}>
                                                            {item.receivedQuantity}
                                                        </td>
                                                        <td>₹{item.unitCost?.toLocaleString('en-IN')}</td>
                                                        <td>₹{item.total?.toLocaleString('en-IN')}</td>
                                                        <td>{item.batchNumber || 'N/A'}</td>
                                                        <td>{item.manufacturingDate ? new Date(item.manufacturingDate).toLocaleDateString() : 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedInward.notes && (
                                <div className="notes-section">
                                    <h3>Notes</h3>
                                    <p>{selectedInward.notes}</p>
                                </div>
                            )}

                            {selectedInward.qualityCheckNotes && (
                                <div className="notes-section">
                                    <h3>Quality Check Notes</h3>
                                    <p>{selectedInward.qualityCheckNotes}</p>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button className="btn-secondary" onClick={closeInwardModal}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorReports;
