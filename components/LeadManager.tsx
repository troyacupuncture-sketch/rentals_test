
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, Lead, Tenant } from '../types';
import { 
  Plus, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Home, 
  Trash2, 
  X, 
  Dog, 
  ClipboardList, 
  UserPlus, 
  Archive, 
  RotateCcw,
  Key,
  Clock,
  MapPin,
  CheckCircle,
  Warehouse
} from 'lucide-react';

interface LeadManagerProps {
  state: AppState;
  updateState: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
}

export const LeadManager: React.FC<LeadManagerProps> = ({ state, updateState }) => {
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  
  // Standard Lead form state
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: '',
    phone: '',
    email: '',
    targetMoveIn: '',
    budget: 0,
    houseId: '',
    roomId: '',
    hasPets: false,
    notes: '',
    isActive: true
  });

  // Conversion form state (Tenant-specific)
  const [conversionData, setConversionData] = useState<Partial<Tenant>>({});

  // Auto-calculate rent during conversion
  useEffect(() => {
    if (convertingLead) {
      const base = conversionData.baseRent || 0;
      const gPrice = conversionData.hasGarage ? (conversionData.garagePrice || 0) : 0;
      const total = base + gPrice;
      if (conversionData.monthlyRent !== total) {
        setConversionData(prev => ({ ...prev, monthlyRent: total }));
      }
    }
  }, [conversionData.baseRent, conversionData.hasGarage, conversionData.garagePrice, convertingLead]);

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    const lead: Lead = {
      ...newLead as Lead,
      id: `l-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isActive: true
    };
    updateState('leads', [...state.leads, lead]);
    setShowForm(false);
    setNewLead({
      name: '', phone: '', email: '', targetMoveIn: '', budget: 0, houseId: '', roomId: '', hasPets: false, notes: '', isActive: true
    });
  };

  const startConversion = (lead: Lead) => {
    setConvertingLead(lead);
    setConversionData({
      name: lead.name,
      phone: lead.phone,
      houseId: lead.houseId,
      roomId: lead.roomId,
      moveInDate: lead.targetMoveIn,
      moveInTime: '10:00',
      baseRent: lead.budget,
      hasGarage: false,
      garagePrice: 0,
      monthlyRent: lead.budget,
      durationMonths: 12,
      securityDeposit: lead.budget, // Default to one month's rent
      moveOutDate: '',
      isActive: true,
      rentDueDate: 1
    });
  };

  const handleFinishConversion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLead) return;

    // 1. Create new tenant
    const newTenant: Tenant = {
      ...conversionData as Tenant,
      id: `t-${Date.now()}`
    };

    // 2. Add tenant to state
    updateState('tenants', [...state.tenants, newTenant]);

    // 3. Mark lead as inactive/archived
    updateState('leads', state.leads.map(l => 
      l.id === convertingLead.id ? { ...l, isActive: false } : l
    ));

    // 4. Close modal
    setConvertingLead(null);
  };

  const handleToggleArchive = (id: string, currentlyActive: boolean) => {
    const action = currentlyActive ? "archive" : "reactivate";
    if (window.confirm(`Are you sure you want to ${action} this lead?`)) {
      updateState('leads', state.leads.map(l => 
        l.id === id ? { ...l, isActive: !currentlyActive } : l
      ));
    }
  };

  const handleDeleteLead = (id: string) => {
    if (window.confirm("Permanently delete this lead? This cannot be undone.")) {
      updateState('leads', state.leads.filter(l => l.id !== id));
    }
  };

  const sortedLeads = useMemo(() => {
    return [...state.leads]
      .filter(l => l.isActive === !showArchived)
      .sort((a, b) => a.targetMoveIn.localeCompare(b.targetMoveIn));
  }, [state.leads, showArchived]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Prospect Pipeline</h3>
          <p className="text-sm text-slate-500">Sorted by target move-in date</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowArchived(!showArchived)} 
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${showArchived ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {showArchived ? <RotateCcw size={18} /> : <Archive size={18} />}
            {showArchived ? 'View Active' : 'View Archived'}
          </button>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg transition-all"
          >
            <Plus size={18} /> Add Lead
          </button>
        </div>
      </div>

      {/* Conversion Modal */}
      {convertingLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-emerald-100">
                  <UserPlus size={24} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 uppercase tracking-tight">Convert Lead to Tenant</h3>
                  <p className="text-xs text-emerald-600 font-bold">Finalizing lease for {convertingLead.name}</p>
                </div>
              </div>
              <button onClick={() => setConvertingLead(null)} className="p-2 hover:bg-emerald-100 rounded-full transition-colors">
                <X size={20} className="text-emerald-800" />
              </button>
            </div>

            <form onSubmit={handleFinishConversion} className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Identity */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={12} /> Identity & Contact
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Full Name</label>
                    <input required type="text" value={conversionData.name} onChange={e => setConversionData({...conversionData, name: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Phone</label>
                    <input required type="text" value={conversionData.phone} onChange={e => setConversionData({...conversionData, phone: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm" />
                  </div>
                </div>
              </div>

              {/* Placement */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={12} /> Unit Placement
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Property</label>
                    <select required value={conversionData.houseId} onChange={e => setConversionData({...conversionData, houseId: e.target.value, roomId: ''})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm">
                      {state.houses.map(h => <option key={h.id} value={h.id}>{h.address}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Room</label>
                    <select required value={conversionData.roomId} onChange={e => setConversionData({...conversionData, roomId: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm">
                      <option value="">Select Room</option>
                      {state.rooms.filter(r => r.houseId === conversionData.houseId).map(r => {
                        const isOccupied = state.tenants.some(t => t.roomId === r.id && t.isActive);
                        return <option key={r.id} value={r.id} disabled={isOccupied}>{r.name} {isOccupied ? '(Occupied)' : ''}</option>;
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Garage */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Warehouse size={12} /> Extras
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={conversionData.hasGarage} 
                        onChange={e => setConversionData({...conversionData, hasGarage: e.target.checked})}
                        className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-bold text-slate-700">Add Garage Space?</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Garage Price ($/mo)</label>
                    <input 
                      type="number" 
                      disabled={!conversionData.hasGarage}
                      value={conversionData.garagePrice} 
                      onChange={e => setConversionData({...conversionData, garagePrice: parseFloat(e.target.value) || 0})} 
                      className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-200" 
                    />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Key size={12} /> Lease Terms
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Move-in Date</label>
                    <input required type="date" value={conversionData.moveInDate} onChange={e => setConversionData({...conversionData, moveInDate: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm" />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Lease Ends</label>
                    <input required type="date" value={conversionData.moveOutDate} onChange={e => setConversionData({...conversionData, moveOutDate: e.target.value})} className="w-full p-2.5 bg-white border-2 border-emerald-100 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Base Rent ($)</label>
                    <input required type="number" value={conversionData.baseRent} onChange={e => setConversionData({...conversionData, baseRent: parseFloat(e.target.value)})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Deposit ($)</label>
                    <input required type="number" value={conversionData.securityDeposit} onChange={e => setConversionData({...conversionData, securityDeposit: parseFloat(e.target.value)})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm" />
                  </div>
                  <div className="lg:col-span-2 flex flex-col justify-end">
                    <label className="block text-xs font-black text-emerald-600 mb-1">TOTAL MONTHLY RENT</label>
                    <div className="p-2.5 bg-emerald-600 text-white rounded-xl text-lg font-black text-center shadow-md">
                      ${(conversionData.monthlyRent || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </form>

            <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase">* Converting this lead will archive the prospect record.</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setConvertingLead(null)} className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-all">Cancel</button>
                <button onClick={handleFinishConversion} className="px-10 py-2 bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all">Create Lease</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAddLead} className="bg-white p-6 rounded-2xl border-2 border-emerald-100 shadow-xl space-y-4 animate-in zoom-in-95">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h4 className="font-bold text-slate-800">New Prospect Registration</h4>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Full Name</label>
              <input required type="text" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Phone</label>
              <input required type="text" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm" placeholder="555-0199" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Email (Optional)</label>
              <input type="email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm" placeholder="john@example.com" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Target Move-in</label>
              <input required type="date" value={newLead.targetMoveIn} onChange={e => setNewLead({...newLead, targetMoveIn: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Monthly Budget</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required type="number" value={newLead.budget} onChange={e => setNewLead({...newLead, budget: parseFloat(e.target.value)})} className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm" placeholder="800" />
              </div>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={newLead.hasPets} onChange={e => setNewLead({...newLead, hasPets: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <span className="text-sm font-bold text-slate-700 flex items-center gap-1"><Dog size={16} className="text-amber-500" /> Has Pets?</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Interested House</label>
              <select required value={newLead.houseId} onChange={e => setNewLead({...newLead, houseId: e.target.value, roomId: ''})} className="w-full p-2.5 border rounded-xl text-sm">
                <option value="">Select Property</option>
                {state.houses.map(h => <option key={h.id} value={h.id}>{h.address}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Preferred Room</label>
              <select required value={newLead.roomId} onChange={e => setNewLead({...newLead, roomId: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm">
                <option value="">Select Room</option>
                {state.rooms.filter(r => r.houseId === newLead.houseId).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-1">Notes</label>
            <textarea value={newLead.notes} onChange={e => setNewLead({...newLead, notes: e.target.value})} className="w-full p-3 border rounded-xl text-sm min-h-[100px]" placeholder="Brief context about their situation..." />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancel</button>
            <button type="submit" className="px-8 py-2 bg-emerald-600 text-white rounded-xl font-black shadow-lg">Save Lead</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedLeads.map(lead => {
          const house = state.houses.find(h => h.id === lead.houseId);
          const room = state.rooms.find(r => r.id === lead.roomId);
          return (
            <div key={lead.id} className={`bg-white p-6 rounded-2xl border ${showArchived ? 'border-slate-100 opacity-75' : 'border-slate-200'} shadow-sm relative group hover:shadow-md transition-all`}>
              <div className="absolute top-4 right-4 flex items-center gap-1">
                {!showArchived && (
                  <button 
                    onClick={() => startConversion(lead)}
                    className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white rounded-lg transition-all shadow-sm"
                    title="Convert to Tenant"
                  >
                    <UserPlus size={16} />
                  </button>
                )}
                <button 
                  onClick={() => handleToggleArchive(lead.id, lead.isActive)}
                  className="p-2 text-slate-300 hover:text-amber-500 transition-colors"
                  title={lead.isActive ? "Archive Lead" : "Reactivate Lead"}
                >
                  <Archive size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteLead(lead.id)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  title="Delete Record"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><User size={24} /></div>
                <div>
                  <h5 className="font-bold text-slate-800">{lead.name}</h5>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prospect</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone size={14} className="text-slate-400" />
                  <span>{lead.phone}</span>
                </div>
                {lead.email && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail size={14} className="text-slate-400" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-slate-600 font-bold text-emerald-600">
                  <Calendar size={14} />
                  <span>Target Move-in: {lead.targetMoveIn}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Home size={14} className="text-slate-400" />
                  <span className="truncate">{house?.address.split(',')[0]} - {room?.name}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="text-left">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Budget</p>
                  <p className="font-black text-emerald-600">${lead.budget.toLocaleString()}/mo</p>
                </div>
                <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${lead.hasPets ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Dog size={12} />
                  <span className="text-[10px] font-black uppercase">{lead.hasPets ? 'Pets' : 'No Pets'}</span>
                </div>
              </div>
              
              {lead.notes && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                   <div className="flex items-center gap-1.5 mb-1">
                     <ClipboardList size={10} className="text-slate-400" />
                     <p className="text-[9px] font-black text-slate-400 uppercase">Situation Notes</p>
                   </div>
                   <p className="text-xs text-slate-600 italic whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}
            </div>
          );
        })}
        {sortedLeads.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <UserPlus size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold italic">No prospects found in this view.</p>
          </div>
        )}
      </div>
    </div>
  );
};
