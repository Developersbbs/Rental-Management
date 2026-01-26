import { useState, useEffect } from "react"
import { NavLink } from "react-router-dom"
import { useSelector } from "react-redux"
import { selectUser } from "../redux/features/auth/loginSlice"
import NotificationBell from "../components/NotificationBell"
import { Moon, Sun } from "lucide-react"

const Navbar = () => {
  const user = useSelector(selectUser);
  const [darkMode, setDarkMode] = useState(false);

  // Load dark mode preference from localStorage on component mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    // const newDarkMode = !darkMode;
    // setDarkMode(newDarkMode);
    // localStorage.setItem('darkMode', newDarkMode.toString());

    // if (newDarkMode) {
    //   document.documentElement.classList.add('dark');
    // } else {
    //   document.documentElement.classList.remove('dark');
    // }
  };

  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isActive
      ? "bg-primary text-primary-foreground shadow-sm"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`

  return (
    <nav className="w-full flex items-center justify-end px-6 py-3 gap-4">
      {!user ? (
        <NavLink to="/login" className="bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors text-primary-foreground shadow-sm">
          Login
        </NavLink>
      ) : (
        <div className="flex items-center gap-6">
          {/* Notifications */}
          <div className="relative">
            <NotificationBell />
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full bg-card hover:bg-muted/50 transition-all duration-200 cursor-pointer border border-border shadow-sm group">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="font-semibold text-sm text-foreground leading-tight">
                {user.username}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-tight">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
