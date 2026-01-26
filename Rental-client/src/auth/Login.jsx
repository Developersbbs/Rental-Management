import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { selectEmail, selectPassword, setEmail, setPassword, setUser } from '../redux/features/auth/loginSlice'
import { toast } from 'react-toastify'
import instance from '../services/instance';
import { Lock, Mail, Eye, EyeOff, LogIn } from 'lucide-react';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const email = useSelector(selectEmail)
  const password = useSelector(selectPassword)

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault();

    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await instance.post('/auth/login', { email, password });
      const { user, token, csrfToken } = response.data;

      if (user && token) {
        // Update Redux store with user data
        const userData = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        };

        dispatch(setUser({
          user: userData,
          token: token
        }));

        // Save user data and token to localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);

        // Set CSRF token if available
        if (csrfToken) {
          localStorage.setItem('csrfToken', csrfToken);
        }

        toast.success('Login successful 🎉');

        // Get the redirect path from location state or default to '/'
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Login failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 bg-slate-800/50 backdrop-blur-lg border-b border-slate-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2.5 rounded-lg shadow-lg">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                NK TOOLS
              </span>
            </div>
            <div className="text-sm text-slate-300 font-medium">
              Rental Management System
            </div>
          </div>
        </div>
      </nav>

      {/* Login Form */}
      <div className="relative z-10 flex items-center justify-center px-4 py-12 sm:py-16 min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-2xl border border-white/20 px-8 py-10 space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome Back
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Sign in to access your dashboard and manage your inventory
                </p>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => dispatch(setEmail(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => dispatch(setPassword(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 pr-12 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Keep your credentials secure. Contact an administrator if you need assistance.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading
                  ? 'bg-slate-400 cursor-not-allowed opacity-70'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Sign In</span>
                    </>
                  )}
                </div>
              </button>
            </form>

            <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                © 2025 NK TOOLS. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
