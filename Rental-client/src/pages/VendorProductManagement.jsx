import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supplierReportService from '../services/supplierReportService';
import supplierService from '../services/supplierService';
import { FaArrowLeft, FaBox, FaExclamationTriangle, FaCheckCircle, FaEdit, FaTrash } from 'react-icons/fa';
import './VendorProductManagement.css';

const VendorProductManagement = () => {
    const { supplierId } = useParams();
    const navigate = useNavigate();

    const [supplier, setSupplier] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [stockStatus, setStockStatus] = useState('all');
    const [category, setCategory] = useState('');

    useEffect(() => {
        fetchSupplierInfo();
    }, [supplierId]);

    useEffect(() => {
        if (supplierId) {
            fetchProducts();
        }
    }, [supplierId, pagination.page, searchTerm, stockStatus, category]);

    const fetchSupplierInfo = async () => {
        try {
            const data = await supplierService.getSupplierById(supplierId);
            setSupplier(data.supplier);
        } catch (err) {
            console.error('Error fetching supplier:', err);
            setError('Failed to load supplier information');
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm,
                stockStatus: stockStatus !== 'all' ? stockStatus : '',
                category
            };

            const data = await supplierReportService.getSupplierProducts(supplierId, params);
            setProducts(data.products || []);
            setPagination(prev => ({
                ...prev,
                total: data.pagination.total,
                pages: data.pagination.pages
            }));
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch products');
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStockStatusBadge = (product) => {
        if (product.quantity === 0) {
            return <span className="stock-badge out-of-stock"><FaExclamationTriangle /> Out of Stock</span>;
        } else if (product.quantity <= product.reorderLevel) {
            return <span className="stock-badge low-stock"><FaExclamationTriangle /> Low Stock</span>;
        } else {
            return <span className="stock-badge in-stock"><FaCheckCircle /> In Stock</span>;
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    if (error && !supplier) {
        return (
            <div className="vendor-products-error">
                <FaExclamationTriangle size={48} />
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/vendor-reports')} className="btn-back">
                    <FaArrowLeft /> Back to Vendor Reports
                </button>
            </div>
        );
    }

    return (
        <div className="vendor-products-container">
            {/* Header */}
            <div className="vendor-products-header">
                <button onClick={() => navigate('/vendor-reports')} className="btn-back-small">
                    <FaArrowLeft /> Back to Vendors
                </button>

                {supplier && (
                    <div className="supplier-info-header">
                        <h1>{supplier.name} - Product Management</h1>
                        <p className="supplier-contact">{supplier.email} • {supplier.phone}</p>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="products-filters">
                <div className="search-filter">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="stock-filter">
                    <label>Stock Status:</label>
                    <select value={stockStatus} onChange={(e) => setStockStatus(e.target.value)}>
                        <option value="all">All Products</option>
                        <option value="inStock">In Stock</option>
                        <option value="lowStock">Low Stock</option>
                        <option value="outOfStock">Out of Stock</option>
                    </select>
                </div>
            </div>

            {/* Products List */}
            {loading ? (
                <div className="products-loading">
                    <div className="spinner"></div>
                    <p>Loading products...</p>
                </div>
            ) : products.length === 0 ? (
                <div className="no-products">
                    <FaBox size={48} />
                    <h3>No Products Found</h3>
                    <p>This vendor doesn't have any products matching your filters.</p>
                </div>
            ) : (
                <>
                    <div className="products-table-container">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>Product ID</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Status</th>
                                    <th>Batch No.</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product._id}>
                                        <td className="product-id">{product.productId || 'N/A'}</td>
                                        <td className="product-name">
                                            <div className="product-info">
                                                {product.image && (
                                                    <img src={product.image} alt={product.name} className="product-thumb" />
                                                )}
                                                <span>{product.name}</span>
                                            </div>
                                        </td>
                                        <td>{product.category?.name || 'N/A'}</td>
                                        <td className="price">₹{product.price.toLocaleString('en-IN')}</td>
                                        <td className="quantity">{product.quantity}</td>
                                        <td>{getStockStatusBadge(product)}</td>
                                        <td>{product.batchNumber || 'N/A'}</td>
                                        <td className="actions">
                                            <button
                                                className="btn-action edit"
                                                onClick={() => navigate(`/products/${product._id}/edit`)}
                                                title="Edit Product"
                                            >
                                                <FaEdit />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="pagination-btn"
                            >
                                Previous
                            </button>

                            <span className="pagination-info">
                                Page {pagination.page} of {pagination.pages} ({pagination.total} products)
                            </span>

                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.pages}
                                className="pagination-btn"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default VendorProductManagement;
