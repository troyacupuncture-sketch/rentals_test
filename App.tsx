
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  DollarSign, 
  Hammer, 
  Eye, 
  Package, 
  Menu,
  X,
  TrendingUp,
  Settings,
  RefreshCcw,
  UserPlus
} from 'lucide-react';
import { AppState } from './types';
import { INITIAL_STATE } from './constants';
import { Dashboard } from './components/Dashboard';
import { PropertyManager } from './components/PropertyManager';
import { TenantManager } from './components/TenantManager';
import { PaymentManager } from './components/PaymentManager';
import { LeadManager } from './components/LeadManager';
import { MaintenanceManager } from './components/MaintenanceManager';
import { ShowingManager } from './components/ShowingManager';
import { InventoryManager } from './components/InventoryManager';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('proptrack_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: Ensure leads exists
      if (!parsed.leads) parsed.leads = [];
      return parsed;
    }
    return INITIAL_STATE;
  });

  useEffect(() => {
    localStorage.setItem('proptrack_data', JSON.stringify(state));
  }, [state]);

  const updateState = <K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const clearAllData = () => {
    if (window.confirm("ARE YOU SURE? This will permanently delete all houses, tenants, payments, and records. This cannot be undone.")) {
      setState(INITIAL_STATE);
      localStorage.removeItem('proptrack_data');
      setActiveTab('dashboard');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'properties', label: 'Properties', icon: Home },
    { id: 'tenants', label: 'Tenants', icon: Users },
    { id: 'leads', label: 'Leads', icon: UserPlus },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'showings', label: 'Showings', icon: Eye },
    { id: 'maintenance', label: 'Maintenance', icon: Hammer },
    { id: 'inventory', label: 'Lent Items', icon: Package },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full bg-slate-900 text-white flex flex-col z-50 transition-all duration-300 ease-in-out shadow-2xl ${
          isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="text-emerald-400" />
            PropTrack
          </h1>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-slate-800 rounded-lg text-slate-400"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${
                activeTab === item.id 
                  ? 'bg-slate-800 text-emerald-400 border-r-4 border-emerald-400' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
          
          <div className="mt-8 px-6 pb-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">System</div>
          <button
            onClick={clearAllData}
            className="w-full flex items-center gap-3 px-6 py-3 text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <RefreshCcw size={20} />
            <span className="font-medium">Reset All Data</span>
          </button>
        </nav>
        
        <div className="p-6 text-xs text-slate-500 border-t border-slate-800">
          v1.1.0 &copy; 2024 PropTrack Inc.
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ease-in-out min-w-0 ${
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        }`}
      >
        <div className="p-4 md:p-8">
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
                aria-label="Toggle Sidebar"
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 capitalize leading-tight">{activeTab}</h2>
                <p className="text-sm text-slate-500">Managing Partner Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-slate-700">Administrator</p>
                  <p className="text-xs text-slate-400">Operations Lead</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border-2 border-white shadow-sm">
                  AD
               </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard state={state} onNavigate={handleTabClick} />}
            {activeTab === 'properties' && <PropertyManager state={state} updateState={updateState} />}
            {activeTab === 'tenants' && <TenantManager state={state} updateState={updateState} />}
            {activeTab === 'leads' && <LeadManager state={state} updateState={updateState} />}
            {activeTab === 'payments' && <PaymentManager state={state} updateState={updateState} />}
            {activeTab === 'maintenance' && <MaintenanceManager state={state} updateState={updateState} />}
            {activeTab === 'showings' && <ShowingManager state={state} updateState={updateState} />}
            {activeTab === 'inventory' && <InventoryManager state={state} updateState={updateState} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
