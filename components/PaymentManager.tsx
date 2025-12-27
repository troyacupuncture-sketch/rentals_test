
import React, { useState, useMemo, useEffect } from 'react';
import { Payment, AppState, PaymentPurpose, House, Tenant } from '../types';
import { 
  Plus, 
  Search, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  X, 
  Phone, 
  MapPin,
  Tag,
  Key,
  ShieldCheck,
  Zap,
  Wallet,
  Check,
  Percent,
  Clock
} from 'lucide-react';

interface PaymentManagerProps {
  state: AppState;
  updateState: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
}

const getLocalDateStrings = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return { full: `${year}-${month}-${day}`, monthOnly: `${year}-${month}` };
};

export const PaymentManager: React.FC<PaymentManagerProps> = ({ state, updateState }) => {
  const dates = getLocalDateStrings();
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedHouses, setExpandedHouses] = useState<Record<string, boolean>>({});
  
  const [filters, setFilters] = useState({ 
    searchText: '', 
    phone: '', 
    month: '', 
    houseId: '',
    purpose: ''
  });

  const [newPayment, setNewPayment] = useState<Partial<Payment>>({
    tenantId: '', 
    houseId: state.houses[0]?.id || '', 
    method: 'Cash', 
    amount: 0, 
    date: dates.full, 
    dueMonth: dates.monthOnly, 
    purposes: [],
    isProrated: false,
    proratedDays: 0
  });

  // Automatically select the first active tenant when the house changes
  useEffect(() => {
    if (newPayment.houseId) {
      const houseTenants = state.tenants.filter(t => t.isActive && t.houseId === newPayment.houseId);
      if (houseTenants.length > 0 && !houseTenants.some(t => t.id === newPayment.tenantId)) {
        setNewPayment(prev => ({ ...prev, tenantId: houseTenants[0].id }));
      }
    }
  }, [newPayment.houseId, state.tenants, newPayment.tenantId]);

  // Recalculate suggested total when purposes or tenant changes
  useEffect(() => {
    if (!newPayment.tenantId) return;
    const tenant = state.tenants.find(t => t.id === newPayment.tenantId);
    if (!tenant) return;

    // We don't auto-calculate prorated amounts (per user request), but we do set the full amounts as a base
    let total = 0;
    const currentPurposes = newPayment.purposes || [];

    if (currentPurposes.includes(PaymentPurpose.RENT) || currentPurposes.includes(PaymentPurpose.FIRST_MONTH)) {
      total += tenant.monthlyRent;
    }
    if (currentPurposes.includes(PaymentPurpose.SECURITY_DEPOSIT)) {
      total += tenant.securityDeposit;
    }
    if (currentPurposes.includes(PaymentPurpose.HOLDING_FEE)) {
      total += 500; 
    }

    setNewPayment(prev => {
      const updates: Partial<Payment> = {};
      // Only auto-update amount if we aren't in prorated mode (user wants to manually enter prorated amounts)
      if (!prev.isProrated) {
        updates.amount = total;
      }
      
      // Auto-set billing month if "First Month Rent" is active
      if (currentPurposes.includes(PaymentPurpose.FIRST_MONTH)) {
        updates.dueMonth = tenant.moveInDate.substring(0, 7);
      }
      return { ...prev, ...updates };
    });
  }, [newPayment.purposes, newPayment.tenantId, newPayment.isProrated, state.tenants]);

  const toggleHouse = (houseId: string) => setExpandedHouses(prev => ({ ...prev, [houseId]: !prev[houseId] }));

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayment.tenantId || !newPayment.houseId) return alert("Please select a tenant");
    if (!newPayment.purposes || newPayment.purposes.length === 0) return alert("Select at least one purpose for this transaction");

    const payment: Payment = { ...newPayment as Payment, id: `p-${Date.now()}` };
    updateState('payments', [...state.payments, payment]);
    setShowAddForm(false);
    setExpandedHouses(prev => ({ ...prev, [payment.houseId]: true }));
    
    // Reset form
    const currentDates = getLocalDateStrings();
    setNewPayment({ 
      tenantId: '', 
      houseId: state.houses[0]?.id || '', 
      method: 'Cash', 
      amount: 0, 
      date: currentDates.full, 
      dueMonth: currentDates.monthOnly, 
      purposes: [],
      isProrated: false,
      proratedDays: 0
    });
  };

  const togglePurpose = (purpose: PaymentPurpose) => {
    setNewPayment(prev => {
      const current = prev.purposes || [];
      const exists = current.includes(purpose);
      const next = exists ? current.filter(p => p !== purpose) : [...current, purpose];
      return { ...prev, purposes: next };
    });
  };

  const handleDeletePayment = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm("ARE YOU SURE? This will permanently remove this record from the financial ledger.")) {
      updateState('payments', state.payments.filter(p => p.id !== id));
    }
  };

  const clearFilters = () => {
    setFilters({ searchText: '', phone: '', month: '', houseId: '', purpose: '' });
  };

  const filteredAndGroupedPayments = useMemo(() => {
    const filtered = state.payments.filter(payment => {
      const tenant = state.tenants.find(t => t.id === payment.tenantId);
      const matchesText = !filters.searchText || tenant?.name.toLowerCase().includes(filters.searchText.toLowerCase());
      const matchesPhone = !filters.phone || tenant?.phone.includes(filters.phone);
      const matchesMonth = !filters.month || payment.dueMonth === filters.month;
      const matchesHouse = !filters.houseId || payment.houseId === filters.houseId;
      const matchesPurpose = !filters.purpose || payment.purposes.includes(filters.purpose as PaymentPurpose);
      return matchesText && matchesPhone && matchesMonth && matchesHouse && matchesPurpose;
    });

    const groups: Record<string, { house: House; payments: Payment[]; total: number }> = {};
    const housesToInclude = filters.houseId ? state.houses.filter(h => h.id === filters.houseId) : state.houses;
    
    housesToInclude.forEach(h => { groups[h.id] = { house: h, payments: [], total: 0 }; });
    filtered.forEach(p => {
      if (groups[p.houseId]) {
        groups[p.houseId].payments.push(p);
        groups[p.houseId].total += p.amount;
      }
    });
    
    Object.values(groups).forEach(g => { g.payments.sort((a, b) => b.date.localeCompare(a.date)); });
    return groups;
  }, [state.payments, state.tenants, state.houses, filters]);

  const activeHouseTenants = useMemo(() => {
    return state.tenants.filter(t => t.isActive && t.houseId === newPayment.houseId);
  }, [state.tenants, newPayment.houseId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h3 className="text-xl font-bold text-slate-800">Financial Ledger</h3><p className="text-sm text-slate-500">Record and audit portfolio transactions</p></div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-emerald-700 shadow-md transition-all"><Plus size={18} /> New Receipt Entry</button>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Tenant..." value={filters.searchText} onChange={e => setFilters({...filters, searchText: e.target.value})} className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Phone..." value={filters.phone} onChange={e => setFilters({...filters, phone: e.target.value})} className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="month" value={filters.month} onChange={e => setFilters({...filters, month: e.target.value})} className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select value={filters.houseId} onChange={e => setFilters({...filters, houseId: e.target.value})} className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-emerald-500/20">
              <option value="">All Houses</option>
              {state.houses.map(h => <option key={h.id} value={h.id}>{h.address.split(',')[0]}</option>)}
            </select>
          </div>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select value={filters.purpose} onChange={e => setFilters({...filters, purpose: e.target.value})} className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-emerald-500/20">
              <option value="">All Types</option>
              {Object.values(PaymentPurpose).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        {(filters.searchText || filters.phone || filters.month || filters.houseId || filters.purpose) && (
          <button onClick={clearFilters} className="text-xs text-red-500 font-bold hover:underline flex items-center gap-1">
            <X size={12} /> Clear all filters
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleAddPayment} className="bg-white p-6 rounded-2xl border-2 border-emerald-100 shadow-xl space-y-6 animate-in zoom-in-95">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Wallet size={20} /></div>
              <h4 className="font-bold text-slate-800 text-lg">Record Transaction</h4>
            </div>
            <button type="button" onClick={() => setShowAddForm(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><X size={20} className="text-slate-400" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">1. Property & Resident</label>
                  <div className="grid grid-cols-1 gap-3">
                    <select required value={newPayment.houseId} onChange={e => setNewPayment({...newPayment, houseId: e.target.value, tenantId: ''})} className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20">
                      <option value="" disabled>Choose House</option>
                      {state.houses.map(h => <option key={h.id} value={h.id}>{h.address}</option>)}
                    </select>
                    <select required disabled={!newPayment.houseId} value={newPayment.tenantId} onChange={e => setNewPayment({...newPayment, tenantId: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50">
                      <option value="" disabled>Choose Resident</option>
                      {activeHouseTenants.map(t => {
                        const room = state.rooms.find(r => r.id === t.roomId);
                        return <option key={t.id} value={t.id}>{t.name} ({room?.name || 'Unit'})</option>;
                      })}
                    </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Amount Received ($)</label>
                    <input required type="number" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: parseFloat(e.target.value)})} className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    {!newPayment.isProrated && <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">* Calculated from purposes</p>}
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Date Paid</label>
                    <input type="date" value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
               </div>

               {/* Prorated Toggle and Days Input */}
               <div className="pt-2">
                 <div className="flex items-center gap-4">
                    <button 
                      type="button"
                      onClick={() => setNewPayment(prev => ({ ...prev, isProrated: !prev.isProrated }))}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all ${newPayment.isProrated ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      <Percent size={14} /> Prorated Payment
                    </button>
                    {newPayment.isProrated && (
                      <div className="flex-1 animate-in slide-in-from-left-2 fade-in">
                        <div className="relative">
                          <input 
                            type="number" 
                            placeholder="Days..." 
                            value={newPayment.proratedDays || ''} 
                            onChange={e => setNewPayment(prev => ({ ...prev, proratedDays: parseInt(e.target.value) || 0 }))}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                          <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>
                    )}
                 </div>
                 {newPayment.isProrated && (
                   <p className="text-[10px] text-emerald-600 font-bold mt-2 italic px-1">Recording this as a prorated credit for {newPayment.proratedDays} days.</p>
                 )}
               </div>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">2. Transaction Purposes (Select Multiple)</label>
                  <div className="grid grid-cols-2 gap-2">
                     <button 
                       type="button" 
                       onClick={() => togglePurpose(PaymentPurpose.FIRST_MONTH)}
                       className={`flex items-center justify-between px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all ${newPayment.purposes?.includes(PaymentPurpose.FIRST_MONTH) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                     >
                       <div className="flex items-center gap-2"><Key size={14} /> 1st Month</div>
                       {newPayment.purposes?.includes(PaymentPurpose.FIRST_MONTH) && <Check size={14} />}
                     </button>
                     <button 
                       type="button" 
                       onClick={() => togglePurpose(PaymentPurpose.SECURITY_DEPOSIT)}
                       className={`flex items-center justify-between px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all ${newPayment.purposes?.includes(PaymentPurpose.SECURITY_DEPOSIT) ? 'bg-slate-800 border-slate-800 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                     >
                       <div className="flex items-center gap-2"><ShieldCheck size={14} /> Security</div>
                       {newPayment.purposes?.includes(PaymentPurpose.SECURITY_DEPOSIT) && <Check size={14} />}
                     </button>
                     <button 
                       type="button" 
                       onClick={() => togglePurpose(PaymentPurpose.HOLDING_FEE)}
                       className={`flex items-center justify-between px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all ${newPayment.purposes?.includes(PaymentPurpose.HOLDING_FEE) ? 'bg-amber-600 border-amber-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                     >
                       <div className="flex items-center gap-2"><Zap size={14} /> Holding</div>
                       {newPayment.purposes?.includes(PaymentPurpose.HOLDING_FEE) && <Check size={14} />}
                     </button>
                     <button 
                       type="button" 
                       onClick={() => togglePurpose(PaymentPurpose.RENT)}
                       className={`flex items-center justify-between px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all ${newPayment.purposes?.includes(PaymentPurpose.RENT) ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                     >
                       <div className="flex items-center gap-2"><Wallet size={14} /> Standard Rent</div>
                       {newPayment.purposes?.includes(PaymentPurpose.RENT) && <Check size={14} />}
                     </button>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Billing Month</label>
                    <input type="month" value={newPayment.dueMonth} onChange={e => setNewPayment({...newPayment, dueMonth: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Payment Method</label>
                    <select value={newPayment.method} onChange={e => setNewPayment({...newPayment, method: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20">
                      <option>Cash</option>
                      <option>Zelle</option>
                      <option>Venmo</option>
                      <option>CashApp</option>
                      <option>Check</option>
                    </select>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
            <button type="submit" className="px-10 py-2.5 bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all">Confirm & Post Receipt</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {Object.values(filteredAndGroupedPayments).map(({ house, payments, total }) => (
          <div key={house.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className={`p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${expandedHouses[house.id] ? 'bg-slate-50/50' : ''}`} onClick={() => toggleHouse(house.id)}>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-100 text-slate-400 rounded-lg"><MapPin size={20} /></div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{house.address}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{payments.length} Receipts Registered</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400">Total Collected</p>
                  <p className="font-black text-emerald-600 text-lg">${total.toLocaleString()}</p>
                </div>
                {expandedHouses[house.id] ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
              </div>
            </div>

            {expandedHouses[house.id] && (
              <div className="overflow-x-auto border-t">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                    <tr>
                      <th className="px-6 py-3">Resident</th>
                      <th className="px-6 py-3">Month</th>
                      <th className="px-6 py-3">Purposes Included</th>
                      <th className="px-6 py-3">Method</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                      <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map(payment => {
                      const tenant = state.tenants.find(t => t.id === payment.tenantId);
                      return (
                        <tr key={payment.id} className="hover:bg-slate-50/50 group transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-sm text-slate-700">{tenant?.name || 'Former Resident'}</p>
                            <p className="text-[10px] text-slate-400">{payment.date}</p>
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-slate-500">{payment.dueMonth}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {payment.purposes.map((p, idx) => (
                                <span key={idx} className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                                  p === PaymentPurpose.FIRST_MONTH ? 'bg-indigo-600 text-white' :
                                  p === PaymentPurpose.RENT ? 'bg-emerald-100 text-emerald-700' : 
                                  p === PaymentPurpose.HOLDING_FEE ? 'bg-amber-100 text-amber-700' :
                                  p === PaymentPurpose.SECURITY_DEPOSIT ? 'bg-slate-800 text-white' :
                                  'bg-slate-100 text-slate-500'
                                }`}>
                                  {p}
                                </span>
                              ))}
                              {payment.isProrated && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-0.5">
                                  <Percent size={8} /> {payment.proratedDays} Days
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-medium">{payment.method}</td>
                          <td className="px-6 py-4 text-right">
                             <p className="font-black text-slate-800 text-sm">${payment.amount.toLocaleString()}</p>
                             {payment.isProrated && <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Prorated Rate</p>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={(e) => handleDeletePayment(e, payment.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      );
                    })}
                    {payments.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">No recorded receipts for this property.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
