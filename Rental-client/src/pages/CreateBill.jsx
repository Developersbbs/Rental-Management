import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/features/auth/loginSlice';
import { Plus, Edit, Trash2, Eye, FileText, Calendar, DollarSign, AlertCircle, Search, Filter, Download, Printer, X, User, Package } from 'lucide-react';
import { toast } from 'react-toastify';
import instance from '../services/instance';
import productService from '../services/productService';
import customerService from '../services/customerService';
import billService from '../services/billService';
import rentalCategoryService from '../services/rentalCategoryService';
import paymentAccountService from '../services/paymentAccountService';

const customerFormInitialState = {
  name: '',
  email: '',
  phone: '',
  customerType: 'individual',
  status: 'active'
};

const ManageBills = () => {
  const user = useSelector(selectUser);
  const [bills, setBills] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stats, setStats] = useState({
    totalBills: 0,
    monthlyBills: 0,
    pendingPayments: 0,
    totalRevenue: 0
  });
  const [submitting, setSubmitting] = useState(false);
  // const [error, setError] = useState('');
  // const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 1
  });
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedBill, setSelectedBill] = useState(null);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerFormData, setCustomerFormData] = useState(() => ({ ...customerFormInitialState }));
  const [customerFormError, setCustomerFormError] = useState('');
  const [customerFormSubmitting, setCustomerFormSubmitting] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProductIndex, setSelectedProductIndex] = useState(null);
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    items: [{ productId: '', name: '', quantity: 1, price: 0, total: 0 }],
    subtotal: 0,
    discountPercent: 0,
    discountAmount: 0,
    taxPercent: 0,
    taxAmount: 0,
    totalAmount: 0,
    paymentStatus: 'pending',
    paymentMethod: 'cash',
    paidAmount: 0,
    dueAmount: 0,
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentMethod: 'cash',
    paymentAccountId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentAccounts, setPaymentAccounts] = useState([]);

  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  // Pending Items/Payments Modal State
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingDetails, setPendingDetails] = useState(null);

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    try {
      const response = await productService.getAllProducts({ page: 1, limit: 100 });
      setProducts(response.products || []);
      setFilteredProducts(response.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  }, []);

  // Fetch customers, bills, and products from API
  const fetchData = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    try {
      // Fetch customers
      const customersData = await customerService.getAllCustomers();
      const allCustomers = customersData.customers || [];
      const activeCustomers = allCustomers.filter(c => !c.isBlocked);

      setCustomers(activeCustomers);
      setFilteredCustomers(activeCustomers);

      // Fetch categories
      const categoriesData = await rentalCategoryService.getAllRentalCategories();
      setCategories(categoriesData.rentalCategories || []);

      // Fetch bills with pagination
      const billsData = await billService.getBills({ page, limit });

      // Update bills and pagination state
      setBills(billsData.bills || []);
      setFilteredBills(billsData.bills || []);
      setPagination({
        currentPage: billsData.currentPage || page,
        itemsPerPage: billsData.limit || limit,
        totalPages: billsData.totalPages || 0,
        totalItems: billsData.total || 0
      });

      // Fetch products
      await fetchProducts();

      // Calculate stats from current page bills
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().getMonth();
      const todayBills = billsData.bills.filter(bill =>
        bill.billDate && new Date(bill.billDate).toISOString().split('T')[0] === today
      );
      const monthlyBills = billsData.bills.filter(bill =>
        bill.billDate && new Date(bill.billDate).getMonth() === thisMonth
      );
      const pendingPayments = billsData.bills
        .filter(bill => bill.paymentStatus !== 'paid')
        .reduce((sum, bill) => sum + (bill.dueAmount || 0), 0);
      const totalRevenue = billsData.bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);

      // Update stats state
      setStats({
        totalBills: billsData.total || 0,
        todayBills: todayBills.length,
        monthlyBills: monthlyBills.length,
        pendingPayments,
        totalRevenue
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      setStats({
        totalBills: 0,
        todayBills: 0,
        monthlyBills: 0,
        pendingPayments: 0,
        totalRevenue: 0
      });
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      fetchData(pagination.currentPage, pagination.itemsPerPage);
    }
  }, [fetchData, pagination.currentPage, pagination.itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage: newItemsPerPage,
      currentPage: 1
    }));
  };

  // Filter customers based on search term
  useEffect(() => {
    if (customerSearchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const searchTerm = customerSearchTerm.toLowerCase();
      const filtered = customers.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm) ||
        customer.phone?.toLowerCase().includes(searchTerm) ||
        customer.customerType?.toLowerCase().includes(searchTerm)
      );
      setFilteredCustomers(filtered);
    }
  }, [customerSearchTerm, customers]);

  // Filter bills based on search and filters
  useEffect(() => {
    let filtered = bills;
    if (searchTerm) {
      filtered = filtered.filter(bill =>
        bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.customerId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bill => bill.paymentStatus === statusFilter);
    }
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(bill => {
        const billDate = new Date(bill.billDate);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        return billDate >= startDate && billDate <= endDate;
      });
    }
    setFilteredBills(filtered);
  }, [bills, searchTerm, statusFilter, dateRange]);

  const selectCustomer = async (customer, customerList = customers) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer._id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone || ''
    }));
    setShowCustomerSelector(false);
    setCustomerSearchTerm('');
    setShowCustomerForm(false);
    setFilteredCustomers(customerList);

    // Check for pending items/payments
    try {
      const details = await customerService.getCustomerById(customer._id);

      const pendingBills = details.billingHistory?.filter(bill => bill.paymentStatus === 'pending' || bill.paymentStatus === 'partial') || [];
      const pendingItemsList = details.pendingItems || [];

      if (pendingBills.length > 0 || pendingItemsList.length > 0) {
        setPendingDetails({
          pendingBills,
          pendingItems: pendingItemsList,
          customerName: customer.name
        });
        setShowPendingModal(true);
      }

    } catch (err) {
      console.error("Failed to fetch customer details for pending check", err);
    }
  };

  const openCustomerSelector = () => {
    setCustomerSearchTerm('');
    setShowCustomerSelector(true);
  };

  const handleCustomerFormChange = (e) => {
    const { name, value } = e.target;
    setCustomerFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetCustomerForm = () => {
    setCustomerFormData(() => ({ ...customerFormInitialState }));
    setCustomerFormError('');
    setCustomerFormSubmitting(false);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (customerFormSubmitting) return;

    const trimmedPayload = {
      name: customerFormData.name.trim(),
      email: customerFormData.email.trim(),
      phone: customerFormData.phone.trim(),
      customerType: customerFormData.customerType,
      status: 'active'
    };

    if (!trimmedPayload.name || !trimmedPayload.email || !trimmedPayload.phone) {
      setCustomerFormError('Name, email, and phone are required.');
      return;
    }

    setCustomerFormError('');
    setCustomerFormSubmitting(true);

    try {
      const newCustomer = await customerService.createCustomer(customerFormData);
      if (!newCustomer?._id) {
        throw new Error('Unexpected server response while creating customer.');
      }

      const updatedCustomers = [newCustomer, ...customers];
      setCustomers(updatedCustomers);
      resetCustomerForm();
      selectCustomer(newCustomer, updatedCustomers);
    } catch (error) {
      setCustomerFormError(error.message || 'Failed to create customer. Please try again.'); // Keep local error for form modal
    } finally {
      setCustomerFormSubmitting(false);
    }
  };

  // Filter products based on search term
  useEffect(() => {
    if (productSearchTerm.trim() === '' && !selectedCategory) {
      setFilteredProducts(products);
    } else {
      let filtered = products;

      // Filter by category
      if (selectedCategory) {
        filtered = filtered.filter(product => {
          const productCategory = typeof product.category === 'object' ? product.category?._id : product.category;
          return productCategory === selectedCategory;
        });
      }

      // Filter by search term
      if (productSearchTerm.trim() !== '') {
        const term = productSearchTerm.toLowerCase();
        filtered = filtered.filter(product =>
          product.name.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term) ||
          (typeof product.category === 'object' ? product.category?.name : product.category)?.toLowerCase().includes(term) ||
          product.sku?.toLowerCase().includes(term)
        );
      }

      setFilteredProducts(filtered);
    }
  }, [productSearchTerm, products, selectedCategory]);

  // Handle batch selection change
  const handleBatchChange = (index, batchNumber) => {
    console.log('🔄 Batch change requested:', { index, batchNumber });

    const updatedItems = [...formData.items];
    const item = updatedItems[index];

    console.log('📦 Current item:', item);
    console.log('🏷️ Available batches:', item.availableBatches);

    // Safety check: ensure availableBatches exists and is an array
    if (!item.availableBatches || !Array.isArray(item.availableBatches)) {
      console.error('❌ No available batches found for item');
      return;
    }

    if (batchNumber) {
      const selectedBatch = item.availableBatches.find(b => b.batchNumber === batchNumber);
      console.log('✅ Selected batch:', selectedBatch);

      if (selectedBatch) {
        updatedItems[index] = {
          ...item,
          batchNumber: batchNumber,
          batchId: selectedBatch._id,
          price: selectedBatch.unitCost,
          total: item.quantity * selectedBatch.unitCost
        };
        console.log('💾 Updated item with batch:', updatedItems[index]);
      } else {
        console.error('❌ Batch not found:', batchNumber);
      }
    }

    setFormData({ ...formData, items: updatedItems });
  };

  const selectProduct = async (product, index) => {
    // Check if product is out of stock
    if (product.quantity <= 0) {
      toast.warning(`Product "${product.name}" is currently out of stock and cannot be added to the bill.`);
      return;
    }

    try {
      console.log('🔍 Fetching product details for:', product.name, product._id);

      // Fetch the product details to get the latest price and batch information
      const response = await instance.get(`products/${product._id}`);
      const productDetails = response.data;

      console.log('📦 Product details received:', productDetails);

      // Get available batches for this product
      const availableBatches = productDetails.batches || [];

      console.log('🏷️ Available batches:', availableBatches.length, availableBatches);

      const updatedItems = [...formData.items];
      const newItem = {
        productId: product._id,
        name: product.name,
        quantity: 1,
        availableBatches: availableBatches, // Store all available batches
        batchNumber: '',
        batchId: null,
        price: 0,
        total: 0
      };

      // If there are batches, select the first one by default
      if (availableBatches.length > 0) {
        const batch = availableBatches[0];
        newItem.batchNumber = batch.batchNumber;
        newItem.batchId = batch._id;
        newItem.price = batch.unitCost;
        newItem.total = batch.unitCost;
        console.log('✅ Selected first batch:', batch.batchNumber, 'Price:', batch.unitCost);
      } else {
        // No batches available, use product price
        newItem.price = product.price || 0;
        newItem.total = product.price || 0;
        console.log('⚠️ No batches found, using product price:', product.price);
      }

      updatedItems[index] = newItem;
      console.log('💾 Updated item:', newItem);

      setFormData({ ...formData, items: updatedItems });

      setShowProductSelector(false);
      setProductSearchTerm('');
    } catch (error) {
      console.error('❌ Error fetching product details:', error);
      console.error('Error response:', error.response?.data);

      // Fallback to the basic product info if there's an error
      const updatedItems = [...formData.items];
      updatedItems[index] = {
        productId: product._id,
        name: product.name,
        quantity: 1,
        availableBatches: [], // Empty array to prevent undefined errors
        price: product.price || 0,
        total: product.price || 0
      };
      setFormData({ ...formData, items: updatedItems });
      setShowProductSelector(false);
      setProductSearchTerm('');
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    if (field === 'quantity' || field === 'price') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].price;
    }
    setFormData({ ...formData, items: updatedItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', name: '', quantity: 1, price: 0, total: 0 }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = [...formData.items];
      updatedItems.splice(index, 1);
      setFormData({ ...formData, items: updatedItems });
    }
  };

  const openProductSelector = (index) => {
    setSelectedProductIndex(index);
    setProductSearchTerm('');
    setShowProductSelector(true);
  };

  // Calculate totals with PERCENTAGE-based discount and tax
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const discountAmount = (subtotal * (formData.discountPercent || 0)) / 100;
    const taxableAmount = Math.max(subtotal - discountAmount, 0);
    const taxAmount = (taxableAmount * (formData.taxPercent || 0)) / 100;
    const totalAmount = taxableAmount + taxAmount;
    const dueAmount = Math.max(totalAmount - (formData.paidAmount || 0), 0);

    setFormData(prev => ({
      ...prev,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      dueAmount
    }));
  }, [formData.items, formData.discountPercent, formData.taxPercent, formData.paidAmount]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return; // Prevent multiple clicks during loading

    setSubmitting(true);
    // setError('');
    // setSuccess('');
    // setSubmitting(true);

    try {
      if (!formData.customerId) {
        throw new Error('Please select a customer');
      }
      if (formData.items.some(item => !item.productId || item.quantity <= 0)) {
        throw new Error('Please add valid products to the bill');
      }

      const billData = {
        customerId: formData.customerId,
        items: formData.items,
        subtotal: formData.subtotal,
        discountPercent: formData.discountPercent,
        taxPercent: formData.taxPercent,
        totalAmount: formData.totalAmount,
        paymentStatus: formData.paymentStatus,
        paymentMethod: formData.paymentMethod,
        paidAmount: formData.paidAmount,
        dueAmount: formData.dueAmount,
        billDate: formData.billDate,
        dueDate: formData.dueDate,
        notes: formData.notes
      };

      let result;
      if (modalMode === 'create') {
        result = await billService.createBill(billData);
      } else if (modalMode === 'edit' && selectedBill) {
        result = await billService.updateBill(selectedBill._id, billData);
      }

      const data = result;
      if (!data) {
        throw new Error(`Failed to ${modalMode} bill`);
      }

      toast.success(`Bill ${modalMode === 'create' ? 'created' : 'updated'} successfully!`);
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      const errorMessage = err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to process the bill. Please try again.';
      console.error('Bill submission error:', err.response?.data || err);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = (bill) => {
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        toast.error('Please allow popups for this site to print bills');
        return;
      }

      const customer = bill.customerId;
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice - ${bill.billNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
              .company-name { font-size: 24px; font-weight: bold; color: #333; }
              .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .customer-info, .invoice-info { width: 45%; }
              .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .items-table th { background-color: #f2f2f2; }
              .totals { margin-left: auto; width: 300px; }
              .total-row { display: flex; justify-between; padding: 5px 0; }
              .total-row.final { border-top: 2px solid #333; font-weight: bold; font-size: 18px; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-name">Shree Sai Engineering</div>
              <div>4/12, Karambakkam, Devi Nagar, Porur, Chennai, Tamil Nadu 600116</div>
              <div>Phone: 93442 96658 | Email: info@shreesaiepoxy.com</div>
            </div>
            <div class="invoice-details">
              <div class="customer-info">
                <h3>Bill To:</h3>
                <div><strong>${customer.name}</strong></div>
                <div>${customer.email}</div>
                <div>${customer.phone || ''}</div>
              </div>
              <div class="invoice-info">
                <h3>Invoice Details:</h3>
                <div><strong>Invoice #:</strong> ${bill.billNumber}</div>
                <div><strong>Date:</strong> ${new Date(bill.billDate).toLocaleDateString()}</div>
                <div><strong>Payment Status:</strong> ${bill.paymentStatus.toUpperCase()}</div>
                <div><strong>Payment Method:</strong> ${bill.paymentMethod.toUpperCase()}</div>
              </div>
            </div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${bill.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price.toLocaleString()}</td>
                    <td>₹${item.total.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>₹${bill.subtotal.toLocaleString()}</span>
              </div>
              ${bill.discountPercent > 0 ? `
              <div class="total-row">
                <span>Discount (${bill.discountPercent}%):</span>
                <span>₹${((bill.subtotal * bill.discountPercent) / 100).toLocaleString()}</span>
              </div>
              ` : ''}
              ${bill.taxPercent > 0 ? `
              <div class="total-row">
                <span>Tax (${bill.taxPercent}%):</span>
                <span>₹${bill.taxAmount.toLocaleString()}</span>
              </div>
              ` : ''}
              <div class="total-row final">
                <span>Total:</span>
                <span>₹${bill.totalAmount.toLocaleString()}</span>
              </div>
              <div class="total-row">
                <span>Paid:</span>
                <span>₹${bill.paidAmount.toLocaleString()}</span>
              </div>
              <div class="total-row">
                <span>Due:</span>
                <span>₹${bill.dueAmount.toLocaleString()}</span>
              </div>
            </div>
            ${bill.notes ? `
              <div style="margin-top: 20px;">
                <strong>Notes:</strong>
                <div style="margin-top: 5px; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
                  ${bill.notes}
                </div>
              </div>
            ` : ''}
            <div class="footer">
              <div>Thank you for your business!</div>
              <div style="font-size: 12px; color: #666; margin-top: 10px;">
                This is a computer-generated invoice.
              </div>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load before printing
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        // Close after printing
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      };

      // Fallback for browsers that don't support onload
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.focus();
          printWindow.print();
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }
      }, 500);

    } catch (error) {
      console.error('Print failed:', error);
      toast.error('Failed to print bill. Please try again or use browser print option.');
    }
  };

  const handleDownload = (bill) => {
    try {
      const customer = bill.customerId;
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice - ${bill.billNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
              .company-name { font-size: 24px; font-weight: bold; color: #333; }
              .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .customer-info, .invoice-info { width: 45%; }
              .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .items-table th { background-color: #f2f2f2; }
              .totals { margin-left: auto; width: 300px; }
              .total-row { display: flex; justify-between; padding: 5px 0; }
              .total-row.final { border-top: 2px solid #333; font-weight: bold; font-size: 18px; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-name">Shree Sai Engineering</div>
              <div>4/12, Karambakkam, Devi Nagar, Porur, Chennai, Tamil Nadu 600116</div>
              <div>Phone: 93442 96658 | Email: info@shreesaiepoxy.com</div>
            </div>
            <div class="invoice-details">
              <div class="customer-info">
                <h3>Bill To:</h3>
                <div><strong>${customer.name}</strong></div>
                <div>${customer.email}</div>
                <div>${customer.phone || ''}</div>
              </div>
              <div class="invoice-info">
                <h3>Invoice Details:</h3>
                <div><strong>Invoice #:</strong> ${bill.billNumber}</div>
                <div><strong>Date:</strong> ${new Date(bill.billDate).toLocaleDateString()}</div>
                <div><strong>Payment Status:</strong> ${bill.paymentStatus.toUpperCase()}</div>
                <div><strong>Payment Method:</strong> ${bill.paymentMethod.toUpperCase()}</div>
              </div>
            </div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${bill.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price.toLocaleString()}</td>
                    <td>₹${item.total.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>₹${bill.subtotal.toLocaleString()}</span>
              </div>
              ${bill.discountPercent > 0 ? `
              <div class="total-row">
                <span>Discount (${bill.discountPercent}%):</span>
                <span>₹${((bill.subtotal * bill.discountPercent) / 100).toLocaleString()}</span>
              </div>
              ` : ''}
              ${bill.taxPercent > 0 ? `
              <div class="total-row">
                <span>Tax (${bill.taxPercent}%):</span>
                <span>₹${bill.taxAmount.toLocaleString()}</span>
              </div>
              ` : ''}
              <div class="total-row final">
                <span>Total:</span>
                <span>₹${bill.totalAmount.toLocaleString()}</span>
              </div>
              <div class="total-row">
                <span>Paid:</span>
                <span>₹${bill.paidAmount.toLocaleString()}</span>
              </div>
              <div class="total-row">
                <span>Due:</span>
                <span>₹${bill.dueAmount.toLocaleString()}</span>
              </div>
            </div>
            ${bill.notes ? `
              <div style="margin-top: 20px;">
                <strong>Notes:</strong>
                <div style="margin-top: 5px; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
                  ${bill.notes}
                </div>
              </div>
            ` : ''}
            <div class="footer">
              <div>Thank you for your business!</div>
              <div style="font-size: 12px; color: #666; margin-top: 10px;">
                This is a computer-generated invoice.
              </div>
            </div>
          </body>
        </html>
      `;

      // Create blob and download as HTML file
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${bill.billNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download bill. Please try the print option instead.');
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      items: [{ productId: '', name: '', quantity: 1, price: 0, total: 0 }],
      subtotal: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxPercent: 0,
      taxAmount: 0,
      totalAmount: 0,
      paymentStatus: 'pending',
      paymentMethod: 'cash',
      paidAmount: 0,
      dueAmount: 0,
      billDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      notes: ''
    });
    setSelectedBill(null);
    setModalMode('create');
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (bill) => {
    setFormData({
      customerId: bill.customerId?._id || '',
      customerName: bill.customerId?.name || '',
      customerEmail: bill.customerId?.email || '',
      customerPhone: bill.customerId?.phone || '',
      items: bill.items.map(item => ({ ...item })),
      subtotal: bill.subtotal || 0,
      discountPercent: bill.discountPercent || 0,
      discountAmount: bill.discount || bill.discountAmount || 0,
      taxPercent: bill.taxPercent || 0,
      taxAmount: bill.taxAmount || 0,
      totalAmount: bill.totalAmount || 0,
      paymentStatus: bill.paymentStatus || 'pending',
      paymentMethod: bill.paymentMethod || 'cash',
      paidAmount: bill.paidAmount || 0,
      dueAmount: bill.dueAmount || 0,
      billDate: bill.billDate ? new Date(bill.billDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : '',
      notes: bill.notes || ''
    });
    setSelectedBill(bill);
    setModalMode('edit');
    setShowModal(true);
  };

  const openPaymentModal = (bill) => {
    setSelectedBillForPayment(bill);
    setPaymentFormData({
      amount: bill.dueAmount.toString(),
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setPaymentError('');
    setShowPaymentModal(true);
    fetchPaymentAccounts();
  };

  const fetchPaymentAccounts = async () => {
    try {
      const data = await paymentAccountService.getAllPaymentAccounts({ status: 'active' });
      setPaymentAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error fetching payment accounts:', error);
      setPaymentAccounts([]);
    }
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      amount: '',
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setPaymentError('');
    setSelectedBillForPayment(null);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (paymentSubmitting) return;

    setPaymentError('');
    setPaymentSubmitting(true);

    try {
      const paymentData = {
        amount: parseFloat(paymentFormData.amount),
        paymentMethod: paymentFormData.paymentMethod,
        paymentAccountId: paymentFormData.paymentAccountId || undefined,
        paymentDate: paymentFormData.paymentDate,
        notes: paymentFormData.notes
      };

      const result = await billService.recordPayment(selectedBillForPayment._id, paymentData);

      setSuccess(`Payment of ₹${paymentData.amount} recorded successfully!`);
      setShowPaymentModal(false);
      resetPaymentForm();
      fetchData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setPaymentError(err.message || 'Failed to record payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleQuickPayment = async (bill, fullPayment = false) => {
    if (fullPayment) {
      openPaymentModal(bill);
    } else {
      // Quick partial payment (opens modal with suggested partial amount)
      setSelectedBillForPayment(bill);
      const suggestedAmount = Math.min(1000, bill.dueAmount); // Suggest ₹1000 or remaining balance
      setPaymentFormData({
        amount: suggestedAmount.toString(),
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setPaymentError('');
      setShowPaymentModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-200 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bill Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Create, manage, and track customer bills with integrated product pricing</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-700 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Bills</h3>
              <p className="text-xl font-bold text-blue-700 dark:text-orange-500">{stats.totalBills}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Today</h3>
              <p className="text-xl font-bold text-green-600 dark:text-green-500">{stats.todayBills}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">This Month</h3>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-500">{stats.monthlyBills}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</h3>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-500">₹{stats.pendingPayments.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-indigo-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue</h3>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-500">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 transition-colors duration-300">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search bills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-700 w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-700 appearance-none bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white min-w-40"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-700 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="self-center text-gray-600 dark:text-gray-400">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-700 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Bill
          </button>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-200 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bill Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-100 dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No bills found</td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{bill.billNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{bill.customerId?.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{bill.customerId?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{new Date(bill.billDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">₹{bill.totalAmount?.toLocaleString() || '0'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${bill.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        bill.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                        {bill.paymentStatus.charAt(0).toUpperCase() + bill.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {((bill.dueAmount && bill.dueAmount > 0) || bill.paymentStatus === 'pending' || bill.paymentStatus === 'partial') && (
                          <button
                            onClick={() => openPaymentModal(bill)}
                            className="text-green-600 hover:text-green-900 dark:text-green-500 dark:hover:text-green-400 p-1 rounded transition-colors flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1"
                            title="Record Payment"
                          >
                            <DollarSign className="w-4 h-4" />
                            <span className="text-xs font-medium">Pay</span>
                          </button>
                        )}
                        {user?.role === 'superadmin' && (
                          <button onClick={() => openEditModal(bill)} className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-500 dark:hover:text-yellow-400 p-1 rounded transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handlePrint(bill)} className="text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 p-1 rounded transition-colors" title="Print">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDownload(bill)} className="text-green-600 hover:text-green-900 dark:text-green-500 dark:hover:text-green-400 p-1 rounded transition-colors" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => setSelectedBill(bill)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-500 dark:hover:text-indigo-400 p-1 rounded transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-300 dark:border-gray-700 sm:px-6 mt-4 rounded-lg shadow-md transition-colors duration-300">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing{' '}
                <span className="font-medium">
                  {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{pagination.totalItems}</span> results
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-700 dark:text-gray-300">
                Items per page:
              </label>
              <select
                id="itemsPerPage"
                value={pagination.itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm focus:ring-blue-600 focus:border-blue-700 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className="hidden sm:flex">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNumber = Math.max(1, pagination.currentPage - 2) + i;
                if (pageNumber > pagination.totalPages) return null;

                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pageNumber === pagination.currentPage
                      ? 'z-10 bg-blue-50 border-blue-700 text-blue-700 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-400'
                      : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Create/Edit Bill Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto transition-colors duration-300">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{modalMode === 'edit' ? 'Edit Bill' : 'Create New Bill'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer *</label>
                  {formData.customerId ? (
                    <div className="mt-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-200 dark:bg-gray-700">
                      <div className="font-medium text-gray-900 dark:text-white">{formData.customerName}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{formData.customerEmail}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{formData.customerPhone}</div>
                      {modalMode === 'create' && (
                        <button type="button" onClick={openCustomerSelector} className="mt-2 text-blue-700 dark:text-orange-500 text-sm hover:text-blue-800 dark:hover:text-orange-400">
                          Change Customer
                        </button>
                      )}
                    </div>
                  ) : (
                    <button type="button" onClick={openCustomerSelector} className="mt-1 w-full px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:border-blue-700 hover:text-blue-700 dark:hover:text-orange-500 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <User className="w-5 h-5 mr-2" />
                      Select Customer
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bill Date *</label>
                  <input
                    type="date"
                    value={formData.billDate}
                    onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-700 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Items</h3>
                  <button type="button" onClick={addItem} className="text-sm bg-blue-800 text-white px-3 py-1 rounded hover:bg-blue-900">
                    Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index}>
                      <div className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-200 dark:bg-gray-700 rounded-lg">
                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Product *</label>
                          {item.productId ? (
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                              <button type="button" onClick={() => { setShowProductSelector(true); setSelectedProductIndex(index); }} className="text-blue-700 dark:text-orange-500 text-sm hover:text-blue-800 dark:hover:text-orange-400">
                                Change
                              </button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => { setShowProductSelector(true); setSelectedProductIndex(index); }} className="w-full px-2 py-1 border border-dashed border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-400 hover:border-blue-700 hover:text-blue-700 dark:hover:text-orange-500 text-sm flex items-center justify-center bg-gray-100 dark:bg-gray-600">
                              <Package className="w-4 h-4 mr-1" />
                              Select Product
                            </button>
                          )}
                        </div>

                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                            min="1"
                            required
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-blue-600 focus:border-blue-700 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
                          />
                        </div>

                        {/* Batch Selector */}
                        {item.availableBatches && item.availableBatches.length > 0 && (
                          <div className="col-span-3">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Batch {item.availableBatches.length > 1 && <span className="text-blue-700">*</span>}
                            </label>
                            <select
                              value={item.batchNumber || ''}
                              onChange={(e) => handleBatchChange(index, e.target.value)}
                              required={item.availableBatches.length > 0}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-blue-600 focus:border-blue-700 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
                            >
                              {item.availableBatches.length > 1 && <option value="">Select Batch</option>}
                              {item.availableBatches.map((batch) => (
                                <option key={batch._id} value={batch.batchNumber}>
                                  {batch.batchNumber} - ₹{batch.unitCost} (Qty: {batch.quantity})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Price (₹)</label>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))}
                            min="0"
                            step="0.01"
                            required
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-blue-600 focus:border-blue-700 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Total (₹)</label>
                          <input
                            type="text"
                            value={item.total.toLocaleString()}
                            readOnly
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-gray-100 dark:bg-gray-2000 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div className="col-span-1">
                          <button type="button" onClick={() => removeItem(index)} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 text-sm p-1" disabled={formData.items.length === 1}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                  <textarea
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-700 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Additional notes..."
                  />
                </div>
                <div>
                  <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                      <span className="font-medium text-gray-900 dark:text-white">₹{formData.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600 dark:text-gray-400">Tax (%):</span>
                      <input
                        type="number"
                        value={formData.taxPercent}
                        onChange={(e) => setFormData({ ...formData, taxPercent: Number(e.target.value) })}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-right bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600 dark:text-gray-400">Discount (%):</span>
                      <input
                        type="number"
                        value={formData.discountPercent}
                        onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-right bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="flex justify-between py-2 border-t border-gray-300 dark:border-gray-600 mt-2">
                      <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
                      <span className="font-bold text-gray-900 dark:text-white">₹{formData.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 dark:text-gray-400">Payment Status:</span>
                        <select
                          value={formData.paymentStatus}
                          onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="partial">Partial</option>
                          <option value="paid">Paid</option>
                        </select>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                        <select
                          value={formData.paymentMethod}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="upi">UPI</option>
                          <option value="bank_transfer">Bank Transfer</option>
                        </select>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 dark:text-gray-400">Paid Amount (₹):</span>
                        <input
                          type="number"
                          value={formData.paidAmount}
                          onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                          min="0"
                          step="0.01"
                          className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-right bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 dark:text-gray-400">Due Amount:</span>
                        <span className="font-medium text-gray-900 dark:text-white">₹{formData.dueAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 ${submitting
                    ? 'bg-gray-400 cursor-not-allowed opacity-70'
                    : 'bg-blue-800 hover:bg-blue-900 text-white focus:ring-blue-600'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{modalMode === 'edit' ? 'Updating...' : 'Creating...'}</span>
                      </>
                    ) : (
                      modalMode === 'edit' ? 'Update Bill' : 'Create Bill'
                    )}
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Selector Modal */}
      {showCustomerSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto transition-colors duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select Customer</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowCustomerForm(prev => {
                      const next = !prev;
                      if (!next) {
                        resetCustomerForm();
                      } else {
                        setCustomerFormError('');
                      }
                      return next;
                    });
                  }}
                  className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {showCustomerForm ? 'Cancel' : 'Add Customer'}
                </button>
                <button onClick={() => { setShowCustomerSelector(false); resetCustomerForm(); }} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-700 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>
            </div>
            {showCustomerForm && (
              <div className="mb-4 border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-200 dark:bg-gray-700">
                {customerFormError && (
                  <div className="mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded">
                    {customerFormError}
                  </div>
                )}
                <form onSubmit={handleCreateCustomer} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={customerFormData.name}
                        onChange={handleCustomerFormChange}
                        required
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={customerFormData.email}
                        onChange={handleCustomerFormChange}
                        required
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={customerFormData.phone}
                        onChange={handleCustomerFormChange}
                        required
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Customer Type</label>
                      <select
                        name="customerType"
                        value={customerFormData.customerType}
                        onChange={handleCustomerFormChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="individual">Individual</option>
                        <option value="business">Business</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetCustomerForm();
                        setShowCustomerForm(false);
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={customerFormSubmitting}
                      className={`px-4 py-2 rounded-md text-white ${customerFormSubmitting
                        ? 'bg-orange-400 cursor-not-allowed opacity-80'
                        : 'bg-blue-800 hover:bg-blue-900 transition-colors'
                        }`}
                    >
                      {customerFormSubmitting ? 'Creating...' : 'Create Customer'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <div key={customer._id} onClick={() => selectCustomer(customer)} className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{customer.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{customer.email}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{customer.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{customer.customerType}</div>
                      <div className={`text-xs px-2 py-1 rounded-full ${customer.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {customer.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredCustomers.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No customers found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Selector Modal */}
      {showProductSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto transition-colors duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select Product</h3>
              <button onClick={() => setShowProductSelector(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Filter</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-700 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-700 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div key={product._id} onClick={() => selectProduct(product, selectedProductIndex)} className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{typeof product.category === 'object' ? product.category?.name : product.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600 dark:text-green-500">₹{product.price.toLocaleString()}</div>
                      <div className={`text-xs px-2 py-1 rounded-full ${(() => {
                        const displayQuantity = product.unit === 'liter' ? (product.quantity / 1000) :
                          product.unit === 'kilogram' ? (product.quantity / 1000) :
                            product.quantity || 0;
                        return displayQuantity === 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                          displayQuantity <= 10 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
                      })()}`}>
                        Stock: {product.unit === 'liter' ? (product.quantity / 1000).toFixed(2) :
                          product.unit === 'kilogram' ? (product.quantity / 1000).toFixed(2) :
                            product.quantity || 0}
                        {product.unit === 'liter' ? 'L' :
                          product.unit === 'kilogram' ? 'KG' :
                            'PCS'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No products found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bill Details Modal */}
      {selectedBill && !showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bill Details</h2>
              <div className="flex space-x-2">
                <button onClick={() => handlePrint(selectedBill)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </button>
                <button onClick={() => handleDownload(selectedBill)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
                <button onClick={() => setSelectedBill(null)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bill Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bill Number</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedBill.billNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bill Date</label>
                      <p className="text-sm text-gray-900 dark:text-white">{new Date(selectedBill.billDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedBill.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : selectedBill.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {selectedBill.paymentStatus.charAt(0).toUpperCase() + selectedBill.paymentStatus.slice(1)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                      <p className="text-sm text-gray-900 dark:text-white capitalize">{selectedBill.paymentMethod}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedBill.customerId?.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedBill.customerId?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedBill.customerId?.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-200 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-100 dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedBill.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">₹{item.price.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">₹{item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {selectedBill.notes ? (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Notes</h3>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedBill.notes}</p>
                    </div>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 text-sm italic">No notes available</div>
                  )}
                </div>
                <div>
                  <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                      <span className="font-medium text-gray-900 dark:text-white">₹{selectedBill.subtotal.toLocaleString()}</span>
                    </div>
                    {selectedBill.discountPercent > 0 && (
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 dark:text-gray-400">Discount ({selectedBill.discountPercent}%):</span>
                        <span className="font-medium text-gray-900 dark:text-white">₹{((selectedBill.subtotal * selectedBill.discountPercent) / 100).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedBill.taxPercent > 0 && (
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 dark:text-gray-400">Tax ({selectedBill.taxPercent}%):</span>
                        <span className="font-medium text-gray-900 dark:text-white">₹{selectedBill.taxAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-t border-gray-300 dark:border-gray-600 mt-2">
                      <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
                      <span className="font-bold text-gray-900 dark:text-white">₹{selectedBill.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600 dark:text-gray-400">Paid:</span>
                      <span className="font-medium text-gray-900 dark:text-white">₹{selectedBill.paidAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600 dark:text-gray-400">Due:</span>
                      <span className="font-medium text-gray-900 dark:text-white">₹{selectedBill.dueAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedBillForPayment && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Record Payment</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Bill #{selectedBillForPayment.billNumber} - {selectedBillForPayment.customerId?.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    resetPaymentForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-6">
              {/* Payment Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ₹{selectedBillForPayment.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      ₹{selectedBillForPayment.paidAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Due</p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      ₹{selectedBillForPayment.dueAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {paymentError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  {paymentError}
                </div>
              )}

              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Amount <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedBillForPayment.dueAmount}
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setPaymentFormData({ ...paymentFormData, amount: selectedBillForPayment.dueAmount.toString() })}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Full Amount
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum: ₹{selectedBillForPayment.dueAmount.toLocaleString()}
                </p>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={paymentFormData.paymentMethod}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit">Credit</option>
                </select>
              </div>

              {/* Payment Account - Only show for non-cash payments */}
              {paymentFormData.paymentMethod !== 'cash' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Account {paymentFormData.paymentMethod === 'bank' && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={paymentFormData.paymentAccountId}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentAccountId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required={paymentFormData.paymentMethod === 'bank'}
                  >
                    <option value="">Select Account</option>
                    {paymentAccounts.map(account => (
                      <option key={account._id} value={account._id}>
                        {account.name} - ₹{account.currentBalance.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {paymentFormData.paymentMethod === 'bank' ? 'Required for bank transfers' : 'Optional - Select account to record this transaction'}
                  </p>
                </div>
              )}

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentFormData.paymentDate}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Payment Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Add payment reference or notes..."
                />
              </div>

              {/* Payment History */}
              {selectedBillForPayment.paymentHistory && selectedBillForPayment.paymentHistory.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment History</h3>
                    <button
                      type="button"
                      onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      {showPaymentHistory ? 'Hide' : 'Show'} ({selectedBillForPayment.paymentHistory.length})
                    </button>
                  </div>

                  {showPaymentHistory && (
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Date</th>
                            <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Amount</th>
                            <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Method</th>
                            <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                          {selectedBillForPayment.paymentHistory.map((payment, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-3 py-2 text-gray-900 dark:text-white">
                                {new Date(payment.paymentDate).toLocaleDateString()}
                              </td>
                              <td className="px-3 py-2 font-medium text-green-600 dark:text-green-400">
                                ₹{payment.amount.toLocaleString()}
                              </td>
                              <td className="px-3 py-2 text-gray-700 dark:text-gray-300 capitalize">
                                {payment.paymentMethod.replace('_', ' ')}
                              </td>
                              <td className="px-3 py-2 text-gray-600 dark:text-gray-400 text-xs">
                                {payment.notes || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    resetPaymentForm();
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={paymentSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={paymentSubmitting}
                >
                  {paymentSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Recording...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4" />
                      Record Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pending Items/Payments Warning Modal */}
      {showPendingModal && pendingDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Pending Items/Payments Alert</h2>
                  <p className="text-sm text-gray-500">Customer: {pendingDetails.customerName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPendingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {pendingDetails.pendingBills.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" /> Pending Payments
                  </h3>
                  <div className="bg-red-50 rounded-lg border border-red-100 overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-red-100 text-red-700">
                        <tr>
                          <th className="px-4 py-2 font-medium">Bill #</th>
                          <th className="px-4 py-2 font-medium">Date</th>
                          <th className="px-4 py-2 font-medium">Due Amount</th>
                          <th className="px-4 py-2 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100">
                        {pendingDetails.pendingBills.map((bill, idx) => (
                          <tr key={bill._id || idx} className="hover:bg-red-50/80">
                            <td className="px-4 py-2 font-medium text-gray-900">{bill.billNumber}</td>
                            <td className="px-4 py-2 text-gray-600">{new Date(bill.billDate).toLocaleDateString()}</td>
                            <td className="px-4 py-2 text-red-600 font-semibold">₹{bill.dueAmount?.toLocaleString()}</td>
                            <td className="px-4 py-2 text-gray-600">₹{bill.totalAmount?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {pendingDetails.pendingItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Package className="w-4 h-4 mr-2" /> Unreturned Items
                  </h3>
                  <div className="bg-orange-50 rounded-lg border border-orange-100 overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-orange-100 text-orange-700">
                        <tr>
                          <th className="px-4 py-2 font-medium">Item Name</th>
                          <th className="px-4 py-2 font-medium">Quantity</th>
                          <th className="px-4 py-2 font-medium">Date Given</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-orange-100">
                        {pendingDetails.pendingItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-orange-50/80">
                            <td className="px-4 py-2 font-medium text-gray-900">{item.itemName}</td>
                            <td className="px-4 py-2 text-gray-600">{item.quantity}</td>
                            <td className="px-4 py-2 text-gray-600">{new Date(item.rentalDate || new Date()).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-orange-600 mt-2 px-1">
                    * Please collect these items or add to current bill if being returned.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-6 mt-6 border-t border-gray-100">
              <button
                onClick={() => setShowPendingModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm hover:shadow"
              >
                Acknowledge & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBills;