import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import supplierReportService from '../services/supplierReportService';
import supplierService from '../services/supplierService';
import productService from '../services/productService';
import { FaArrowLeft, FaBox, FaExclamationTriangle, FaCheckCircle, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import './VendorProductManagement.css';

const VendorProductManagement = () => {
    const { supplierId } = useParams();
    const navigate = useNavigate();

    const [supplier, setSupplier] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        price: '',
        quantity: '',
        category: '',
        description: ''
    });
    const [updating, setUpdating] = useState(false);

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

    // Edit Handlers
    const handleEditClick = (product) => {
        setEditingProduct(product);
        setEditForm({
            name: product.name,
            price: product.price,
            quantity: product.quantity,
            category: product.category?._id || product.category, // Handle populated or ID
            description: product.description || ''
        });
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setEditingProduct(null);
        setShowEditModal(false);
        setEditForm({ name: '', price: '', quantity: '', category: '', description: '' });
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        if (!editingProduct) return;

        try {
            setUpdating(true);
            // Construct the update payload. 
            // Note: Adjust fields based on what rentalProductService expects and what logic is needed.
            // For simple updates like name/price/qty:
            const updates = {
                name: editForm.name,
                price: parseFloat(editForm.price),
                quantity: parseInt(editForm.quantity),
                description: editForm.description
                // Category usually not changed easily if it affects other things, but including if needed
            };

            await productService.updateProduct(editingProduct._id, updates);

            toast.success('Product updated successfully');
            handleCloseEditModal();
            fetchProducts(); // Refresh list
        } catch (err) {
            console.error('Error updating product:', err);
            toast.error(err.message || 'Failed to update product');
        } finally {
            setUpdating(false);
        }
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
                                                onClick={() => handleEditClick(product)}
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

            {/* Edit Modal */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content edit-product-modal">
                        <div className="modal-header">
                            <h2>Edit Product</h2>
                            <button className="modal-close" onClick={handleCloseEditModal}>
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProduct}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Product Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Price (₹)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editForm.price}
                                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Quantity</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editForm.quantity}
                                            onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                                            required
                                            disabled // Often stock is managed via inward, disable if manual edit not allowed
                                            title="Stock is managed via Inward"
                                            className="disabled-input"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        rows="3"
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={handleCloseEditModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={updating}>
                                    {updating ? 'Updating...' : <><FaSave /> Save Changes</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )
            }
        </div>
    );
};

export default VendorProductManagement;
