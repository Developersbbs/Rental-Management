import React, { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { logout, selectUser } from "../redux/features/auth/loginSlice"
import { ChevronDown, ChevronLeft, Lock } from "lucide-react"

const Sidebar = ({ onNavigate }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openCategories, setOpenCategories] = useState({})

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    if (onNavigate) onNavigate()
    setTimeout(() => {
      dispatch(logout())
      navigate("/login", { replace: true })
      window.location.reload()
    }, 100)
  }

  const handleNavigation = () => {
    if (onNavigate) onNavigate()
  }

  // Toggle category open/close
  const toggleCategory = (categoryLabel) => {
    if (isCollapsed) {
      setIsCollapsed(false)
      setOpenCategories(prev => ({ ...prev, [categoryLabel]: true }))
    } else {
      setOpenCategories(prev => ({ ...prev, [categoryLabel]: !prev[categoryLabel] }))
    }
  }

  // Navigation items by role
  const getNavigationItems = () => {
    const role = user?.role?.toLowerCase()

    const dashboard = { to: "/", icon: "🏠", label: "Dashboard" }
    const notifications = { to: "/notifications", icon: "🔔", label: "Notifications" }

    const userManagementItems = [
      { to: "/manageuser", icon: "👥", label: "Users" }
    ]

    const rentals = [
      { to: "/rentals/new", icon: "➕", label: "New Rental" },
      { to: "/rentals/active", icon: "📋", label: "Active Rentals" },
      { to: "/rentals/suppliers", icon: "🏭", label: "Vendors" },
      { to: "/rentals/inward", icon: "📥", label: "Inward" },
      { to: "/rentals/inward-history", icon: "📜", label: "Inward History" },
      { to: "/rentals/products", icon: "📦", label: "Products" },
      { to: "/rentals/selling-accessories", icon: "💰", label: "Selling Accessories" },
      { to: "/rentals/customers", icon: "👥", label: "Customers" },
      { to: "/rentals/categories", icon: "🏷️", label: "Categories" },
      { to: "/rentals/billing-history", icon: "🧾", label: "Billing History" },
      { to: "/payment-accounts", icon: "💳", label: "Payment Accounts" },
      { to: "/vendor-reports", icon: "📊", label: "Vendor Reports" },
      { to: "/service-maintenance", icon: "🔧", label: "Service & Maintenance" },
      { to: "/reports", icon: "📈", label: "Reports & Analytics" }
    ]

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

  const getRoleInfo = () => {
    const role = user?.role?.toLowerCase()
    switch (role) {
      case 'superadmin': return { name: 'Super Admin' }
      case 'staff': return { name: 'Staff' }
      default: return { name: 'User' }
    }
  }

  const navigationItems = getNavigationItems()
  const roleInfo = getRoleInfo()

  // Render navigation items
  const renderNavigationItems = (items, level = 0) => {
    return items.map((item, index) => {
      if (item.type === 'category') {
        const isOpen = openCategories[item.label] ?? true
        return (
          <div key={`category-${index}-${level}`} className="mb-1">
            {/* Category Header */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleCategory(item.label)
              }}
              title={isCollapsed ? item.label : ''}
              className={`
                w-full flex items-center rounded-lg
                py-2.5 transition-colors duration-200
                text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'}
              `}
            >
              <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                <span className="text-lg opacity-80">{item.icon}</span>
                {/* Label fades out on collapse */}
                <span
                  className={`font-medium text-sm overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'
                    }`}
                >
                  {item.label}
                </span>
              </div>
              {/* Chevron rotates on open/close */}
              {!isCollapsed && (
                <ChevronDown
                  className={`h-4 w-4 opacity-50 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                />
              )}
            </button>

            {/* Accordion: smooth slide with grid-rows trick */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${isOpen && !isCollapsed ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
            >
              <div className="overflow-hidden">
                <div className={`mt-1 space-y-0.5 ${level === 0 ? 'border-l border-sidebar-border ml-4' : ''}`}>
                  {renderNavigationItems(item.items, level + 1)}
                </div>
              </div>
            </div>
          </div>
        )
      }

      // Regular nav item
      return (
        <div key={`item-${index}-${level}`} onClick={handleNavigation}>
          <NavLink
            to={item.to}
            title={isCollapsed ? item.label : ''}
            className={({ isActive }) =>
              `flex items-center rounded-lg py-2 text-sm transition-all duration-200 group
              ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'}
              ${isActive
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm font-medium'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-lg transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                {/* Label slides/fades on collapse */}
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'
                    }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        </div>
      )
    })
  }

  return (
    <>
      {user && (
        <div
          className={`
            h-full bg-sidebar border-r border-sidebar-border shadow-xl
            flex flex-col overflow-hidden
            transition-all duration-300 ease-in-out
            ${isCollapsed ? 'w-[72px]' : 'w-72'}
          `}
        >
          {/* ─── Header ─── */}
          <div className="bg-sidebar p-4 flex items-center justify-between border-b border-sidebar-border sticky top-0 z-20">
            {/* Logo icon — always visible */}
            <div
              className={`bg-gradient-to-r from-blue-500 to-purple-600 p-1.5 rounded-lg shadow-sm shrink-0 ${isCollapsed ? 'cursor-pointer' : ''}`}
              onClick={() => isCollapsed && setIsCollapsed(false)}
              title={isCollapsed ? 'NK TOOLS' : ''}
            >
              <Lock className="w-4 h-4 text-white" />
            </div>

            {/* Title fades on collapse */}
            <span
              className={`
                text-lg font-bold text-sidebar-foreground tracking-tight overflow-hidden whitespace-nowrap
                transition-all duration-300 ease-in-out ml-2 flex-1
                ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'}
              `}
            >
              NK TOOLS
            </span>

            {/* Collapse toggle — hidden when collapsed */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`
                p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground
                transition-all duration-200 shrink-0
                ${isCollapsed ? 'opacity-0 pointer-events-none w-0 p-0 overflow-hidden' : 'opacity-100 ml-2'}
              `}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          {/* ─── User Info ─── */}
          <div className="p-3 border-b border-sidebar-border">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-sidebar-accent/50 overflow-hidden">
              <div className="w-9 h-9 bg-sidebar-primary rounded-full flex items-center justify-center text-sidebar-primary-foreground font-bold shrink-0 shadow-sm text-sm">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div
                className={`
                  overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out min-w-0
                  ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'}
                `}
              >
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user.username}</p>
                <p className="text-xs text-sidebar-foreground/60 mt-0.5">{roleInfo.name}</p>
              </div>
            </div>
          </div>

          {/* ─── Navigation ─── */}
          <nav className="flex flex-col gap-0.5 p-2 flex-1 overflow-y-auto">
            {renderNavigationItems(navigationItems)}
          </nav>

          {/* ─── Logout ─── */}
          <div className="p-3 border-t border-sidebar-border sticky bottom-0 bg-sidebar">
            <button
              onClick={handleLogout}
              title={isCollapsed ? "Logout" : ""}
              className="w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-medium text-sidebar-foreground/80 hover:bg-destructive hover:text-destructive-foreground hover:shadow-md group"
            >
              <span className="text-lg group-hover:rotate-12 transition-transform duration-200 shrink-0">🚪</span>
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'
                  }`}
              >
                Logout
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar
