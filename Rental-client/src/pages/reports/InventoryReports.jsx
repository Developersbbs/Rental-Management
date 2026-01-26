import React, { useState, useEffect } from 'react';
import {
    Boxes,
    BarChart3,
    Wrench,
    AlertTriangle,
    Download,
    Package,
    CheckCircle2,
    Clock,
    Activity,
    TrendingUp,
    ShieldAlert,
    ChevronDown,
    Filter,
    Calendar,
    Search
} from 'lucide-react';
import {
    getInventoryStatusReport,
    getItemUtilizationReport,
    getMaintenanceReport,
    getDamageLossReport
} from '../../services/reportService';

const InventoryReports = () => {
    const [activeReport, setActiveReport] = useState('status');
    const [loading, setLoading] = useState(false);
    const [inventoryStatus, setInventoryStatus] = useState(null);
    const [utilization, setUtilization] = useState(null);
    const [maintenance, setMaintenance] = useState(null);
    const [damageLoss, setDamageLoss] = useState(null);

    useEffect(() => {
        fetchReportData();
    }, [activeReport]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            switch (activeReport) {
                case 'status':
                    const statusRes = await getInventoryStatusReport();
                    if (statusRes.success) setInventoryStatus(statusRes.data);
                    break;
                case 'utilization':
                    const utilRes = await getItemUtilizationReport();
                    if (utilRes.success) setUtilization(utilRes.data);
                    break;
                case 'maintenance':
                    const maintRes = await getMaintenanceReport();
                    if (maintRes.success) setMaintenance(maintRes.data);
                    break;
                case 'damage':
                    const damageRes = await getDamageLossReport();
                    if (damageRes.success) setDamageLoss(damageRes.data);
                    break;
            }
        } catch (error) {
            console.error('Error fetching inventory report:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const renderInventoryStatus = () => {
        if (!inventoryStatus) return null;

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-primary/50 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 group-hover:bg-primary group-hover:text-white transition-all">
                                <Package className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Assets</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">{inventoryStatus.summary?.total || 0}</h3>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-emerald-500/50 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-emerald-600/70 dark:text-emerald-500/70 text-xs font-bold uppercase tracking-wider mb-1">Available</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">{inventoryStatus.summary?.available || 0}</h3>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-indigo-500/50 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                <Activity className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-indigo-600/70 dark:text-indigo-500/70 text-xs font-bold uppercase tracking-wider mb-1">Currently Rented</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">{inventoryStatus.summary?.rented || 0}</h3>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-amber-500/50 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all">
                                <Wrench className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-amber-600/70 dark:text-amber-500/70 text-xs font-bold uppercase tracking-wider mb-1">In Maintenance</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">{inventoryStatus.summary?.maintenance || 0}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-700/50">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Status Distribution
                        </h3>
                    </div>
                    <div className="p-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {inventoryStatus.statusDistribution?.map((status) => (
                                <div key={status._id} className="relative p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{status._id}</div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white">{status.count}</div>
                                    <div className="absolute bottom-4 right-4 text-slate-200 dark:text-slate-800 font-black text-4xl select-none uppercase -rotate-12 pointer-events-none">
                                        {status._id?.charAt(0)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-700/50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Boxes className="w-5 h-5 text-indigo-500" />
                            Comprehensive Asset Registry
                        </h3>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Filter registry..."
                                className="pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-900 border-none rounded-full text-xs font-medium focus:ring-1 focus:ring-primary w-48 transition-all"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/30">
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identifier</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset Details</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Condition</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Value Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {inventoryStatus.items?.map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <td className="px-8 py-4">
                                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
                                                {item.uniqueIdentifier}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-bold text-slate-800 dark:text-white transition-colors capitalize">{item.rentalProductId?.name || 'N/A'}</p>
                                                <p className="text-[10px] text-slate-400 font-medium italic">Type: {item.rentalProductId?.category?.name || 'Equipment'}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${item.status === 'available' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                    item.status === 'rented' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                        item.status === 'maintenance' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                            'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded capitalize">
                                                {item.condition}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-black text-slate-800 dark:text-white">{formatCurrency(item.purchaseCost)}</p>
                                                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 font-bold">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(item.purchaseDate).toLocaleDateString('en-IN')}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderUtilization = () => {
        if (!utilization) return null;

        return (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-700/50 flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">High Performing Assets</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/30">
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset Identifier</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product Catalog</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Velocity</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Yield</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {utilization.mostRented?.map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <td className="px-8 py-4">
                                            <span className="text-xs font-black text-primary bg-primary/5 px-2 py-1 rounded">
                                                {item.itemDetails?.uniqueIdentifier}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4">
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{item.product?.name}</p>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-lg font-black text-slate-900 dark:text-white">{item.rentalCount}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Rentals</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <span className="text-base font-black text-emerald-600 dark:text-emerald-500">{formatCurrency(item.totalRevenue)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-700/50 flex items-center gap-3">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Product Category Matrix</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/30">
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product Family</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Aggregate Rentals</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aggregate Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {utilization.utilizationByProduct?.map((product) => (
                                    <tr key={product._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-8 py-4">
                                            <p className="text-sm font-bold text-slate-800 dark:text-white uppercase transition-colors">{product.product?.name}</p>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-black text-slate-700 dark:text-slate-300">
                                                {product.rentalCount} Trx
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(product.totalRevenue)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderMaintenance = () => {
        if (!maintenance) return null;

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-100 dark:shadow-none transition-all hover:scale-[1.02]">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Wrench className="w-6 h-6" />
                            </div>
                            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Live Status</span>
                        </div>
                        <p className="text-amber-100 text-sm font-bold mb-1">Items Under Repair</p>
                        <h3 className="text-4xl font-black">{maintenance.summary?.inMaintenance || 0}</h3>
                        <div className="mt-6 flex items-center gap-2 text-xs text-amber-50 font-medium bg-amber-700/20 w-fit px-3 py-1 rounded-full border border-white/10">
                            <Clock className="w-3.5 h-3.5" />
                            Maintenance Queue active
                        </div>
                    </div>
                </div>

                {!maintenance.currentMaintenance || maintenance.currentMaintenance.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 transition-colors">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6 text-slate-300">
                            <ShieldAlert className="w-10 h-10" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-black text-lg uppercase tracking-tight">Zero maintenance cases</p>
                        <p className="text-slate-400 text-sm mt-1">All inventory items are currently operational</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-700/50 flex items-center gap-3">
                            <Activity className="w-5 h-5 text-amber-500" />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Active Maintenance Log</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/30">
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset #</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset Name</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Maintenance Insight</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {maintenance.currentMaintenance?.map((item) => (
                                        <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-8 py-4">
                                                <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded">
                                                    {item.uniqueIdentifier}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <p className="text-sm font-bold text-slate-800 dark:text-white uppercase">{item.rentalProductId?.name}</p>
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                    Repairing
                                                </span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">
                                                        Condition: <span className="text-amber-500">{item.condition}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 italic font-medium leading-relaxed max-w-sm">
                                                        {item.notes || 'Routine maintenance check recorded in system.'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderDamageLoss = () => {
        if (!damageLoss) return null;

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md hover:border-rose-500/30">
                        <div className="p-2.5 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-600 w-fit mb-4">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Incident Count</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{damageLoss.summary?.totalIncidents || 0}</h3>
                        <p className="text-xs font-bold text-rose-600 uppercase tracking-tighter">Reported Cases</p>
                    </div>

                    <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-rose-500/30 transition-all bg-gradient-to-br from-rose-500 to-rose-600 text-white">
                        <div className="p-2.5 bg-white/20 rounded-xl w-fit mb-4">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <p className="text-rose-100 text-[10px] font-black uppercase tracking-widest mb-1">Financial Impact</p>
                        <h3 className="text-3xl font-black mb-2">{formatCurrency(damageLoss.summary?.totalCost)}</h3>
                        <p className="text-xs font-bold text-rose-100 uppercase tracking-tighter italic font-black">Historical Loss</p>
                    </div>

                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-900 group">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Damages</span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white transition-colors">{damageLoss.summary?.currentDamaged || 0}</h3>
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-600 uppercase tracking-tighter">Requires Repair</span>
                            <div className="h-1 w-12 bg-amber-100 dark:bg-amber-900/50 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-900 group">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-1.5 h-6 bg-rose-600 rounded-full"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Missing Assets</span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white transition-colors">{damageLoss.summary?.currentMissing || 0}</h3>
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-600 uppercase tracking-tighter">Critical Loss</span>
                            <div className="h-1 w-12 bg-rose-100 dark:bg-rose-900/50 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-600 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {damageLoss.damageDetails?.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-700/50 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Detailed Incident Chronology</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/30">
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction Ref</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Entity</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Affected Asset</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Outcome</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Debit Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {damageLoss.damageDetails?.map((detail, index) => (
                                        <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-8 py-4">
                                                <span className="text-xs font-black text-slate-900 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                                                    #{detail.rentalId?.slice(-6).toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <p className="text-sm font-bold text-slate-800 dark:text-white">{detail.customer?.name}</p>
                                            </td>
                                            <td className="px-8 py-4">
                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 font-mono tracking-tight">{detail.item?.uniqueIdentifier}</p>
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${detail.condition === 'damaged'
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                    }`}>
                                                    {detail.condition}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-black text-rose-600 dark:text-rose-500">{formatCurrency(detail.cost)}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{detail.returnTime ? new Date(detail.returnTime).toLocaleDateString('en-IN') : 'N/A'}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const handleExport = () => {
        let csvContent = [];
        let filename = `inventory_report_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`;

        if (activeReport === 'status' && inventoryStatus) {
            csvContent.push('--- Inventory Status Report ---');
            csvContent.push(`Total Items,${inventoryStatus.summary?.total}`);
            csvContent.push(`Available,${inventoryStatus.summary?.available}`);
            csvContent.push(`Rented,${inventoryStatus.summary?.rented}`);
            csvContent.push(`In Maintenance,${inventoryStatus.summary?.maintenance}`);
            csvContent.push('');
            csvContent.push('Identifier,Product,Status,Condition,Purchase Date,Purchase Cost');
            inventoryStatus.items?.forEach(item => {
                csvContent.push(`${item.uniqueIdentifier},${item.rentalProductId?.name || 'N/A'},${item.status},${item.condition},${new Date(item.purchaseDate).toLocaleDateString()},${item.purchaseCost}`);
            });
        } else if (activeReport === 'utilization' && utilization) {
            csvContent.push('--- Item Utilization Report ---');
            csvContent.push('--- Most Rented Items ---');
            csvContent.push('Item,Product,Rental Count,Total Revenue');
            utilization.mostRented?.forEach(item => {
                csvContent.push(`${item.itemDetails?.uniqueIdentifier},${item.product?.name},${item.rentalCount},${item.totalRevenue}`);
            });
            csvContent.push('');
            csvContent.push('--- Product Type Performance ---');
            csvContent.push('Product,Total Rentals,Total Revenue');
            utilization.utilizationByProduct?.forEach(product => {
                csvContent.push(`${product.product?.name},${product.rentalCount},${product.totalRevenue}`);
            });
        } else if (activeReport === 'maintenance' && maintenance) {
            csvContent.push('--- Maintenance Report ---');
            csvContent.push(`Items in Maintenance,${maintenance.summary?.inMaintenance}`);
            csvContent.push('');
            csvContent.push('Identifier,Product,Condition,Notes');
            maintenance.currentMaintenance?.forEach(item => {
                csvContent.push(`${item.uniqueIdentifier},${item.rentalProductId?.name},${item.condition},${item.notes || 'N/A'}`);
            });
        } else if (activeReport === 'damage' && damageLoss) {
            csvContent.push('--- Damage & Loss Report ---');
            csvContent.push(`Total Incidents,${damageLoss.summary?.totalIncidents}`);
            csvContent.push(`Total Cost,${damageLoss.summary?.totalCost}`);
            csvContent.push(`Currently Damaged,${damageLoss.summary?.currentDamaged}`);
            csvContent.push(`Currently Missing,${damageLoss.summary?.currentMissing}`);
            csvContent.push('');
            csvContent.push('Rental ID,Customer,Item,Condition,Cost,Return Date');
            damageLoss.damageDetails?.forEach(detail => {
                csvContent.push(`${detail.rentalId},${detail.customer?.name},${detail.item?.uniqueIdentifier},${detail.condition},${detail.cost},${detail.returnTime ? new Date(detail.returnTime).toLocaleDateString() : 'N/A'}`);
            });
        }

        if (csvContent.length > 0) {
            const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="space-y-8 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4 transition-all animate-in slide-in-from-left-4 duration-500">
                    <div className="p-3 bg-primary/10 rounded-3xl backdrop-blur-sm border border-primary/20">
                        <Boxes className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Inventory Intelligence</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Lifecycle management & asset performance monitoring</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 animate-in slide-in-from-right-4 duration-500">
                    <button
                        onClick={handleExport}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all font-black text-xs flex items-center gap-2 active:scale-95 shadow-lg shadow-emerald-200 dark:shadow-none"
                    >
                        <Download className="w-4 h-4" />
                        Export Census
                    </button>
                </div>
            </div>

            <div className="flex p-1.5 bg-slate-100/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner max-w-3xl overflow-x-auto no-scrollbar backdrop-blur-md">
                {[
                    { id: 'status', icon: Package, label: 'Asset Status' },
                    { id: 'utilization', icon: BarChart3, label: 'Utilization' },
                    { id: 'maintenance', icon: Wrench, label: 'Maintenance' },
                    { id: 'damage', icon: ShieldAlert, label: 'Loss & Damage' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveReport(tab.id)}
                        className={`flex-shrink-0 flex items-center justify-center gap-3 py-3 px-6 rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 ${activeReport === tab.id
                                ? 'bg-white dark:bg-slate-800 text-primary shadow-xl scale-[1.02] transform'
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeReport === tab.id ? 'text-primary' : 'text-slate-400'}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="relative min-h-[500px]">
                {loading && (
                    <div className="absolute inset-0 z-50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[3px] flex flex-col items-center justify-center rounded-[32px] overflow-hidden">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full border-t-2 border-primary animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Boxes className="w-8 h-8 text-primary/50 animate-pulse" />
                            </div>
                        </div>
                        <p className="mt-8 text-xs font-black text-primary uppercase tracking-[0.4em] animate-pulse">Scanning Inventory Pool...</p>
                    </div>
                )}

                {!loading && activeReport === 'status' && renderInventoryStatus()}
                {!loading && activeReport === 'utilization' && renderUtilization()}
                {!loading && activeReport === 'maintenance' && renderMaintenance()}
                {!loading && activeReport === 'damage' && renderDamageLoss()}
            </div>
        </div>
    );
};

export default InventoryReports;
