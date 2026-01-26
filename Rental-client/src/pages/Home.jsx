import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/features/auth/loginSlice';
import {
  Package, Users, ShoppingCart, AlertTriangle, TrendingUp, TrendingDown,
  DollarSign, Activity, UserPlus, FileText, Bell, Settings,
  Calendar, Clock, CheckCircle, XCircle, Eye, Edit, Trash2, ArrowRight
} from 'lucide-react';
import productService from '../services/productService';
import billApiService from '../services/billApiService';
import customerService from '../services/customerService';
import rentalService from '../services/rentalService';
import rentalProductService from '../services/rentalProductService';
import rentalCustomerService from '../services/rentalCustomerService'; // Added import
import RentalNotificationCard from '../components/RentalNotificationCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const Home = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const formatCategory = (category) => {
    if (!category) return 'No Category';
    if (typeof category === 'string') return category;
    if (typeof category === 'object') {
      if (category.name) return category.name;
      if (category.label) return category.label;
    }
    return 'No Category';
  };

  // Helper function to get display quantity
  const getDisplayQuantity = (product) => {
    if (product.unit === 'liter') {
      return (product.quantity / 1000).toFixed(2);
    } else if (product.unit === 'kilogram') {
      return (product.quantity / 1000).toFixed(2);
    } else {
      return product.quantity || 0;
    }
  };

  // Helper function to get display unit
  const getDisplayUnit = (product) => {
    if (product.unit === 'liter') {
      return 'L';
    } else if (product.unit === 'kilogram') {
      return 'KG';
    } else {
      return 'PCS';
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch data based on user role
      const role = user?.role?.toLowerCase();
      let data = {};

      if (role === 'superadmin' || role === 'staff') {
        data = await fetchSuperAdminData();
      } else if (role === 'stockmanager') {
        data = await fetchStockManagerData();
      } else if (role === 'billcounter') {
        data = await fetchBillCounterData();
      }

      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuperAdminData = async () => {
    try {
      const [products, customers, bills, stats, rentalStats, rentals, rentalNotifications, rentalProducts, billStats, rentalCustomers] = await Promise.all([
        productService.getAllProducts(),
        customerService.getAllCustomers(),
        billApiService.getAllBills(),
        productService.getProductStats(),
        rentalService.getRentalStats(),
        rentalService.getAllRentals(),
        rentalService.getRentalNotifications(),
        rentalProductService.getAllRentalProducts(),
        billApiService.getBillStats(),
        rentalCustomerService.getAllRentalCustomers() // Added fetch
      ]);

      const allProducts = Array.isArray(products.products) ? products.products : (Array.isArray(products) ? products : []);
      const allRentalProducts = Array.isArray(rentalProducts.rentalProducts) ? rentalProducts.rentalProducts : (Array.isArray(rentalProducts) ? rentalProducts : []);

      const salesCustomers = Array.isArray(customers.customers) ? customers.customers : (Array.isArray(customers) ? customers : []);
      const rentalCustomersList = Array.isArray(rentalCustomers.rentalCustomers) ? rentalCustomers.rentalCustomers : (Array.isArray(rentalCustomers) ? rentalCustomers : []);

      console.log('--- DEBUG CUSTOMER COUNT ---');
      console.log('Raw customers response:', customers);
      console.log('Sales customers extracted:', salesCustomers);
      console.log('Raw rentalCustomers response:', rentalCustomers);
      console.log('Rental customers extracted:', rentalCustomersList);
      console.log('Sales Count:', salesCustomers.length);
      console.log('Rental Count:', rentalCustomersList.length);
      console.log('Combined Total:', salesCustomers.length + rentalCustomersList.length);

      // Use only rental customers count as requested
      const totalCustomersCount = rentalCustomersList.length;

      // Calculate rental inventory value from rental products
      const rentalInventoryValue = allRentalProducts.reduce((total, product) => {
        const value = (product.purchasePrice || 0) * (product.totalQuantity || 0);
        return total + value;
      }, 0);

      // Get all rentals for rental bills count
      const allRentals = Array.isArray(rentals) ? rentals : [];

      // Get all bills
      const allBills = Array.isArray(bills.bills) ? bills.bills : (Array.isArray(bills) ? bills : []);

      // Calculate rental pending payments from rental bills (type === 'rental')
      // Sum up dueAmount from all rental bills that are not fully paid
      const rentalPendingAmount = allBills
        .filter(bill => bill.type === 'rental' && bill.paymentStatus !== 'paid')
        .reduce((total, bill) => {
          return total + (bill.dueAmount || 0);
        }, 0);

      // Combine out of stock items from both regular products and rental products
      const outOfStockRegularProducts = allProducts.filter(p => p.quantity === 0).map(p => ({
        ...p,
        _type: 'regular',
        displayQuantity: 0
      }));

      const outOfStockRentalProducts = allRentalProducts.filter(p => p.availableQuantity === 0).map(p => ({
        ...p,
        _type: 'rental',
        displayQuantity: 0,
        quantity: 0 // For consistency with regular products
      }));

      const combinedOutOfStock = [...outOfStockRegularProducts, ...outOfStockRentalProducts];

      return {
        products: allProducts,
        customers: salesCustomers, // Keep mostly for other usages if any
        rentalCustomers: rentalCustomersList, // Store rental customers
        totalCustomersCount: totalCustomersCount, // Use this for the card
        bills: Array.isArray(bills.bills) ? bills.bills : (Array.isArray(bills) ? bills : []),
        rentalBillsCount: allRentals.length, // Rental bills count
        rentalInventoryValue: rentalInventoryValue, // Rental inventory value
        rentalPendingAmount: rentalPendingAmount, // Rental pending payments
        stats: stats || productService.calculateStats(allProducts),
        billStats: billStats || { totalPendingAmount: 0, pendingPayments: 0 },
        recentBills: (Array.isArray(bills.bills) ? bills.bills : (Array.isArray(bills) ? bills : [])).slice(0, 5),
        recentCustomers: salesCustomers.slice(0, 5),
        lowStockProducts: allProducts.filter(p => p.quantity > 0 && p.quantity <= 10).sort((a, b) => a.quantity - b.quantity),
        availableInventory: allProducts.filter(p => p.quantity > 10).sort((a, b) => b.quantity - a.quantity), // Healthy stock
        outOfStockProducts: combinedOutOfStock,
        rentalStats: rentalStats || { activeRentals: 0, completedRentals: 0, totalRevenue: 0 },
        recentRentals: (Array.isArray(rentals) ? rentals : []).slice(0, 5),
        returnNotifications: (Array.isArray(rentalNotifications?.notifications) ? rentalNotifications.notifications : [])
      };
    } catch (err) {
      console.error("fetchSuperAdminData error:", err);
      return {};
    }
  };

  const fetchStockManagerData = async () => {
    try {
      const [products, categories] = await Promise.all([
        productService.getAllProducts(),
        productService.getCategories(),
        productService.getLowStockProducts()
      ]);

      const productsData = Array.isArray(products.products) ? products.products : (Array.isArray(products) ? products : []);

      return {
        products: productsData,
        categories: Array.isArray(categories.categories) ? categories.categories : (Array.isArray(categories) ? categories : []),
        lowStockProducts: productsData.filter(p => p.quantity > 0 && p.quantity <= 10).sort((a, b) => a.quantity - b.quantity),
        availableInventory: productsData.filter(p => p.quantity > 10).sort((a, b) => b.quantity - a.quantity),
        stats: productService.calculateStats(productsData),
        outOfStockProducts: productsData.filter(p => p.quantity === 0)
      };
    } catch (err) {
      console.error("fetchStockManagerData error:", err);
      return {};
    }
  };

  const fetchBillCounterData = async () => {
    try {
      const [customers, bills, billStats] = await Promise.all([
        customerService.getAllCustomers(),
        billApiService.getAllBills(),
        billApiService.getBillStats()
      ]);

      const billsData = Array.isArray(bills.bills) ? bills.bills : (Array.isArray(bills) ? bills : []);
      const customersData = Array.isArray(customers.customers) ? customers.customers : (Array.isArray(customers) ? customers : []);

      return {
        customers: customersData,
        totalCustomersCount: customersData.length, // Bill counter sees only bill customers
        bills: billsData,
        billStats: billStats || { totalPendingAmount: 0, pendingPayments: 0 },
        recentBills: billsData.slice(0, 10),
        pendingPayments: billsData.filter(bill => bill.paymentStatus !== 'paid')
      };
    } catch (err) {
      console.error("fetchBillCounterData error:", err);
      return {};
    }
  };
  // ... existing render functions ...
  const renderSuperAdminDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div>
          <h1 className="section-title">Welcome back, {user?.username}!</h1>
          <p className="text-muted-foreground mt-1 text-lg">Super Admin Dashboard - Full System Overview</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="inline-flex items-center bg-muted/50 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground border border-border">
              <Clock className="w-3.5 h-3.5 mr-2" />
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2.5 rounded-xl border border-primary/20">
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]"></div>
          <span className="text-sm font-bold text-primary uppercase tracking-wider">System Active</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className="hover:shadow-md transition-all duration-300 border-l-4 border-l-primary cursor-pointer active:scale-95"
          onClick={() => navigate('/reports', { state: { activeTab: 'inventory' } })}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Package className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold tracking-tight">{dashboardData.stats?.total || 0}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Total Products</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-md transition-all duration-300 border-l-4 border-l-indigo-500 cursor-pointer active:scale-95"
          onClick={() => navigate('/reports', { state: { activeTab: 'customers' } })}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                <Users className="w-5 h-5 text-indigo-500" />
              </div>
            </div>
            <div className="mt-4">
              {/* Display Rental Customers Count */}
              <h3 className="text-3xl font-bold tracking-tight">{dashboardData.totalCustomersCount || 0}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Rental Customers</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-500 cursor-pointer active:scale-95"
          onClick={() => navigate('/reports', { state: { activeTab: 'rentals' } })}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-blue-500/10 rounded-xl">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold tracking-tight">{dashboardData.rentalBillsCount || 0}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Rental Bills</p>
            </div>
          </CardContent>
        </Card>


        <Card
          className="hover:shadow-md transition-all duration-300 border-l-4 border-l-destructive cursor-pointer active:scale-95"
          onClick={() => navigate('/reports', { state: { activeTab: 'rentals' } })}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-destructive/10 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold tracking-tight text-destructive">₹{(dashboardData.rentalPendingAmount || 0).toLocaleString()}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Rental Pending Payments</p>
            </div>
          </CardContent>
        </Card>

        {/* Missing Profit Card */}
        <Card
          className="hover:shadow-md transition-all duration-300 border-l-4 border-l-orange-500 cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-950/20 shadow-sm"
          onClick={() => navigate('/reports', { state: { activeTab: 'customers' } })}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-orange-500/10 rounded-xl">
                <TrendingDown className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                <Activity className="w-3 h-3" />
                View Details
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
                ₹{(dashboardData.rentalStats?.totalMissingProfit || 0).toLocaleString()}
              </h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Reduced Amount (Loss)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rental Metrics */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center font-bold">
            <div className="p-2 bg-primary/10 rounded-lg mr-3">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            Rental Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-muted/30 p-5 rounded-2xl border border-border shadow-sm group hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold">{dashboardData.rentalStats?.activeRentals || 0}</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Active Rentals</p>
              </div>
            </div>

            <div className="bg-muted/30 p-5 rounded-2xl border border-border shadow-sm group hover:border-emerald-500/30 transition-all">
              <div className="flex items-start justify-between">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold">{dashboardData.rentalStats?.completedRentals || 0}</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Completed Rentals</p>
              </div>
            </div>

            <div className="bg-muted/30 p-5 rounded-2xl border border-border shadow-sm group hover:border-indigo-500/30 transition-all">
              <div className="flex items-start justify-between">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                  <DollarSign className="w-5 h-5 text-indigo-500" />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold">₹{(dashboardData.rentalStats?.totalRevenue || 0).toLocaleString()}</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Rental Revenue</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Return Time Notifications */}
      <Card className="border-border overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-xl flex items-center font-bold">
            <div className="p-2 bg-destructive/10 rounded-lg mr-3">
              <Clock className="w-5 h-5 text-destructive" />
            </div>
            Return Notifications
            <span className="ml-3 px-2.5 py-1 text-[10px] font-bold rounded-full bg-destructive/10 text-destructive border border-destructive/20 uppercase tracking-widest">
              {dashboardData.returnNotifications?.length || 0} Expiring
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/rentals/active'}
            className="text-primary hover:bg-primary/5"
          >
            View All
            <Activity className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-premium">
            {dashboardData.returnNotifications?.length > 0 ? (
              dashboardData.returnNotifications.map((notification) => (
                <div key={notification._id} className="premium-card p-4 bg-muted/30">
                  <RentalNotificationCard
                    notification={notification}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                <div className="p-4 bg-background rounded-full shadow-sm mb-4">
                  <CheckCircle className="w-10 h-10 text-emerald-500/30" />
                </div>
                <p className="text-lg font-bold text-foreground">No pending returns</p>
                <p className="text-sm text-muted-foreground mt-1">All rentals are currently on schedule</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inventory & Low Stock Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Low Stock Attention */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg flex items-center font-bold text-destructive">
              <AlertTriangle className="w-5 h-5 mr-3" />
              Low Stock
            </CardTitle>
            <span className="badge badge-destructive">
              {dashboardData.lowStockProducts?.length || 0} items
            </span>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-premium">
              {dashboardData.lowStockProducts?.slice(0, 20).map((product, index) => (
                <div key={product._id || index} className="flex items-center justify-between p-3 bg-background hover:bg-muted/50 rounded-xl border border-destructive/10 transition-all group shadow-sm">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 bg-destructive/10 rounded-lg group-hover:scale-110 transition-transform">
                      <Package className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{product.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{formatCategory(product.category)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive">
                      {getDisplayQuantity(product)} {getDisplayUnit(product)}
                    </p>
                    <p className="text-[10px] text-destructive/70 font-bold uppercase">Critical</p>
                  </div>
                </div>
              ))}
              {(!dashboardData.lowStockProducts || dashboardData.lowStockProducts.length === 0) && (
                <div className="text-center py-12 flex flex-col items-center">
                  <CheckCircle className="w-10 h-10 text-emerald-500/30 mb-3" />
                  <p className="text-sm font-bold opacity-50">Stock level healthy</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Out of Stock */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg flex items-center font-bold text-destructive">
              <XCircle className="w-5 h-5 mr-3" />
              Empty Stock
            </CardTitle>
            <span className="badge badge-destructive">
              {dashboardData.outOfStockProducts?.length || 0} items
            </span>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-premium">
              {dashboardData.outOfStockProducts?.slice(0, 20).map((product, index) => (
                <div key={product._id || index} className="flex items-center justify-between p-3 bg-background hover:bg-muted/50 rounded-xl border border-destructive/10 transition-all group shadow-sm">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 bg-destructive/20 rounded-lg group-hover:scale-110 transition-transform">
                      <XCircle className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-foreground truncate">{product.name}</p>
                        {product._type === 'rental' && (
                          <span className="badge badge-secondary px-1 text-[8px]">Rental</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{formatCategory(product.category)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive text-lg">0</p>
                    <p className="text-[10px] text-destructive/70 font-bold uppercase">Restock</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Available Inventory */}
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg flex items-center font-bold text-emerald-600">
              <Package className="w-5 h-5 mr-3" />
              Healthy Stock
            </CardTitle>
            <span className="badge badge-primary bg-emerald-500 text-white">
              {dashboardData.availableInventory?.length || 0} items
            </span>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-premium">
              {dashboardData.availableInventory?.slice(0, 20).map((product, index) => (
                <div key={product._id || index} className="flex items-center justify-between p-3 bg-background hover:bg-emerald-500/5 rounded-xl border border-emerald-500/10 transition-all group shadow-sm">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:scale-110 transition-transform">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{product.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{formatCategory(product.category)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">
                      {getDisplayQuantity(product)} {getDisplayUnit(product)}
                    </p>
                    <p className="text-[10px] text-emerald-600/70 font-bold uppercase">Optimal</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStockManagerDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div>
          <h1 className="section-title">Welcome back, {user?.username}!</h1>
          <p className="text-muted-foreground mt-1 text-lg">Stock Manager Dashboard - Inventory Management</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="inline-flex items-center bg-muted/50 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground border border-border">
              <Clock className="w-3.5 h-3.5 mr-2" />
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-2.5 rounded-xl border border-blue-500/20">
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
          <span className="text-sm font-bold text-blue-500 uppercase tracking-wider">Inventory Active</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className="hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-500 cursor-pointer active:scale-95"
          onClick={() => navigate('/reports', { state: { activeTab: 'inventory' } })}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-blue-500/10 rounded-xl">
                <Package className="w-5 h-5 text-blue-500" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold tracking-tight">{dashboardData.stats?.total || 0}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Total Products</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300 border-l-4 border-l-amber-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-amber-500/10 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <span className="badge badge-secondary bg-amber-500 text-white">Alert</span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold tracking-tight">{dashboardData.stats?.lowStock || 0}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Low Stock Items</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300 border-l-4 border-l-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-destructive/10 rounded-xl">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <span className="badge badge-destructive">Critical</span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold tracking-tight text-destructive">{dashboardData.stats?.outOfStock || 0}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Out of Stock</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300 border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                <Activity className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold tracking-tight">{dashboardData.categories?.length || 0}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Categories</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Sections for Stock Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center font-bold text-destructive">
              <AlertTriangle className="w-5 h-5 mr-3" />
              Low Stock Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-premium">
              {dashboardData.lowStockProducts?.slice(0, 8).map((product, index) => (
                <div key={product._id || index} className="flex items-center justify-between p-3 bg-background hover:bg-muted/50 rounded-xl border border-destructive/10 transition-all shadow-sm">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <Package className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{product.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{formatCategory(product.category)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive">
                      {getDisplayQuantity(product)} {getDisplayUnit(product)}
                    </p>
                    <p className="text-[10px] text-destructive/70 font-bold uppercase">Reorder</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center font-bold text-emerald-600">
              <Package className="w-5 h-5 mr-3" />
              Available Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-premium">
              {dashboardData.availableInventory?.slice(0, 8).map((product, index) => (
                <div key={product._id || index} className="flex items-center justify-between p-3 bg-background hover:bg-emerald-500/5 rounded-xl border border-emerald-500/10 transition-all shadow-sm">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Package className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{product.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{formatCategory(product.category)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">
                      {getDisplayQuantity(product)} {getDisplayUnit(product)}
                    </p>
                    <p className="text-[10px] text-emerald-600/70 font-bold uppercase">Optimal</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="group hover:border-primary/50 transition-all cursor-pointer bg-muted/30">
          <CardContent className="pt-8 text-center">
            <div className="p-4 bg-primary rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
              <Package className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Add Product</h3>
            <p className="text-sm text-muted-foreground">Add new products to inventory</p>
          </CardContent>
        </Card>

        <Card className="group hover:border-emerald-500/50 transition-all cursor-pointer bg-muted/30">
          <CardContent className="pt-8 text-center">
            <div className="p-4 bg-emerald-500 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">View Products</h3>
            <p className="text-sm text-muted-foreground">Browse and manage products</p>
          </CardContent>
        </Card>

        <Card className="group hover:border-indigo-500/50 transition-all cursor-pointer bg-muted/30">
          <CardContent className="pt-8 text-center">
            <div className="p-4 bg-indigo-500 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Stock Reports</h3>
            <p className="text-sm text-muted-foreground">View detailed stock reports</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderBillCounterDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div>
          <h1 className="section-title">Welcome back, {user?.username}!</h1>
          <p className="text-muted-foreground mt-1 text-lg">Bill Counter Dashboard - Billing & Customer Management</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="inline-flex items-center bg-muted/50 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground border border-border">
              <Clock className="w-3.5 h-3.5 mr-2" />
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2.5 rounded-xl border border-primary/20">
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]"></div>
          <span className="text-sm font-bold text-primary uppercase tracking-wider">Billing Active</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className="hover:shadow-md transition-all duration-300 border-l-4 border-l-primary cursor-pointer active:scale-95"
          onClick={() => navigate('/reports', { state: { activeTab: 'customers' } })}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold tracking-tight">{dashboardData.customers?.length || 0}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Total Customers</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-md transition-all duration-300 border-l-4 border-l-indigo-500 cursor-pointer active:scale-95"
          onClick={() => navigate('/reports', { state: { activeTab: 'financial' } })}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                <FileText className="w-5 h-5 text-indigo-500" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold tracking-tight">{dashboardData.bills?.length || 0}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Total Bills</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-md transition-all duration-300 border-l-4 border-l-emerald-500 cursor-pointer active:scale-95"
          onClick={() => navigate('/reports', { state: { activeTab: 'financial' } })}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold tracking-tight">
                ₹{dashboardData.bills?.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0).toLocaleString()}
              </h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Total Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-md transition-all duration-300 border-l-4 border-l-destructive cursor-pointer active:scale-95"
          onClick={() => navigate('/reports', { state: { activeTab: 'financial' } })}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-destructive/10 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <span className="badge badge-destructive">Pending</span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold tracking-tight text-destructive">
                ₹{dashboardData.billStats?.totalPendingAmount?.toLocaleString() || 0}
              </h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Pending Amount</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-xl flex items-center font-bold">
            <div className="p-2 bg-primary/10 rounded-lg mr-3">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            Recent Transactions
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/bills'}
            className="text-primary hover:bg-primary/5"
          >
            View All Bills
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-premium">
            {dashboardData.recentBills?.map((bill, index) => (
              <div key={bill._id || index} className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border transition-all group">
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="p-3 bg-card rounded-xl border border-border group-hover:scale-110 transition-transform shadow-sm">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">Bill #{bill.billNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">{bill.customerName} • {new Date(bill.billDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground text-lg">₹{bill.totalAmount?.toLocaleString()}</p>
                  <span className={cn(
                    "badge mt-1",
                    bill.paymentStatus === 'paid' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      bill.paymentStatus === 'partial' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        "bg-destructive/10 text-destructive border-destructive/20"
                  )}>
                    {bill.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="group hover:border-primary/50 transition-all cursor-pointer bg-muted/30" onClick={() => window.location.href = '/customers/new'}>
          <CardContent className="pt-8 text-center">
            <div className="p-4 bg-primary rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
              <UserPlus className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Add Customer</h3>
            <p className="text-sm text-muted-foreground">Create new customer profile</p>
          </CardContent>
        </Card>

        <Card className="group hover:border-emerald-500/50 transition-all cursor-pointer bg-muted/30" onClick={() => window.location.href = '/billing/new'}>
          <CardContent className="pt-8 text-center">
            <div className="p-4 bg-emerald-500 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Create Bill</h3>
            <p className="text-sm text-muted-foreground">Generate new bill for customer</p>
          </CardContent>
        </Card>

        <Card className="group hover:border-indigo-500/50 transition-all cursor-pointer bg-muted/30" onClick={() => window.location.href = '/customers'}>
          <CardContent className="pt-8 text-center">
            <div className="p-4 bg-indigo-500 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">View Customers</h3>
            <p className="text-sm text-muted-foreground">Browse customer database</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-gray-300"></div>
      </div>
    );
  }

  const role = user?.role?.toLowerCase();

  return (
    <div className="min-h-screen">
      <div className="h-full">
        {(role === 'superadmin' || role === 'staff') && renderSuperAdminDashboard()}
        {(role === 'stockmanager') && renderStockManagerDashboard()}
        {role === 'billcounter' && renderBillCounterDashboard()}
        {!role && (
          <div className="text-center py-12 sm:py-16 bg-gray-200">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">Welcome to Inventory Management System</h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-slate-400">Please log in to access your dashboard</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
