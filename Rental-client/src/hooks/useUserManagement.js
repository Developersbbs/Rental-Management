// hooks/useUserManagement.js
import { useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';

export const useUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, superadmin: 0, stockmanager: 0, billcounter: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  const setErrorMessage = useCallback((message) => {
    setError(message);
    setSuccess('');
  }, []);

  const setSuccessMessage = useCallback((message) => {
    setSuccess(message);
    setError('');
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, [setErrorMessage]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await userService.getUserStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const createUser = useCallback(async (userData) => {
    try {
      clearMessages();
      const result = await userService.createUser(userData);
      setSuccessMessage(result.message);
      await fetchUsers();
      await fetchStats();
      return result;
    } catch (err) {
      setErrorMessage(err.message);
      throw err;
    }
  }, [clearMessages, setSuccessMessage, setErrorMessage, fetchUsers, fetchStats]);

  const updateUser = useCallback(async (id, userData) => {
    try {
      clearMessages();
      const result = await userService.updateUser(id, userData);
      setSuccessMessage(result.message);
      await fetchUsers();
      await fetchStats();
      return result;
    } catch (err) {
      setErrorMessage(err.message);
      throw err;
    }
  }, [clearMessages, setSuccessMessage, setErrorMessage, fetchUsers, fetchStats]);

  const updateUserPassword = useCallback(async (id, password) => {
    try {
      clearMessages();
      const result = await userService.updateUserPassword(id, password);
      setSuccessMessage(result.message);
      return result;
    } catch (err) {
      setErrorMessage(err.message);
      throw err;
    }
  }, [clearMessages, setSuccessMessage, setErrorMessage]);

  const deleteUser = useCallback(async (id) => {
    try {
      clearMessages();
      const result = await userService.deleteUser(id);
      setSuccessMessage(result.message);
      await fetchUsers();
      await fetchStats();
      return result;
    } catch (err) {
      setErrorMessage(err.message);
      throw err;
    }
  }, [clearMessages, setSuccessMessage, setErrorMessage, fetchUsers, fetchStats]);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  return {
    users,
    stats,
    loading,
    error,
    success,
    clearMessages,
    fetchUsers,
    fetchStats,
    createUser,
    updateUser,
    updateUserPassword,
    deleteUser
  };
};