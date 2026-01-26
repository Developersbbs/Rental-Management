import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { setUser } from '../redux/features/auth/loginSlice';
import instance from '../services/instance';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const dispatch = useDispatch();
  
  // Get auth state from Redux
  const user = useSelector((state) => state.login?.user);
  
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      if (!isMounted) return;
      
      try {
        // If we have user in Redux, check if we need to validate their session
        if (user) {
          // If no specific roles required or user has required role
          if (allowedRoles.length === 0 || allowedRoles.includes(user.role)) {
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        }
        
        // Always verify the session with the server
        const response = await instance.get('/auth/me');
        if (response.data) {
          // Update Redux store with fresh user data
          const userData = response.data;
          dispatch(setUser({ 
            user: userData,
            token: null // Token is in httpOnly cookie
          }));
          
          // Check role if required
          if (allowedRoles.length > 0 && !allowedRoles.includes(userData.role)) {
            throw new Error('Unauthorized: Insufficient permissions');
          }
          
          if (isMounted) {
            setIsAuthenticated(true);
          }
        } else {
          throw new Error('No user data received');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (isMounted) {
          setIsAuthenticated(false);
          // Clear any invalid user data
          dispatch(setUser({ user: null, token: null }));
          localStorage.removeItem('user');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    checkAuth();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [user, dispatch, allowedRoles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
