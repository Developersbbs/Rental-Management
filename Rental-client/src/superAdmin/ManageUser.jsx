import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Key, Users, UserCheck, AlertCircle, Search, Filter } from 'lucide-react';


// API Helper Function with correct backend URL
// Updated apiFetch function with authentication
const apiFetch = async (endpoint, options = {}) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL; // Your backend server

  // Get token from localStorage or cookies
  const token = localStorage.getItem('token') || getCookie('token');

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
  };

  // Add Authorization header if token exists
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  // Add body only for methods that support it
  if (config.body && ['GET', 'HEAD'].includes(options.method)) {
    delete config.body;
  }

  try {
    const response = await fetch(`${baseURL}/api${endpoint}`, config);

    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      deleteCookie('token');
      window.location.href = '/login';
      throw new Error('Authentication required. Please login again.');
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return { message: 'Operation completed successfully' };
    }

    if (!response.ok) {
      // Try to parse error as JSON first
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error: ${response.status}`);
      } catch (e) {
        // If not JSON, use status text
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }

    // Try to parse successful response as JSON
    try {
      return await response.json();
    } catch (e) {
      return { message: 'Operation completed successfully' };
    }
  } catch (err) {
    console.error('API Fetch Error:', err.message);
    throw err;
  }
};

// Helper function to get cookie value
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

// Helper function to delete cookie
function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

const PASSWORD_CHANGE_ENABLED = false;

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, staff: 0, superadmin: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'staff' });
  const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({ new: false, confirm: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const togglePasswordVisibility = (type) => {
    setPasswordVisibility((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const fetchUsersAndStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Use Promise.all to fetch both in parallel for better performance
      const [usersData, statsData] = await Promise.all([
        apiFetch('/users'),
        apiFetch('/users/stats')
      ]);

      setUsers(usersData);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsersAndStats();
  }, [fetchUsersAndStats]);

  useEffect(() => {
    let filtered = users;
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = modalMode === 'create' ? '/users' : `/users/${selectedUser._id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const payload = { ...formData };
      if (modalMode === 'edit') delete payload.password;

      const data = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      setSuccess(data.message || `User ${modalMode === 'create' ? 'created' : 'updated'} successfully!`);
      setShowModal(false);
      resetForm();
      fetchUsersAndStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.password !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (passwordData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      const data = await apiFetch(`/users/${selectedUser._id}/password`, {
        method: 'PUT',
        body: JSON.stringify({ password: passwordData.password }),
      });

      setSuccess(data.message);
      setShowPasswordModal(false);
      setPasswordData({ password: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    setError('');
    setSuccess('');
    try {
      const data = await apiFetch(`/users/${selectedUser._id}`, {
        method: 'DELETE',
      });
      setSuccess(data.message || 'User deleted successfully!');
      setShowDeleteModal(false);
      fetchUsersAndStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({ username: '', email: '', password: '', role: 'staff' });
    setSelectedUser(null);
    setModalMode('create');
    setShowCreatePassword(false);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setFormData({ username: user.username, email: user.email, password: '', role: user.role });
    setSelectedUser(user);
    setModalMode('edit');
    setShowModal(true);
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setModalMode('view');
    setShowModal(true);
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setPasswordData({ password: '', confirmPassword: '' });
    setPasswordVisibility({ new: false, confirm: false });
    setShowPasswordModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage application users</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          <span className="text-sm sm:text-base flex-1">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-3 rounded-lg">
          <span className="text-sm sm:text-base">{success}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 sm:w-10 sm:h-10 text-primary mr-3 sm:mr-4" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate">Total Users</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <UserCheck className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 mr-3 sm:mr-4" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate">Staff</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{stats.staff}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 mr-3 sm:mr-4" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate">Super Admins</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">{stats.superadmin}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent w-full text-sm sm:text-base"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-10 pr-8 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent appearance-none bg-white min-w-0 text-sm sm:text-base"
              >
                <option value="all">All Roles</option>
                <option value="staff">Staff</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
          </div>

          {/* Add User Button */}
          <button
            onClick={openCreateModal}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 sm:px-6 sm:py-3 rounded-lg flex items-center justify-center transition-colors text-sm sm:text-base font-medium min-w-0 shadow-sm"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="hidden sm:inline">Add User</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Users Display */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <span className="ml-3 text-sm sm:text-base text-gray-600">Loading users...</span>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'staff'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                            }`}>
                            {user.role === 'staff' ? 'Staff' : 'Super Admin'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openViewModal(user)}
                              className="text-primary hover:text-primary/80 p-1 rounded transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(user)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {PASSWORD_CHANGE_ENABLED && (
                              <button
                                onClick={() => openPasswordModal(user)}
                                className="text-yellow-600 hover:text-yellow-900 p-1 rounded transition-colors"
                                title="Change Password"
                              >
                                <Key className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => openDeleteModal(user)}
                              className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {filteredUsers.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm sm:text-base text-gray-500">
                    No users found
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <div key={user._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm sm:text-base font-medium text-gray-900 truncate">{user.username}</div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'staff'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                          }`}>
                          {user.role === 'staff' ? 'Staff' : 'Super Admin'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs sm:text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => openViewModal(user)}
                          className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:text-blue-900 transition-colors text-sm"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">View</span>
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="flex items-center gap-1 px-3 py-1.5 text-indigo-600 hover:text-indigo-900 transition-colors text-sm"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        {PASSWORD_CHANGE_ENABLED && (
                          <button
                            onClick={() => openPasswordModal(user)}
                            className="flex items-center gap-1 px-3 py-1.5 text-yellow-600 hover:text-yellow-900 transition-colors text-sm"
                            title="Change Password"
                          >
                            <Key className="w-4 h-4" />
                            <span className="hidden sm:inline">Password</span>
                          </button>
                        )}
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:text-red-900 transition-colors text-sm"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* User Modal (Create/Edit/View) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4">
              {modalMode === 'create' && 'Create New User'}
              {modalMode === 'edit' && 'Edit User'}
              {modalMode === 'view' && 'User Details'}
            </h2>

            {modalMode === 'view' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser?.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedUser?.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedUser?.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {modalMode === 'create' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <div className="relative">
                      <input
                        type={showCreatePassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                        minLength="6"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCreatePassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                        aria-label={showCreatePassword ? 'Hide password' : 'Show password'}
                      >
                        {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="staff">Staff</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    {modalMode === 'create' ? 'Create' : 'Update'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Password Modal */}
      {PASSWORD_CHANGE_ENABLED && showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Change Password</h2>
            <p className="text-sm text-gray-600 mb-4">
              Changing password for: <strong>{selectedUser?.username}</strong>
            </p>

            <form onSubmit={handlePasswordUpdate} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <div className="relative">
                  <input
                    type={passwordVisibility.new ? 'text' : 'password'}
                    value={passwordData.password}
                    onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                    aria-label={passwordVisibility.new ? 'Hide password' : 'Show password'}
                  >
                    {passwordVisibility.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={passwordVisibility.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                    aria-label={passwordVisibility.confirm ? 'Hide password' : 'Show password'}
                  >
                    {passwordVisibility.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 transition-colors order-1 sm:order-2"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Delete User</h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete <strong>{selectedUser?.username}</strong>?
              This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;