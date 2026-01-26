// src/pages/UserManagement.jsx
import React, { useState } from 'react';
import { useUserManagement } from '../hooks/useUserManagement';
import { Users, UserPlus, Edit, Trash2, Search, Shield, Package, Receipt } from 'lucide-react';

const UserManagement = () => {
  const {
    users,
    stats,
    loading,
    error,
    success,
    clearMessages,
    setErrorMessage,
    setSuccessMessage,
    fetchUsers
  } = useUserManagement();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'superadmin':
        return <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'stockmanager':
        return <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'billcounter':
        return <Receipt className="w-5 h-5 text-green-600 dark:text-green-400" />;
      default:
        return <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300';
      case 'stockmanager':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300';
      case 'billcounter':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-200 dark:bg-slate-900 min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
          User Management
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400">
          Manage system users, roles, and permissions
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 sm:px-4 py-3 rounded-lg flex items-center">
          <div className="flex-1 text-sm sm:text-base">{error}</div>
          <button
            onClick={clearMessages}
            className="ml-3 sm:ml-4 text-red-400 hover:text-red-600 dark:hover:text-red-300 text-lg sm:text-xl"
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-3 sm:px-4 py-3 rounded-lg flex items-center">
          <div className="flex-1 text-sm sm:text-base">{success}</div>
          <button
            onClick={clearMessages}
            className="ml-3 sm:ml-4 text-green-400 hover:text-green-600 dark:hover:text-green-300 text-lg sm:text-xl"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-gray-100 dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-300 dark:border-slate-700 transition-colors duration-300">
          <div className="flex items-center">
            <Users className="w-8 h-8 sm:w-10 sm:h-10 text-blue-700 mr-3 sm:mr-4" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-slate-100 truncate">
                Total Users
              </h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-700">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-300 dark:border-slate-700 transition-colors duration-300">
          <div className="flex items-center">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 mr-3 sm:mr-4" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-slate-100 truncate">
                Super Admins
              </h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">{stats.superadmin || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-300 dark:border-slate-700 transition-colors duration-300">
          <div className="flex items-center">
            <Package className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 mr-3 sm:mr-4" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-slate-100 truncate">
                Stock Managers
              </h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{stats.stockmanager}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-300 dark:border-slate-700 transition-colors duration-300">
          <div className="flex items-center">
            <Receipt className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 mr-3 sm:mr-4" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-slate-100 truncate">
                Bill Counters
              </h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{stats.billcounter}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-gray-100 dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-300 dark:border-slate-700 mb-4 sm:mb-6 transition-colors duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 sm:py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-600 focus:border-blue-700 bg-gray-100 dark:bg-slate-700 dark:text-slate-100 transition-colors"
            />
          </div>

          {/* Role Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Filter by role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 sm:py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-700 bg-gray-100 dark:bg-slate-700 dark:text-slate-100 transition-colors min-w-0"
            >
              <option value="all">All Roles</option>
              <option value="superadmin">Super Admin</option>
              <option value="stockmanager">Stock Manager</option>
              <option value="billcounter">Bill Counter</option>
            </select>
          </div>

          {/* Add User Button */}
          <button className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors text-sm sm:text-base font-medium min-w-0">
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add User</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Users Display */}
      <div className="bg-gray-100 dark:bg-slate-800 rounded-lg shadow-md border border-gray-300 dark:border-slate-700 overflow-hidden transition-colors duration-300">
        {loading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            <span className="ml-3 text-sm sm:text-base text-gray-600 dark:text-slate-400">Loading users...</span>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-200 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-100 dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500 dark:text-slate-400">
                        {searchTerm || roleFilter !== 'all'
                          ? 'No users found matching your criteria.'
                          : 'No users found.'
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                  {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                                {user.name || 'Unnamed User'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-slate-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getRoleIcon(user.role)}
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getRoleBadgeColor(user.role)}`}>
                              {user.role || 'No Role'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                            }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button className="text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1">
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
                  <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400">
                    {searchTerm || roleFilter !== 'all'
                      ? 'No users found matching your criteria.'
                      : 'No users found.'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredUsers.map((user) => (
                    <div key={user._id} className="p-4 sm:p-6 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm sm:text-base font-medium text-gray-900 dark:text-slate-100">
                              {user.name || 'Unnamed User'}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                          }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getRoleIcon(user.role)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getRoleBadgeColor(user.role)}`}>
                            {user.role || 'No Role'}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-300 dark:border-slate-700">
                        <button className="flex items-center gap-1 px-3 py-1.5 text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors text-sm">
                          <Edit className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors text-sm">
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
    </div>
  );
};

export default UserManagement;
