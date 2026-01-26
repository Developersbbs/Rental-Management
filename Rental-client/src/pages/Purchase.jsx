import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  createPurchase,
  getPurchases,
  getPurchase,
  updatePurchase,
  deletePurchase,
  approvePurchase,
  rejectPurchase,
  receivePurchase,
  reset,
  clearPurchase,
  addPayment
} from '@/redux/features/purchaseSlice/purchaseSlice';
import PurchasePaymentModal from '@/components/PurchasePaymentModal';
import supplierService from '@/services/supplierService';
import { fetchProducts } from '@/redux/features/products/productSlice';
import { selectUser } from '@/redux/features/auth/loginSlice';
import { toast } from 'react-toastify';
import PurchaseList from '@/components/PurchaseList';
import PurchaseForm from '@/components/PurchaseForm';
import PurchaseDetail from '@/components/PurchaseDetail';
import ReceiveItemsModal from '@/components/ReceiveItemsModal';

const Purchase = () => {
  const [currentView, setCurrentView] = useState('list');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 10
  });

  const dispatch = useDispatch();
  const { purchases, purchase, isLoading, isError, message } = useSelector(
    (state) => state.purchases
  );
  const { products: productsState } = useSelector((state) => state.products);
  const products = productsState?.items || [];
  const user = useSelector(selectUser);
  const token = useSelector((state) => state.login?.token || null);

  useEffect(() => {
    if (user && token) {
      dispatch(getPurchases(filters));
      loadSuppliers();
      dispatch(fetchProducts());
      console.log('🔄 Purchase page: Fetching products...');
    }
  }, [dispatch, filters, user, token]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    dispatch(reset());
  }, [isError, message, dispatch]);

  // Debug: Log products state
  useEffect(() => {
    console.log('🔧 Purchase page products state:', productsState);
    console.log('🔧 Purchase page products array:', products);
    console.log('🔧 Purchase page products loading:', productsState?.loading);
    console.log('🔧 Purchase page products error:', productsState?.error);
  }, [productsState, products]);

  const loadSuppliers = async () => {
    try {
      console.log('🔄 Loading suppliers...');
      console.log('Current user:', user);
      const suppliersData = await supplierService.getAllSuppliers();
      console.log('📦 Suppliers data received:', suppliersData);

      // Handle different response formats
      let suppliersArray = [];
      if (suppliersData && suppliersData.suppliers) {
        suppliersArray = suppliersData.suppliers;
      } else if (suppliersData && suppliersData.docs) {
        suppliersArray = suppliersData.docs;
      } else if (Array.isArray(suppliersData)) {
        suppliersArray = suppliersData;
      } else {
        suppliersArray = [];
      }

      console.log('✅ Suppliers loaded:', suppliersArray.length, 'suppliers');
      setSuppliers(suppliersArray);
    } catch (error) {
      console.error('❌ Failed to load suppliers:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(`Failed to load suppliers: ${error.response?.data?.message || error.message}`);
      setSuppliers([]); // Ensure suppliers is always an array
    }
  };

  const handleCreateNew = () => {
    dispatch(clearPurchase());
    setIsEditMode(false);
    setCurrentView('form');
  };

  const handleViewDetails = (purchaseId) => {
    dispatch(getPurchase(purchaseId));
    setSelectedPurchase(purchaseId);
    setCurrentView('detail');
  };

  const handleEdit = (purchaseId) => {
    dispatch(getPurchase(purchaseId));
    setSelectedPurchase(purchaseId);
    setIsEditMode(true);
    setCurrentView('form');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedPurchase(null);
    setIsEditMode(false);
  };

  const handleSubmitForm = (purchaseData) => {
    if (isEditMode && selectedPurchase) {
      dispatch(updatePurchase({ purchaseId: selectedPurchase, purchaseData }))
        .unwrap()
        .then(() => {
          toast.success('Purchase order updated successfully');
          setCurrentView('list');
        })
        .catch((error) => {
          toast.error(error);
        });
    } else {
      dispatch(createPurchase(purchaseData))
        .unwrap()
        .then(() => {
          toast.success('Purchase order created successfully');
          setCurrentView('list');
        })
        .catch((error) => {
          toast.error(error);
        });
    }
  };

  const handleDelete = (purchaseId) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      dispatch(deletePurchase(purchaseId))
        .unwrap()
        .then(() => {
          toast.success('Purchase order deleted successfully');
        })
        .catch((error) => {
          toast.error(error);
        });
    }
  };

  const handleApprove = (purchaseId) => {
    dispatch(approvePurchase(purchaseId))
      .unwrap()
      .then(() => {
        toast.success('Purchase order approved successfully');
      })
      .catch((error) => {
        toast.error(error);
      });
  };

  const handleReject = (purchaseId) => {
    dispatch(rejectPurchase(purchaseId))
      .unwrap()
      .then(() => {
        toast.success('Purchase order rejected');
      })
      .catch((error) => {
        toast.error(error);
      });
  };

  const handleReceive = (purchaseId) => {
    setSelectedPurchase(purchaseId);
    setShowReceiveModal(true);
  };

  const handleSubmitReceive = (receivedItems) => {
    dispatch(receivePurchase({ purchaseId: selectedPurchase, receivedItems }))
      .unwrap()
      .then(() => {
        toast.success('Items received successfully');
        setShowReceiveModal(false);
        if (currentView === 'detail') {
          dispatch(getPurchase(selectedPurchase));
        }
      })
      .catch((error) => {
        toast.error(error);
      });
  };

  const handlePay = (purchase) => {
    setSelectedPurchase(purchase ? purchase._id : null);
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = (purchaseId, paymentData) => {
    return dispatch(addPayment({ purchaseId, paymentData }))
      .unwrap()
      .then(() => {
        toast.success('Payment recorded successfully');
        setShowPaymentModal(false);
        if (currentView === 'detail') {
          dispatch(getPurchase(selectedPurchase));
        }
      });
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {!user || !token ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-500 mb-4">Please log in to access the Purchase Order Management system.</p>
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Login
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Purchase Orders</h1>
            {currentView === 'list' && (
              <button
                onClick={handleCreateNew}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Create New Purchase Order
              </button>
            )}
            {currentView !== 'list' && (
              <button
                onClick={handleBackToList}
                className="bg-gray-2000 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Back to List
              </button>
            )}
          </div>

          {currentView === 'list' && (
            <PurchaseList
              purchases={purchases}
              isLoading={isLoading}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onApprove={handleApprove}
              onReject={handleReject}
              onReceive={handleReceive}
              onPay={handlePay}
              filters={filters}
              onFilterChange={handleFilterChange}
              user={user}
            />
          )}

          {currentView === 'form' && (
            <PurchaseForm
              purchase={purchase}
              suppliers={suppliers}
              products={products}
              onSubmit={handleSubmitForm}
              onCancel={handleBackToList}
              isEditMode={isEditMode}
              isLoading={isLoading}
            />
          )}

          {currentView === 'detail' && purchase && (
            <PurchaseDetail
              purchase={purchase}
              onEdit={() => handleEdit(purchase._id)}
              onDelete={handleDelete}
              onApprove={handleApprove}
              onReject={handleReject}
              onReceive={handleReceive}
              user={user}
            />
          )}

          {showReceiveModal && selectedPurchase && (
            <ReceiveItemsModal
              purchase={purchases.find(p => p._id === selectedPurchase) || purchase}
              onClose={() => setShowReceiveModal(false)}
              onSubmit={handleSubmitReceive}
            />
          )}

          {showPaymentModal && selectedPurchase && (
            <PurchasePaymentModal
              isOpen={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              purchase={purchases.find(p => p._id === selectedPurchase) || purchase}
              onSubmit={handleSubmitPayment}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Purchase;