import React, { useEffect } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import instance from './services/instance';
import Login from './auth/Login'
import Register from './auth/Register'
import Home from './pages/Home'
import Navbar from './layout/Navbar'
import { useDispatch, useSelector } from 'react-redux'
import { ToastContainer } from 'react-toastify'
import Sidebar from './components/Sidebar'
import Layout from './layout/Layout'
import { setUser } from './redux/features/auth/loginSlice'
import SuperAdminProducts from './superAdmin/SuperAdminProducts'
import AllProducts from './pages/AllProducts'
import StockReport from './pages/StockReport'
import ProductManagement from './pages/ProductManagement'
import ManageSuppliers from './pages/ManageSuppliers'
import ManageCustomers from './pages/ManageCustomers'
import ManageBills from './pages/CreateBill'
import Notifications from './pages/Notifications'
import UserManagement from './pages/UserManagement'
import CategoryManagement from './pages/CategoryManagement'
import ManageUsers from './superAdmin/ManageUser'
import Purchase from './pages/Purchase'
import Inward from './pages/Inward'
import SellingReport from './pages/SellingReport'
import ProductSellingReport from './pages/ProductSellingReport'
import ProductReportPage from './pages/ProductReportPage'
import YearlySalesReport from './pages/YearlySalesReport'
import ProtectedRoute from './components/ProtectedRoute'
import NewRental from './pages/rentals/NewRental'
import ActiveRentals from './pages/rentals/ActiveRentals'
import RentalReturn from './pages/rentals/RentalReturn'
import RentalProducts from './pages/rentals/RentalProducts'
import RentalBillingHistory from './pages/rentals/RentalBillingHistory'
import RentalInward from './pages/rentals/RentalInward'
import RentalInwardHistory from './pages/rentals/RentalInwardHistory'
import RentalInwardDetails from './pages/rentals/RentalInwardDetails'
import UnifiedInward from './pages/UnifiedInward'
import UnifiedInwardHistory from './pages/UnifiedInwardHistory'

import RentalCustomers from './pages/rentals/RentalCustomers'
import RentalCategories from './pages/rentals/RentalCategories'
import ManageProductItems from './pages/ManageProductItems'
import ManageRentalItems from './pages/rentals/ManageRentalItems'
import RentalItemDetails from './pages/rentals/RentalItemDetails'
import ManageAccessories from './pages/rentals/ManageAccessories'
import SellingAccessories from './pages/rentals/SellingAccessories'
import AccessoryReport from './pages/reports/AccessoryReport'
import Reports from './pages/reports/Reports'
import ServiceMaintenance from './pages/ServiceMaintenance'
import CustomerDetails from './pages/CustomerDetails'
import PaymentAccounts from './pages/PaymentAccounts';
import PaymentAccountDetails from './pages/PaymentAccountDetails';
import RentalCustomerDetails from './pages/rentals/RentalCustomerDetails'



const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedUser = localStorage.getItem("user");
        const savedToken = localStorage.getItem("token");

        if (savedUser && savedToken) {
          // Set the token in instance default headers
          instance.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;

          // Verify token is still valid
          try {
            // Make a request to validate the token
            await instance.get('/auth/me');

            // Update Redux store if token is valid
            dispatch(setUser({
              user: JSON.parse(savedUser),
              token: savedToken
            }));
          } catch (error) {
            // Token is invalid, clear auth data
            console.error('Token validation failed:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('csrfToken');
            delete instance.defaults.headers.common['Authorization'];
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };

    initializeAuth();
  }, [dispatch]);

  const router = createBrowserRouter([
    // Public routes (without Layout)
    {
      path: '/login',
      element: <Login />
    },
    {
      path: '/register',
      element: <Register />
    },

    // Protected routes (with Layout)
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          path: '/',
          element: <ProtectedRoute><Home /></ProtectedRoute>
        },



        {
          path: '/payment-accounts',
          element: <ProtectedRoute><PaymentAccounts /></ProtectedRoute>
        },
        {
          path: '/payment-accounts/:id',
          element: <ProtectedRoute><PaymentAccountDetails /></ProtectedRoute>
        },

        {
          path: '/notifications',
          element: <ProtectedRoute><Notifications /></ProtectedRoute>
        },

        {
          path: '/manageuser',
          element: <ProtectedRoute><ManageUsers /></ProtectedRoute>
        },

        {
          path: '/rentals/new',
          element: <ProtectedRoute><NewRental /></ProtectedRoute>
        },
        {
          path: '/rentals/active',
          element: <ProtectedRoute><ActiveRentals /></ProtectedRoute>
        },
        {
          path: '/rentals/reports/accessories',
          element: <ProtectedRoute><AccessoryReport /></ProtectedRoute>
        },
        {
          path: '/rentals/products',
          element: <ProtectedRoute><RentalProducts /></ProtectedRoute>
        },
        {
          path: '/rentals/billing-history',
          element: <ProtectedRoute><RentalBillingHistory /></ProtectedRoute>
        },
        {
          path: '/rentals/inward',
          element: <ProtectedRoute><UnifiedInward /></ProtectedRoute>
        },
        {
          path: '/rentals/inward-old',
          element: <ProtectedRoute><RentalInward /></ProtectedRoute>
        },
        {
          path: '/rentals/inward-history',
          element: <ProtectedRoute><UnifiedInwardHistory /></ProtectedRoute>
        },
        {
          path: '/rentals/inward/:id',
          element: <ProtectedRoute><RentalInwardDetails /></ProtectedRoute>
        },

        {
          path: '/rentals/customers',
          element: <ProtectedRoute><RentalCustomers /></ProtectedRoute>
        },
        {
          path: '/rentals/customers/:id',
          element: <ProtectedRoute><RentalCustomerDetails /></ProtectedRoute>
        },
        {
          path: '/rentals/categories',
          element: <ProtectedRoute><RentalCategories /></ProtectedRoute>
        },
        {
          path: '/rentals/return/:id',
          element: <ProtectedRoute><RentalReturn /></ProtectedRoute>
        },

        {
          path: '/rentals/products/:productId/items',
          element: <ProtectedRoute><ManageRentalItems /></ProtectedRoute>
        },
        {
          path: '/rentals/items/:itemId',
          element: <ProtectedRoute><RentalItemDetails /></ProtectedRoute>
        },
        {
          path: '/rentals/products/:productId/accessories',
          element: <ProtectedRoute><ManageAccessories /></ProtectedRoute>
        },
        {
          path: '/rentals/selling-accessories',
          element: <ProtectedRoute><SellingAccessories /></ProtectedRoute>
        },
        {
          path: '/reports',
          element: <ProtectedRoute><Reports /></ProtectedRoute>
        },
        {
          path: '/service-maintenance',
          element: <ProtectedRoute><ServiceMaintenance /></ProtectedRoute>
        }
      ]
    }
  ])

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer
        position='bottom-right'
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  )
}

export default App