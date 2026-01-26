import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Wrench, AlertCircle, CheckCircle, Clock, DollarSign, Edit } from 'lucide-react';
import serviceRecordService from '../services/serviceRecordService';
import rentalInventoryItemService from '../services/rentalInventoryItemService';
import ServiceRecordForm from '../components/ServiceRecordForm';

const ServiceMaintenance = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingService, setEditingService] = useState(null);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        scheduled: 0,
        totalCost: 0
    });

    // Filters
    const [filters, setFilters] = useState({
        serviceType: '',
        serviceStatus: '',
        startDate: '',
        endDate: '',
        search: ''
    });

    // Fetch services
    const fetchServices = async () => {
        try {
            setLoading(true);
            const data = await serviceRecordService.getServiceRecords(filters);
            setServices(data.records || []);

            // Calculate stats
            const completed = data.records?.filter(s => s.serviceStatus === 'completed').length || 0;
            const scheduled = data.records?.filter(s => s.serviceStatus === 'scheduled').length || 0;
            const totalCost = data.records?.reduce((sum, s) => sum + (s.totalCost || 0), 0) || 0;

            setStats({
                total: data.records?.length || 0,
                completed,
                scheduled,
                totalCost
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        fetchServices();
    };

    const clearFilters = () => {
        setFilters({
            serviceType: '',
            serviceStatus: '',
            startDate: '',
            endDate: '',
            search: ''
        });
        setTimeout(() => fetchServices(), 100);
    };

    const getStatusBadge = (status) => {
        const config = {
            completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', icon: CheckCircle },
            scheduled: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-200', icon: Clock },
            in_progress: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', icon: Wrench },
            cancelled: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-200', icon: AlertCircle }
        };
        const { bg, text, icon: Icon } = config[status] || config.completed;

        return (
            <span className={`px-2 py-1 rounded text-xs font-semibold ${bg} ${text} flex items-center gap-1`}>
                <Icon className="w-3 h-3" />
                {status.replace('_', ' ')}
            </span>
        );
    };

    const getServiceTypeColor = (type) => {
        const colors = {
            preventive: 'text-primary dark:text-primary-foreground',
            corrective: 'text-red-600 dark:text-red-400',
            inspection: 'text-purple-600 dark:text-purple-400',
            repair: 'text-orange-600 dark:text-orange-400',
            cleaning: 'text-green-600 dark:text-green-400'
        };
        return colors[type] || 'text-gray-600';
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Service & Maintenance</h1>
                <p className="text-gray-600 dark:text-gray-400">Track equipment service history and maintenance schedules</p>
            </div>

            {/* Messages */}
            {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3 rounded">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 p-3 rounded">
                    {success}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Services</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                        </div>
                        <Wrench className="w-10 h-10 text-primary" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
                        </div>
                        <CheckCircle className="w-10 h-10 text-green-500 dark:text-green-400" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled</p>
                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.scheduled}</p>
                        </div>
                        <Clock className="w-10 h-10 text-indigo-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">₹{stats.totalCost.toLocaleString()}</p>
                        </div>
                        <DollarSign className="w-10 h-10 text-primary" />
                    </div>
                </div>
            </div>

            {/* Filters and Action Buttons */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow mb-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
                    <select
                        name="serviceType"
                        value={filters.serviceType}
                        onChange={handleFilterChange}
                        className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                    >
                        <option value="">All Service Types</option>
                        <option value="preventive">Preventive</option>
                        <option value="corrective">Corrective</option>
                        <option value="inspection">Inspection</option>
                        <option value="repair">Repair</option>
                        <option value="cleaning">Cleaning</option>
                    </select>

                    <select
                        name="serviceStatus"
                        value={filters.serviceStatus}
                        onChange={handleFilterChange}
                        className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                    >
                        <option value="">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="in_progress">In Progress</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <input
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                        className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                        placeholder="Start Date"
                    />

                    <input
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                        className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                        placeholder="End Date"
                    />

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Search services..."
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={applyFilters}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Filter className="w-4 h-4" />
                        Apply Filters
                    </button>
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white"
                    >
                        Clear
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="ml-auto px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Record Service
                    </button>
                </div>
            </div>

            {/* Services Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading services...</p>
                    </div>
                ) : services.length === 0 ? (
                    <div className="p-8 text-center">
                        <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No service records found</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                        >
                            Record First Service
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Equipment</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Service Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Technician</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cost</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {services.map((service) => (
                                    <tr key={service._id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                            {new Date(service.serviceDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {service.inventoryItemId?.rentalProductId?.name || 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {service.inventoryItemId?.uniqueIdentifier || 'N/A'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`font-medium capitalize ${getServiceTypeColor(service.serviceType)}`}>
                                                {service.serviceType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                                            {service.description}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                            {service.technicianName || service.technician?.name || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                            ₹{service.totalCost?.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {getStatusBadge(service.serviceStatus)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            {service.serviceStatus !== 'completed' && (
                                                <button
                                                    onClick={() => {
                                                        setEditingService(service);
                                                        setShowCreateModal(true);
                                                    }}
                                                    className="p-1 text-primary hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                                                    title="Edit Service"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Note for user */}
            <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4 rounded-lg">
                <p className="text-sm text-indigo-800 dark:text-indigo-200">
                    <strong>Note:</strong> You can now record new service and maintenance activities using the "Record Service" button above.
                </p>
            </div>

            {/* Create Service Modal */}
            {showCreateModal && (
                <ServiceRecordForm
                    initialData={editingService}
                    onClose={() => {
                        setShowCreateModal(false);
                        setEditingService(null);
                    }}
                    onSuccess={() => {
                        fetchServices();
                        setSuccess(editingService ? 'Service record updated successfully!' : 'Service record created successfully!');
                        setTimeout(() => setSuccess(''), 3000);
                    }}
                />
            )}
        </div>
    );
};

export default ServiceMaintenance;
