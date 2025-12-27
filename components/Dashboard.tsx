
import React, { useMemo } from 'react';
import { AppState, PaymentPurpose } from '../types';
import { 
  DollarSign, Home, TrendingUp, CheckCircle2, 
  ArrowRight, Users, Package, AlertCircle, Clock
} from 'lucide-react';

interface DashboardProps {
  state: AppState;
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate }) => {
  const stats = useMemo(() => {
    const totalRevenue = state.payments.reduce((acc, p) => acc + p.amount, 0);
    const activeTenants = state.tenants.filter(t => t.isActive).length;
    const totalExpected = state.tenants.filter(t => t.isActive).reduce((acc, t) => acc + t.monthlyRent, 0);
    const collectionProgress = totalExpected > 0 ? (totalRevenue / (totalExpected * 1.2)) * 100 : 0; // Normalized for demo
    const pendingItems = state.lentItems.filter(i => !i.returnDate).length;
    
    return { totalRevenue, activeTenants, totalExpected, collectionProgress, pendingItems };
  }, [state]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Revenue" 
          value={`$${stats.totalRevenue.toLocaleString()}`} 
          icon={<DollarSign />} 
          color="emerald" 
          onClick={() => onNavigate('payments')} 
        />
        <StatCard 
          label="Active Residents" 
          value={stats.activeTenants} 
          icon={<Users />} 
          color="blue" 
          onClick={() => onNavigate('tenants')} 
        />
        <StatCard 
          label="Lent Assets" 
          value={stats.pendingItems} 
          icon={<Package />} 
          color="amber" 
          onClick={() => onNavigate('inventory')} 
        />
        <StatCard 
          label="Portfolio Units" 
          value={state.houses.length} 
          icon={<Home />} 
          color="indigo" 
          onClick={() => onNavigate('properties')} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
           <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800">Collection Progress</h3>
                <p className="text-sm text-slate-500 font-medium">Tracking monthly rent targets across portfolio</p>
              </div>
              <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl font-black text-sm">
                 ${stats.totalExpected.toLocaleString()}/mo Target
              </div>
           </div>
           
           <div className="space-y-8">
              <div className="relative pt-2">
                 <div className="flex justify-between mb-4">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Collected</span>
                    <span className="text-lg font-black text-emerald-600">{Math.round(stats.collectionProgress)}%</span>
                 </div>
                 <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000 ease-out" 
                      style={{ width: `${Math.min(100, stats.collectionProgress)}%` }} 
                    />
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Transaction</p>
                   {state.payments.length > 0 ? (
                     <p className="font-bold text-slate-700">${state.payments[0].amount} received {state.payments[0].date}</p>
                   ) : (
                     <p className="font-bold text-slate-300 italic">No payments recorded</p>
                   )}
                </div>
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Projected ROI</p>
                   <p className="font-bold text-emerald-600 flex items-center gap-2">
                     <TrendingUp size={16} /> Stable +8.4%
                   </p>
                </div>
              </div>
           </div>
        </div>

        <div className="bg-[#0F172A] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
           <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-400" /> Critical Alerts
           </h3>
           <div className="space-y-4">
              {stats.pendingItems > 0 ? (
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                   <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                     <Clock size={10} /> Outstanding Assets
                   </p>
                   <p className="text-sm font-medium">{stats.pendingItems} items are currently with residents. Check return dates.</p>
                </div>
              ) : (
                <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                   <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                     <CheckCircle2 size={10} /> Asset Shield
                   </p>
                   <p className="text-sm font-medium">All property assets have been successfully returned.</p>
                </div>
              )}
              
              <button 
                onClick={() => onNavigate('inventory')}
                className="w-full mt-4 py-3 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                Review Items <ArrowRight size={14} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color, onClick }: any) => {
  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100'
  };

  return (
    <button onClick={onClick} className="bg-white p-6 rounded-3xl border border-slate-200 text-left hover:shadow-xl hover:-translate-y-1 transition-all group active:scale-95 w-full">
      <div className={`p-3 rounded-2xl mb-4 w-fit border shadow-sm ${colors[color]}`}>{React.cloneElement(icon, { size: 24 })}</div>
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</h4>
      <p className="text-3xl font-black text-slate-800 leading-none">{value}</p>
    </button>
  );
};
