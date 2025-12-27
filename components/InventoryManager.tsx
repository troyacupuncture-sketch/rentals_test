
import React, { useState } from 'react';
import { AppState, LentItem } from '../types';
import { Package, Plus, User, CheckCircle, Trash2, Clock, AlertTriangle, Calendar, Search, X } from 'lucide-react';

interface InventoryManagerProps {
  state: AppState;
  updateState: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ state, updateState }) => {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [newItem, setNewItem] = useState<Partial<LentItem>>({
    tenantId: '',
    itemName: '',
    lentDate: new Date().toISOString().split('T')[0]
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.itemName || !newItem.tenantId) return;
    
    const item: LentItem = { 
      id: `li-${Date.now()}`,
      itemName: newItem.itemName || '',
      tenantId: newItem.tenantId || '',
      lentDate: newItem.lentDate || new Date().toISOString().split('T')[0]
    };
    
    updateState('lentItems', [...state.lentItems, item]);
    setShowForm(false);
    setNewItem({ tenantId: '', itemName: '', lentDate: new Date().toISOString().split('T')[0] });
  };

  const markReturned = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    updateState('lentItems', state.lentItems.map(i => i.id === id ? { ...i, returnDate: today } : i));
  };

  const filtered = state.lentItems.filter(i => 
    i.itemName.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => (a.returnDate ? 1 : -1));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Lent Items Log</h2>
          <p className="text-slate-500 text-sm">Monitor property assets issued to residents.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 shadow-xl"
        >
          <Plus size={20} /> Record Lending
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search items..." 
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-500/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-2xl relative animate-in slide-in-from-top duration-300">
          <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X /></button>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Item Description</label>
              <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" placeholder="e.g. Spare Key Set" value={newItem.itemName} onChange={e => setNewItem({...newItem, itemName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Resident</label>
              <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={newItem.tenantId} onChange={e => setNewItem({...newItem, tenantId: e.target.value})}>
                <option value="">Select Resident</option>
                {state.tenants.filter(t => t.isActive).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Date</label>
              <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={newItem.lentDate} onChange={e => setNewItem({...newItem, lentDate: e.target.value})} />
            </div>
            <div className="md:col-span-3 pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-bold text-slate-500">Cancel</button>
              <button type="submit" className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-lg">Track Asset</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(item => {
          const tenant = state.tenants.find(t => t.id === item.tenantId);
          return (
            <div key={item.id} className={`bg-white p-6 rounded-[2rem] border-2 transition-all relative overflow-hidden ${item.returnDate ? 'border-slate-50 opacity-60' : 'border-slate-100 hover:shadow-xl hover:-translate-y-1'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${item.returnDate ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                  <Package size={24} />
                </div>
                {!item.returnDate && (
                  <button onClick={() => markReturned(item.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Return Item">
                    <CheckCircle size={22} />
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-black text-slate-800 text-lg leading-tight">{item.itemName}</h4>
                  <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase mt-1">
                    <User size={12} /> {tenant?.name || 'Unknown'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 flex items-center gap-1.5 uppercase">
                    <Calendar size={12} /> {item.lentDate}
                  </span>
                  {item.returnDate ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase">Returned {item.returnDate}</span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-black flex items-center gap-1.5 uppercase">
                      <Clock size={12} /> Outstanding
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
