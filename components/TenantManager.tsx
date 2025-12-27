
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
  TrendingUp,
  DollarSign
} from 'lucide-react';

interface TenantManagerProps {
  state: AppState;
  updateState: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
}

export const TenantManager: React.FC<TenantManagerProps> = ({ state, updateState }) => {
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
    e.preventDefault();
    setFormData({ ...tenant });
    setEditingId(tenant.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleArchiveTenant = (e: React.MouseEvent, tenantId: string, archive: boolean) => {
    e.stopPropagation();
    e.preventDefault();
    const action = archive ? "archive" : "reactivate";
    if (window.confirm(`Are you sure you want to ${action} this tenant?`)) {
      updateState('tenants', state.tenants.map(t => 
        t.id === tenantId ? { ...t, isActive: !archive } : t
      ));
    }
  };

  const handleDeleteTenant = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
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
  
  // Fix: Explicitly typing the Set as number to prevent sorting errors on unknown types when state.payments is empty
  const years = Array.from(new Set<number>(state.payments.map(p => parseInt(p.dueMonth.split('-')[0]))))
    .sort((a, b) => b - a);
  if (!years.includes(new Date().getFullYear())) years.push(new Date().getFullYear());

  const months = [
    { name: 'January', code: '01' }, { name: 'February', code: '02' }, { name: 'March', code: '03' },
    { name: 'April', code: '04' }, { name: 'May', code: '05' }, { name: 'June', code: '06' },
    { name: 'July', code: '07' }, { name: 'August', code: '08' }, { name: 'September', code: '09' },
    { name: 'October', code: '10' }, { name: 'November', code: '11' }, { name: 'December', code: '12' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Occupancy Management</h3>
          <p className="text-sm text-slate-500">Managing portfolio residents</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => setShowArchived(!showArchived)} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-all ${showArchived ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {showArchived ? <RotateCcw size={18} /> : <Archive size={18} />}
            {showArchived ? 'View Active' : 'View Archived'}
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex-1 sm:flex-none bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
            <Plus size={18} /> Add Tenant
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAddOrUpdateTenant} className="bg-white p-6 rounded-2xl border-2 border-emerald-100 shadow-xl space-y-6 animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center border-b pb-4">
            <h4 className="font-bold text-slate-800 text-lg">{editingId ? `Edit: ${formData.name}` : 'Register New Tenant'}</h4>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"><X size={20} /></button>
          </div>
          
          <div className="space-y-6">
            {/* Form Fields */}
            <div className="space-y-3">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={12} /> Personal Information
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Full Name</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Jane Doe" /></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Phone Number</label><input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="555-0123" /></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Occupation</label><input type="text" value={formData.job || ''} onChange={e => setFormData({...formData, job: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Software Engineer" /></div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={12} /> Unit Assignment
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Property</label>
                  <select required value={formData.houseId} onChange={e => setFormData({...formData, houseId: e.target.value, roomId: ''})} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20">
                    <option value="">Select Property</option>
                    {state.houses.map(h => <option key={h.id} value={h.id}>{h.address}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Room</label>
                  <select required disabled={!formData.houseId} value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20">
                    <option value="">Select Room</option>
                    {state.rooms.filter(r => r.houseId === formData.houseId).map(r => {
                      const isTaken = state.tenants.some(t => t.roomId === r.id && t.isActive && t.id !== editingId);
                      return <option key={r.id} value={r.id} disabled={isTaken}>{r.name} {isTaken ? '(Occupied)' : ''}</option>;
                    })}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Warehouse size={12} /> Garage Selection
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.hasGarage} 
                      onChange={e => setFormData({...formData, hasGarage: e.target.checked})}
                      className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-bold text-slate-700">Include Garage Space?</span>
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Garage Monthly Price ($)</label>
                  <input 
                    type="number" 
                    disabled={!formData.hasGarage}
                    value={formData.garagePrice} 
                    onChange={e => setFormData({...formData, garagePrice: parseFloat(e.target.value) || 0})} 
                    className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-200" 
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Key size={12} /> Lease & Financial Terms
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Move-in Date</label><input required type="date" value={formData.moveInDate} onChange={e => setFormData({...formData, moveInDate: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" /></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Lease Ends</label><input required type="date" value={formData.moveOutDate} onChange={e => setFormData({...formData, moveOutDate: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" /></div>
                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">Base Rent ($)</label>
                   <input required type="number" value={formData.baseRent} onChange={e => setFormData({...formData, baseRent: parseFloat(e.target.value) || 0})} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><Wallet size={12} /> Rent Due Day</label>
                  <select required value={formData.rentDueDate} onChange={e => setFormData({...formData, rentDueDate: parseInt(e.target.value)})} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Security Deposit ($)</label><input type="number" value={formData.securityDeposit} onChange={e => setFormData({...formData, securityDeposit: parseFloat(e.target.value)})} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" /></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Initial Duration (Months)</label><input type="number" value={formData.durationMonths} onChange={e => setFormData({...formData, durationMonths: parseInt(e.target.value)})} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" /></div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 flex flex-col justify-center">
                   <p className="text-[10px] font-black text-emerald-600 uppercase">Total Monthly Obligation</p>
                   <p className="text-xl font-black text-emerald-800">${(formData.monthlyRent || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button type="button" onClick={resetForm} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
            <button type="submit" className="px-10 py-2.5 bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all">Save Resident Profile</button>
          </div>
        </form>
      )}

      {/* Payment History Modal */}
      {historyTenantId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
              <div className="p-6 border-b flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <History size={24} className="text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Payment Ledger: {historyTenant?.name}</h3>
                    <p className="text-xs text-slate-500 font-bold">Comprehensive transaction audit</p>
                  </div>
                </div>
                <button onClick={() => setHistoryTenantId(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <div className="p-6 bg-slate-50/50 border-b flex flex-wrap items-center justify-between gap-4">
                 <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    <Calendar size={16} className="text-slate-400" />
                    <select 
                      value={historyYear} 
                      onChange={(e) => setHistoryYear(parseInt(e.target.value))}
                      className="text-sm font-bold text-slate-700 outline-none"
                    >
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                 </div>
                 <div className="flex gap-4">
                    <div className="text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase">YTD Collected</p>
                       <p className="text-lg font-black text-emerald-600">
                         ${tenantPayments.filter(p => p.dueMonth.startsWith(historyYear.toString())).reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                       </p>
                    </div>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {months.map(m => {
                      const monthKey = `${historyYear}-${m.code}`;
                      const paymentsForMonth = tenantPayments.filter(p => p.dueMonth === monthKey);
                      const totalForMonth = paymentsForMonth.reduce((sum, p) => sum + p.amount, 0);
                      const isFuture = new Date(monthKey + '-01') > new Date();

                      return (
                        <div key={m.code} className={`p-4 rounded-2xl border transition-all ${totalForMonth > 0 ? 'bg-emerald-50/30 border-emerald-100' : isFuture ? 'bg-slate-50/50 border-slate-100 opacity-50' : 'bg-rose-50/30 border-rose-100'}`}>
                           <div className="flex justify-between items-start mb-3">
                              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">{m.name}</h5>
                              {totalForMonth > 0 ? (
                                <span className="bg-emerald-500 text-white p-1 rounded-full shadow-lg shadow-emerald-500/20"><CheckCircle2 size={12} /></span>
                              ) : !isFuture && (
                                <span className="bg-rose-500 text-white p-1 rounded-full shadow-lg shadow-rose-500/20"><X size={12} /></span>
                              )}
                           </div>
                           <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black text-slate-800">${totalForMonth.toLocaleString()}</span>
                              <span className="text-[10px] font-bold text-slate-400">received</span>
                           </div>
                           {paymentsForMonth.length > 0 && (
                             <div className="mt-3 pt-3 border-t border-slate-200/50 space-y-2">
                                {paymentsForMonth.map(p => (
                                  <div key={p.id} className="flex justify-between items-center text-[10px]">
                                     <div className="flex flex-wrap gap-1">
                                        {p.purposes.map((pr, i) => (
                                          <span key={i} className="px-1 py-0.5 bg-slate-800 text-white rounded text-[8px] font-black uppercase">{pr}</span>
                                        ))}
                                     </div>
                                     <span className="font-bold text-slate-500">{p.date}</span>
                                  </div>
                                ))}
                             </div>
                           )}
                        </div>
                      );
                    })}
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="space-y-4">
        {state.houses.map(house => {
          const tenantsInHouse = state.tenants.filter(t => t.houseId === house.id && t.isActive === !showArchived);
          if (tenantsInHouse.length === 0) return null;
          const isExpanded = expandedGroups[house.id] !== false; 

          return (
            <div key={house.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-all">
              <div className="p-4 bg-slate-50 border-b flex items-center justify-between cursor-pointer group" onClick={() => toggleGroup(house.id)}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 group-hover:border-emerald-200 transition-all">
                    <MapPin size={18} className="text-slate-400 group-hover:text-emerald-500 transition-all" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">{house.address}</h4>
                </div>
                {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
              </div>
              
              {isExpanded && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tenantsInHouse.map(tenant => {
                    const room = state.rooms.find(r => r.id === tenant.roomId);
                    const feeStatus = getFeeStatus(tenant);
                    
                    return (
                      <div 
                        key={tenant.id} 
                        onClick={() => setHistoryTenantId(tenant.id)}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group overflow-hidden hover:border-emerald-200 hover:shadow-xl transition-all cursor-pointer"
                      >
                        <div className="absolute top-3 right-3 flex items-center gap-1 z-[60]">
                          <button type="button" onClick={(e) => handleEditClick(e, tenant)} className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 rounded-lg shadow-sm transition-all pointer-events-auto"><Pencil size={14} /></button>
                          <button type="button" onClick={(e) => handleArchiveTenant(e, tenant.id, !showArchived)} className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-200 rounded-lg shadow-sm transition-all pointer-events-auto"><Archive size={14} /></button>
                          <button type="button" onClick={(e) => handleDeleteTenant(e, tenant.id)} className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 rounded-lg shadow-sm transition-all pointer-events-auto"><Trash2 size={14} /></button>
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                          <div className={`p-2.5 rounded-2xl ${showArchived ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}>
                            <User size={20} />
                          </div>
                          <div>
                            <h5 className={`font-bold text-sm ${showArchived ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{tenant.name}</h5>
                            <div className="flex items-center gap-2">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{room?.name || 'Assigned Room'}</p>
                               {tenant.hasGarage && (
                                 <span className="flex items-center gap-0.5 text-[8px] font-black uppercase text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                   <Warehouse size={8} /> Garage
                                 </span>
                               )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mb-4">
                           <div className={`flex flex-col items-center gap-1 p-2 rounded-xl flex-1 border transition-all ${feeStatus.holding ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm shadow-emerald-500/10' : 'bg-slate-50 border-slate-100 text-slate-300'}`} title="Holding Fee Paid">
                              <span className="text-[9px] font-black uppercase tracking-tighter">Holding</span>
                              {feeStatus.holding ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                           </div>
                           <div className={`flex flex-col items-center gap-1 p-2 rounded-xl flex-1 border transition-all ${feeStatus.security ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm shadow-emerald-500/10' : 'bg-slate-50 border-slate-100 text-slate-300'}`} title="Security Deposit Paid">
                              <span className="text-[9px] font-black uppercase tracking-tighter">Security</span>
                              {feeStatus.security ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                           </div>
                           <div className={`flex flex-col items-center gap-1 p-2 rounded-xl flex-1 border transition-all ${feeStatus.firstMonth ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm shadow-emerald-500/10' : 'bg-slate-50 border-slate-100 text-slate-300'}`} title="First Month Rent Paid">
                              <span className="text-[9px] font-black uppercase tracking-tighter">1st Month</span>
                              {feeStatus.firstMonth ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                           </div>
                        </div>

                        <div className="space-y-2.5 text-xs text-slate-500 pt-4 border-t">
                          <div className="flex items-center gap-2"><Phone size={12} className="text-slate-300" /><span>{tenant.phone}</span></div>
                          <div className="flex items-center gap-2 font-bold text-emerald-600"><Wallet size={12} /><span>Rent Due: {tenant.rentDueDate}{tenant.rentDueDate === 1 ? 'st' : tenant.rentDueDate === 2 ? 'nd' : tenant.rentDueDate === 3 ? 'rd' : 'th'} of month</span></div>
                          <div className="mt-4 flex justify-between bg-slate-50 p-3 rounded-xl text-center">
                            <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase">Base</p>
                               <p className="font-bold text-slate-700">${(tenant.baseRent || tenant.monthlyRent).toLocaleString()}</p>
                            </div>
                            {tenant.hasGarage && (
                              <>
                                <div className="w-px h-8 bg-slate-200"></div>
                                <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase">Garage</p>
                                  <p className="font-bold text-blue-600">${tenant.garagePrice.toLocaleString()}</p>
                                </div>
                              </>
                            )}
                            <div className="w-px h-8 bg-slate-200"></div>
                            <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase">Total</p>
                               <p className="font-black text-emerald-600">${tenant.monthlyRent.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase group-hover:text-emerald-500 transition-colors">
                           <History size={12} /> View Payment History
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {state.tenants.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400 italic">No resident records found.</div>
        )}
      </div>
    </div>
  );
};
