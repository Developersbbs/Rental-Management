import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  createInward,
  getInwards,
  getInward,
  updateInward,
  deleteInward,
  approveInward,
  rejectInward,
  completeInward,
  addToInventory,
  reset,
  clearInward
} from '@/redux/features/inwardSlice/inwardSlice';
import supplierService from '@/services/supplierService';
import { fetchProducts } from '@/redux/features/products/productSlice';
import { selectUser } from '@/redux/features/auth/loginSlice';
import { toast } from 'react-toastify';
import InwardList from '@/components/InwardList';
import InwardForm from '@/components/InwardForm';
import InwardDetail from '@/components/InwardDetail';

const Inward = () => {
  const [currentView, setCurrentView] = useState('list');
  const [selectedInward, setSelectedInward] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  const [filters, setFilters] = useState({
    status: ''
  });

  const dispatch = useDispatch();
  const { inwards, inward, isLoading, isError, message, total } = useSelector(
    (state) => ({
      ...state.inwards,
      total: state.inwards.pagination?.total || 0
    })
  );
  // Access products state directly
  const productsState = useSelector((state) => state.products);
  // Handle different product state structures
  const products = productsState?.items || productsState?.products || [];
  
  // Debug log to check products
  useEffect(() => {
    console.log('Products in Inward component:', products);
  }, [products]);
  const user = useSelector(selectUser);
  const token = useSelector((state) => state.login?.token || null);

  useEffect(() => {
    if (user && token) {
      console.log('🔄 Inward page: Loading data...');
      const queryParams = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };
      dispatch(getInwards(queryParams));
      loadSuppliers();
      
      // Fetch products with proper error handling
      if (products.length === 0) {
        console.log('🔄 Loading products...');
        dispatch(fetchProducts({ page: 1, limit: 100 }))
          .unwrap()
          .then((result) => {
            console.log('✅ Products loaded successfully:', result);
          })
          .catch((error) => {
            console.error('❌ Failed to load products:', error);
          });
      }
    }
  }, [dispatch, user, token, filters, pagination.page, pagination.limit]);

  // Update pagination when total changes
  useEffect(() => {
    if (total !== pagination.total) {
      setPagination(prev => ({
        ...prev,
        total
      }));
    }
  }, [total]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    dispatch(reset());
  }, [isError, message, dispatch]);

  // Debug: Log products state
  useEffect(() => {
    console.log('🔧 Inward page FULL STATE:', productsState);
    console.log('🔧 Inward page products.items:', productsState?.items);
    console.log('🔧 Inward page products array length:', Array.isArray(products) ? products.length : 'Not an array');
    console.log('🔧 Inward page products sample:', products.slice(0, 2));
    console.log('🔧 Inward page loading:', productsState?.loading);
  }, [productsState, products]);

  const loadSuppliers = async () => {
    if (!token) {
      console.log('🔄 No auth token, skipping supplier load');
      return;
    }

    try {
      console.log('🔄 Loading suppliers for inward form...');
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

      console.log('✅ Suppliers loaded for inward:', suppliersArray.length, 'suppliers');
      setSuppliers(suppliersArray);
    } catch (error) {
      console.error('❌ Failed to load suppliers for inward:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(`Failed to load suppliers: ${error.response?.data?.message || error.message}`);
      setSuppliers([]); // Ensure suppliers is always an array
    }
  };

  const handleCreateNew = () => {
    dispatch(clearInward());
    setIsEditMode(false);
    setCurrentView('form');
  };

  const handleViewDetails = (inwardId) => {
    dispatch(getInward(inwardId));
    setSelectedInward(inwardId);
    setCurrentView('detail');
  };

  const handleEdit = (inwardId) => {
    dispatch(getInward(inwardId));
    setSelectedInward(inwardId);
    setIsEditMode(true);
    setCurrentView('form');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedInward(null);
    setIsEditMode(false);
  };

  const handleSubmitForm = (inwardData) => {
    if (isEditMode && selectedInward) {
      dispatch(updateInward({ inwardId: selectedInward, inwardData }))
        .unwrap()
        .then(() => {
          toast.success('Inward updated successfully');
          setCurrentView('list');
        })
        .catch((error) => {
          toast.error(error);
        });
    } else {
      dispatch(createInward(inwardData))
        .unwrap()
        .then(() => {
          toast.success('Inward created successfully');
          setCurrentView('list');
        })
        .catch((error) => {
          toast.error(error);
        });
    }
  };

  const handleDelete = (inwardId) => {
    if (window.confirm('Are you sure you want to delete this inward?')) {
      dispatch(deleteInward(inwardId))
        .unwrap()
        .then(() => {
          toast.success('Inward deleted successfully');
        })
        .catch((error) => {
          toast.error(error);
        });
    }
  };

  const handleApprove = (inwardId) => {
    dispatch(approveInward(inwardId))
      .unwrap()
      .then(() => {
        toast.success('Inward approved successfully');
      })
      .catch((error) => {
        toast.error(error);
      });
  };

  const handleReject = (inwardId) => {
    dispatch(rejectInward(inwardId))
      .unwrap()
      .then(() => {
        toast.success('Inward rejected');
      })
      .catch((error) => {
        toast.error(error);
      });
  };

  const handleComplete = (inwardId) => {
    dispatch(completeInward(inwardId))
      .unwrap()
      .then(() => {
        toast.success('Inward completed successfully');
      })
      .catch((error) => {
        toast.error(error);
      });
  };

  const handleSubmitForApproval = (inwardId) => {
    // Update inward status to pending
    const inwardData = { status: 'pending' };
    dispatch(updateInward({ inwardId, inwardData }))
      .unwrap()
      .then(() => {
        toast.success('Inward submitted for approval');
      })
      .catch((error) => {
        toast.error(error);
      });
  };

  const handleFilterChange = (newFilters) => {
    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
    setFilters({ ...filters, ...newFilters });
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
    // Scroll to top of the page
    window.scrollTo(0, 0);
  };

  const handleProductCreated = (newProduct) => {
    console.log('✅ New product created, refreshing products list:', newProduct);
    // Refresh products list
    dispatch(fetchProducts({ page: 1, limit: 100 }))
      .unwrap()
      .then((result) => {
        console.log('✅ Products refreshed successfully');
        toast.success('Product created successfully!');
      })
      .catch((error) => {
        console.error('❌ Failed to refresh products:', error);
      });
  };

  const handleApproveInward = async (inwardId) => {
    try {
      await dispatch(approveInward(inwardId)).unwrap();
      toast.success('Inward approved successfully');
      dispatch(getInwards(filters));
      const idToRefresh = selectedInward || inward?._id;
      if (idToRefresh) {
        await dispatch(getInward(idToRefresh)).unwrap();
      }
    } catch (error) {
      toast.error(error || 'Failed to approve inward');
    }
  };

  const handleAddToInventory = async (inwardId) => {
    if (window.confirm('Are you sure you want to add these items to inventory? This action cannot be undone.')) {
      try {
        await dispatch(addToInventory(inwardId)).unwrap();
        toast.success('Items added to inventory successfully');
        dispatch(getInwards(filters));
        const idToRefresh = selectedInward || inward?._id;
        if (idToRefresh) {
          await dispatch(getInward(idToRefresh)).unwrap();
        }
      } catch (error) {
        toast.error(error || 'Failed to add items to inventory');
      }
    }
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
            <p className="text-gray-500 mb-4">Please log in to access the Inward Management system.</p>
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
            <h1 className="text-2xl font-bold text-gray-800">Inward Management (GRN)</h1>
            {currentView === 'list' && (
              <button
                onClick={handleCreateNew}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Create New Inward
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
            <InwardList
              inwards={inwards}
              isLoading={isLoading}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onApprove={handleApprove}
              onReject={handleReject}
              onComplete={handleComplete}
              filters={filters}
              onFilterChange={handleFilterChange}
              user={user}
              totalItems={pagination.total}
              currentPage={pagination.page}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
            />
          )}

          {currentView === 'form' && (
            <InwardForm
              inward={inward}
              suppliers={suppliers}
              products={products}
              onSubmit={handleSubmitForm}
              onCancel={handleBackToList}
              isEditMode={isEditMode}
              isLoading={isLoading}
              onProductCreated={handleProductCreated}
            />
          )}

          {currentView === 'detail' && (
            <InwardDetail
              inward={inward}
              onEdit={() => {
                setIsEditMode(true);
                setCurrentView('form');
              }}
              onDelete={handleDelete}
              onApprove={handleApproveInward}
              onReject={handleReject}
              onComplete={handleComplete}
              onAddToInventory={handleAddToInventory}
              onSubmitForApproval={handleSubmitForApproval}
              user={user}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Inward;
