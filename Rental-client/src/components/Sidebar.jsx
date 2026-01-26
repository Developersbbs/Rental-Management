import React, { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { logout, selectUser } from "../redux/features/auth/loginSlice"
import { ChevronDown, ChevronRight, ChevronLeft, Menu, Lock } from "lucide-react"

const Sidebar = ({ onNavigate }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = () => {
    // 1️⃣ Clear any stored user data first
    localStorage.removeItem('user')
    localStorage.removeItem('token')

    // 2️⃣ Close sidebar if callback provided (must be done before navigation)
    if (onNavigate) {
      onNavigate()
    }

    // 3️⃣ Force a small delay to ensure state updates and navigation happens in correct order
    setTimeout(() => {
      // 4️⃣ Clear Redux state
      dispatch(logout())

      // 5️⃣ Redirect to login with replace to prevent going back to protected routes
      navigate("/login", { replace: true })

      // 6️⃣ Force a hard reload to ensure clean state
      window.location.reload()
    }, 100)
  }

  const handleNavigation = () => {
    if (onNavigate) {
      onNavigate()
    }
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 md:py-3 mx-1 md:mx-2 rounded-lg transition-all duration-200 font-medium ${isActive
      ? "bg-blue-600 text-white shadow-lg transform scale-105"
      : "text-gray-200 hover:bg-blue-800/60 hover:text-white"
    }`

  // Define navigation items with categories based on role
  const getNavigationItems = () => {
    const role = user?.role?.toLowerCase()

    // Top-level items (always visible)
    const dashboard = { to: "/", icon: "🏠", label: "Dashboard" }
    const notifications = { to: "/notifications", icon: "🔔", label: "Notifications" }

    const userManagement = [
      { to: "/manageuser", icon: "👥", label: "Users" },
      { to: "/manage-customers", icon: "🧑‍🤝‍🧑", label: "Customers" }
    ]

    // Reports sub-items
    const reports = [
      { to: "/stock-report", icon: "📊", label: "Stock Reports" },
      { to: "/product-report", icon: "📈", label: "Product Report" },
      { to: "/yearly-sales-report", icon: "📅", label: "Yearly Sales Report" },
      { to: "/selling-report", icon: "💰", label: "Selling Reports" }
    ]

    // User Management sub-items
    const userManagementItems = [
      { to: "/manageuser", icon: "👥", label: "Users" }
    ]

    // Sales sub-items
    const salesItems = [
      { to: "/manage-bill", icon: "🧾", label: "Bills" }
    ]
    // Rental sub-items
    const rentals = [
      { to: "/rentals/new", icon: "➕", label: "New Rental" },
      { to: "/rentals/active", icon: "📋", label: "Active Rentals" },
      { to: "/rentals/inward", icon: "📥", label: "Rental Inward" },
      { to: "/rentals/inward-history", icon: "📜", label: "Inward History" },
      { to: "/rentals/products", icon: "📦", label: "Rental Products" },
      { to: "/rentals/selling-accessories", icon: "💰", label: "Selling Accessories" },
      { to: "/rentals/customers", icon: "👥", label: "Rental Customers" },
      { to: "/rentals/categories", icon: "🏷️", label: "Rental Categories" },
      { to: "/rentals/billing-history", icon: "🧾", label: "Billing History" },
      { to: "/payment-accounts", icon: "💳", label: "Payment Accounts" },
      { to: "/service-maintenance", icon: "🔧", label: "Service & Maintenance" },
      { to: "/reports", icon: "📊", label: "Reports & Analytics" }
    ]
    // Inventory items removed as per user request for "Rental Only" application

    const roleBasedItems = {
      superadmin: [
        dashboard,
        notifications,
        { type: 'category', label: 'Rentals', icon: '🔑', items: rentals },
        { type: 'category', label: 'User Management', icon: '👥', items: userManagementItems }
      ],
      staff: [
        dashboard,
        notifications,
        { type: 'category', label: 'Rentals', icon: '🔑', items: rentals }
      ]
    }

    return roleBasedItems[role] || []
  }

  // Get role display name and color
  const getRoleInfo = () => {
    const role = user?.role?.toLowerCase()

    switch (role) {
      case 'superadmin':
        return { name: 'Super Admin', color: 'bg-purple-500', textColor: 'text-purple-900 dark:text-purple-300' }
      case 'staff':
        return { name: 'Staff', color: 'bg-green-500', textColor: 'text-green-900 dark:text-green-300' }
      default:
        return { name: 'User', color: 'bg-gray-200', textColor: 'text-gray-900 dark:text-slate-300' }
    }
  }

  const navigationItems = getNavigationItems()
  const roleInfo = getRoleInfo()

  // State to track open/closed state of each category
  const [openCategories, setOpenCategories] = useState({})

  // Toggle category open/close
  const toggleCategory = (categoryLabel) => {
    if (isCollapsed) {
      setIsCollapsed(false)
      setOpenCategories(prev => ({
        ...prev,
        [categoryLabel]: true
      }))
    } else {
      setOpenCategories(prev => ({
        ...prev,
        [categoryLabel]: !prev[categoryLabel]
      }))
    }
  }

  // Render navigation items with support for recursive categories
  const renderNavigationItems = (items, level = 0) => {
    return items.map((item, index) => {
      if (item.type === 'category') {
        const isOpen = openCategories[item.label] ?? true // Default to open
        const paddingLeft = isCollapsed ? 0 : level * 12 // Increase padding for nested levels only if not collapsed

        return (
          <div key={`category-${index}-${level}`} className="mb-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleCategory(item.label)
              }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200`}
              style={{ paddingLeft: isCollapsed ? '0px' : `${Math.max(12, paddingLeft + 12)}px` }}
              title={isCollapsed ? item.label : ''}
            >
              <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                <span className="text-lg opacity-80">{item.icon}</span>
                {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
              </div>
              {!isCollapsed && (
                isOpen ? (
                  <ChevronDown className="h-4 w-4 opacity-50" />
                ) : (
                  <ChevronRight className="h-4 w-4 opacity-50" />
                )
              )}
            </button>

            {isOpen && !isCollapsed && (
              <div className={`mt-1 space-y-1 ${level === 0 ? 'border-l border-sidebar-border ml-4' : ''}`}>
                {renderNavigationItems(item.items, level + 1)}
              </div>
            )}
          </div>
        )
      }

      // Regular navigation item
      const paddingLeft = isCollapsed ? 0 : level * 12
      return (
        <div key={`item-${index}-${level}`} onClick={handleNavigation}>
          <NavLink
            to={item.to}
            className={({ isActive }) => `flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 rounded-lg text-sm transition-all duration-200 group ${isActive
              ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm font-medium'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            style={{ paddingLeft: isCollapsed ? '0px' : `${Math.max(12, paddingLeft + 12)}px` }}
            title={isCollapsed ? item.label : ''}
          >
            <span className={`text-lg transition-transform duration-200 group-hover:scale-110`}>{item.icon}</span>
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        </div>
      )
    })
  }

  return (
    <>
      {user && (
        <div
          className={`${isCollapsed ? 'w-20' : 'w-full md:w-80'} h-full bg-sidebar border-r border-sidebar-border shadow-xl flex flex-col transition-all duration-300 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent`}
        >
          {/* Header */}
          <div className={`bg-sidebar p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-sidebar-border sticky top-0 z-20`}>
            {!isCollapsed ? (
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1.5 rounded-lg shrink-0 shadow-sm">
                  <Lock className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-sidebar-foreground truncate tracking-tight">
                  NK TOOLS
                </h1>
              </div>
            ) : (
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg shadow-sm cursor-pointer"
                onClick={() => setIsCollapsed(false)}
                title="NK TOOLS"
              >
                <Lock className="w-5 h-5 text-white" />
              </div>
            )}

            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors ml-2"
              >
                <ChevronLeft size={20} />
              </button>
            )}
          </div>

          {/* User Info */}
          <div className={`p-4 border-b border-sidebar-border ${isCollapsed ? 'flex justify-center' : ''}`}>
            <div className={`flex items-center gap-3 p-2 rounded-xl bg-sidebar-accent/50 ${isCollapsed ? 'justify-center w-10 h-10 p-0' : ''}`}>
              <div className="w-10 h-10 bg-sidebar-primary rounded-full flex items-center justify-center text-sidebar-primary-foreground font-bold shrink-0 shadow-sm">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{user.username}</p>
                  <p className="text-xs text-sidebar-foreground/60 px-0 py-0.5 rounded-full inline-block mt-0.5">
                    {roleInfo.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto pr-1">
            {renderNavigationItems(navigationItems)}
          </nav>

          {/* Logout Button */}
          <div className="p-3 border-t border-sidebar-border transition-colors duration-300 sticky bottom-0 bg-sidebar">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-3'} px-3 py-2.5 rounded-lg transition-all duration-200 font-medium text-sidebar-foreground/80 hover:bg-destructive hover:text-destructive-foreground hover:shadow-md group`}
              title={isCollapsed ? "Logout" : ""}
            >
              <span className="text-lg group-hover:rotate-12 transition-transform">🚪</span>
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar
