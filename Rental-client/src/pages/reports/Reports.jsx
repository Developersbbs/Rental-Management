import React, { useState } from 'react';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    Package,
    Users,
    Settings,
    FileText,
    PieChart,
    ChevronRight,
    Search,
    Wrench,
    LayoutDashboard
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import FinancialReports from './FinancialReports';
import RentalReportsTab from './RentalReportsTab';
import InventoryReports from './InventoryReports';
import CustomerReports from './CustomerReports';
import AnalyticsReports from './AnalyticsReports';
import ServiceReports from './ServiceReports';

const Reports = () => {
    const location = useLocation();
    const initialTab = location.state?.activeTab || 'analytics';
    const [activeTab, setActiveTab] = useState(initialTab);

    const tabs = [
        { id: 'analytics', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'financial', label: 'Financials', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'rentals', label: 'Rentals', icon: <TrendingUp className="w-4 h-4" /> },
        { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
        { id: 'customers', label: 'Customers', icon: <Users className="w-4 h-4" /> },
        { id: 'service', label: 'Service', icon: <Wrench className="w-4 h-4" /> }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'financial':
                return <FinancialReports />;
            case 'rentals':
                return <RentalReportsTab />;
            case 'inventory':
                return <InventoryReports />;
            case 'customers':
                return <CustomerReports />;
            case 'service':
                return <ServiceReports />;
            case 'analytics':
            default:
                return <AnalyticsReports />;
        }
    };

    return (
        <div className="min-h-screen pb-12">
            {/* Header Section */}
            <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 backdrop-blur-sm shadow-sm group hover:scale-110 transition-transform">
                        <BarChart3 className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">Business Intelligence</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Real-time operational insights & performance metrics</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-10 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-inner flex overflow-x-auto no-scrollbar max-w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-shrink-0 flex items-center justify-center gap-2.5 py-3 px-6 rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 ${activeTab === tab.id
                            ? 'bg-white dark:bg-slate-800 text-primary shadow-xl scale-[1.05] ring-1 ring-slate-200 dark:ring-slate-700'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/30 dark:hover:bg-slate-800/30'
                            }`}
                    >
                        <span className={`transition-colors ${activeTab === tab.id ? 'text-primary' : 'text-slate-400'}`}>
                            {tab.icon}
                        </span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="min-h-[600px]">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default Reports;
