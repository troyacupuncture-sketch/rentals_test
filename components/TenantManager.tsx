
import React, { useState, useEffect } from 'react';
import { Tenant, AppState, PaymentPurpose, Payment } from '../types';
import { 
  Plus, 
  User, 
  Phone, 
  Calendar, 
  Trash2, 
  Pencil, 
  X, 
  Archive, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Key, 
  Wallet,
  Warehouse,
  CheckCircle2,
  Circle,
  History,
  DollarSign
} from 'lucide-react';

interface TenantManagerProps {
  state: AppState;
  updateState: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  onQuickPay?: (tenantId: string, houseId: string) => void;
}

export const TenantManager: React.FC<TenantManagerProps> = ({ state, updateState, onQuickPay }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [historyTenantId, setHistoryTenantId] = useState<string | null>(null);
  const [historyYear, setHistoryYear] = useState<number>(new Date().getFullYear());
  
  const initialFormState: Partial<Tenant> = {
    name: '',
    phone: '',
    job: '',
    moveInDate: '',
    moveInTime: '10:00',
    durationMonths: 12,
    moveOutDate: '',
    securityDeposit: 0,
    baseRent: 0,
    hasGarage: false,
    garagePrice: 0,
    monthlyRent: 0,
    rentDueDate: 1,
    houseId: '',
    roomId: '',
    isActive: true
  };

  const [formData, setFormData] = useState<Partial<Tenant>>(initialFormState);

  useEffect(() => {
    const base = formData.baseRent || 0;
    const gPrice = formData.hasGarage ? (formData.garagePrice || 0) : 0;
    const total = base + gPrice;
    if (formData.monthlyRent !== total) {
      setFormData(prev => ({ ...prev, monthlyRent: total }));
    }
  }, [formData.baseRent, formData.hasGarage, formData.garagePrice]);

  const toggleGroup = (houseId: string) => {
    setExpandedGroups(prev => ({ ...prev, [houseId]: !prev[houseId] }));
  };

  const handleAddOrUpdateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.houseId || !formData.roomId) return alert("Select house and room");

    if (editingId) {
      const updatedTenants = state.tenants.map(t => t.id === editingId ? { ...t, ...formData } as Tenant : t);
      updateState('tenants', updatedTenants);
    } else {
      const tenant: Tenant = { ...formData as Tenant, id: `t-${Date.now()}` };
      updateState('tenants', [...state.tenants, tenant]);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setShowForm(false);
    setEditingId(null);
  };

  const handleEditClick = (e: React.MouseEvent, tenant: Tenant) => {
    e.stopPropagation();
    setFormData({ ...tenant });
    setEditingId(tenant.id);
    setShowForm(true);
  };

  const handleArchiveTenant = (e: React.MouseEvent, tenantId: string, archive: boolean) => {
    e.stopPropagation();
    const action = archive ? "archive" : "reactivate";
    if (window.confirm(`Are you sure you want to ${action} this tenant?`)) {
      updateState('tenants', state.tenants.map(t => 
        t.id === tenantId ? { ...t, isActive: !archive } : t
      ));
    }
  };

  const handleDeleteTenant = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Permanently delete this tenant? Records will be removed.")) {
      updateState('tenants', state.tenants.filter(t => t.id !== id));
    }
  };

  const getFeeStatus = (tenant: Tenant) => {
    const tenantPayments = state.payments.filter(p => p.tenantId === tenant.id);
    return {
      holding: tenantPayments.some(p => p.purposes.includes(PaymentPurpose.HOLDING_FEE)),
      security: tenantPayments.some(p => p.purposes.includes(PaymentPurpose.SECURITY_DEPOSIT)),
      firstMonth: tenantPayments.some(p => 
        p.purposes.includes(PaymentPurpose.FIRST_MONTH) || 
        (p.purposes.includes(PaymentPurpose.RENT) && p.dueMonth === tenant.moveInDate.substring(0, 7))
      )
    };
  };

  const historyTenant = state.tenants.find(t => t.id === historyTenantId);
  const tenantPayments = state.payments.filter(p => p.tenantId === historyTenantId);
  const years = Array.from(new Set<number>(state.payments.map(p => parseInt(p.dueMonth.split('-')[0]))))
    .sort((a, b) => b - a);
  if (years.length === 0) years.push(new Date().getFullYear());

  const months = [
    { name: 'Jan', code: '01' }, { name: 'Feb', code: '02' }, { name: 'Mar', code: '03' },
    { name: 'Apr', code: '04' }, { name: 'May', code: '05' }, { name: 'Jun', code: '06' },
    { name: 'Jul', code: '07' }, { name: 'Aug', code: '08' }, { name: 'Sep', code: '09' },
    { name: 'Oct', code: '10' }, { name: 'Nov', code: '11' }, { name: 'Dec', code: '12' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Tenant Management</h3>
          <p className="text-sm text-slate-500">Portfolio residency and occupancy tracking</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => setShowArchived(!showArchived)} className={`flex-1 sm:flex-none px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${showArchived ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {showArchived ? <RotateCcw size={18} /> : <Archive size={18} />}
            {showArchived ? 'Active Residents' : 'Archives'}
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all">
            <Plus size={18} /> Add Resident
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAddOrUpdateTenant} className="bg-white p-6 rounded-2xl border-2 border-emerald-100 shadow-xl space-y-6 animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center border-b pb-4">
            <h4 className="font-bold text-slate-800 text-lg">{editingId ? `Edit: ${formData.name}` : 'Register New Resident'}</h4>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-4">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Personal</h5>
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Full Name</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm" placeholder="Jane Doe" /></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Phone</label><input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm" placeholder="555-0123" /></div>
             </div>
             <div className="space-y-4">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Placement</h5>
                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">Property</label>
                   <select required value={formData.houseId} onChange={e => setFormData({...formData, houseId: e.target.value, roomId: ''})} className="w-full p-2.5 border rounded-xl text-sm">
                      <option value="">Select Property</option>
                      {state.houses.map(h => <option key={h.id} value={h.id}>{h.address}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">Room</label>
                   <select required disabled={!formData.houseId} value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm">
                      <option value="">Select Room</option>
                      {state.rooms.filter(r => r.houseId === formData.houseId).map(r => (
                        <option key={r.id} value={r.id} disabled={state.tenants.some(t => t.roomId === r.id && t.isActive && t.id !== editingId)}>
                          {r.name}
                        </option>
                      ))}
                   </select>
                </div>
             </div>
             <div className="space-y-4">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Finance</h5>
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Base Rent ($)</label><input required type="number" value={formData.baseRent} onChange={e => setFormData({...formData, baseRent: parseFloat(e.target.value)})} className="w-full p-2.5 border rounded-xl text-sm" /></div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                   <p className="text-[10px] font-black text-emerald-600 uppercase">Monthly Total</p>
                   <p className="text-xl font-black text-emerald-800">${(formData.monthlyRent || 0).toLocaleString()}</p>
                </div>
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button type="button" onClick={resetForm} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancel</button>
            <button type="submit" className="px-10 py-2.5 bg-emerald-600 text-white rounded-xl font-black shadow-lg">Save Profile</button>
          </div>
        </form>
      )}

      {historyTenantId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b flex items-center justify-between bg-slate-50">
                <h3 className="font-black text-slate-800 uppercase">Ledger: {historyTenant?.name}</h3>
                <button onClick={() => setHistoryTenantId(null)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {months.map(m => {
                   const monthKey = `${historyYear}-${m.code}`;
                   const monthPayments = tenantPayments.filter(p => p.dueMonth === monthKey);
                   const total = monthPayments.reduce((s, p) => s + p.amount, 0);
                   return (
                     <div key={m.code} className={`p-4 rounded-2xl border ${total > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{m.name} {historyYear}</p>
                        <p className="text-xl font-black text-slate-800">${total.toLocaleString()}</p>
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>
      )}

      <div className="space-y-4">
        {state.houses.map(house => {
          const tenants = state.tenants.filter(t => t.houseId === house.id && t.isActive === !showArchived);
          if (tenants.length === 0) return null;
          return (
            <div key={house.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b flex items-center gap-3">
                <MapPin size={16} className="text-slate-400" />
                <h4 className="font-bold text-slate-800 text-sm">{house.address}</h4>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tenants.map(tenant => {
                  const room = state.rooms.find(r => r.id === tenant.roomId);
                  const feeStatus = getFeeStatus(tenant);
                  return (
                    <div key={tenant.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-200 transition-all relative group shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><User size={20} /></div>
                           <div>
                              <h5 className="font-bold text-slate-800 text-sm">{tenant.name}</h5>
                              <p className="text-[10px] font-black text-slate-400 uppercase">{room?.name || 'Unit'}</p>
                           </div>
                        </div>
                        <div className="flex gap-1">
                           <button onClick={(e) => handleEditClick(e, tenant)} className="p-1.5 text-slate-400 hover:text-emerald-600"><Pencil size={14} /></button>
                           <button onClick={(e) => handleArchiveTenant(e, tenant.id, !showArchived)} className="p-1.5 text-slate-400 hover:text-amber-600"><Archive size={14} /></button>
                           <button onClick={(e) => handleDeleteTenant(e, tenant.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-4">
                         {['Holding', 'Security', '1st Month'].map((f, i) => {
                           const paid = i === 0 ? feeStatus.holding : i === 1 ? feeStatus.security : feeStatus.firstMonth;
                           return (
                             <div key={f} className={`flex flex-col items-center py-2 rounded-xl border ${paid ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                <span className="text-[8px] font-black uppercase mb-1">{f}</span>
                                {paid ? <CheckCircle2 size={10} /> : <Circle size={10} />}
                             </div>
                           );
                         })}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 mb-6 px-1">
                         <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Due Day</span>
                            <span className="font-bold text-slate-700">{tenant.rentDueDate}th</span>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Monthly</span>
                            <span className="font-black text-emerald-600 text-lg">${tenant.monthlyRent.toLocaleString()}</span>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                         <button 
                            onClick={() => setHistoryTenantId(tenant.id)} 
                            className="flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-50 text-slate-600 text-[10px] font-black uppercase hover:bg-slate-100 transition-all"
                         >
                            <History size={12} /> Ledger
                         </button>
                         {onQuickPay && (
                           <button 
                              onClick={() => onQuickPay(tenant.id, house.id)} 
                              className="flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase hover:bg-emerald-700 shadow-md transition-all shadow-emerald-600/10"
                           >
                              <DollarSign size={12} /> Pay Rent
                           </button>
                         )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
