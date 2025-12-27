
import React, { useState } from 'react';
import { Payment, AppState, PaymentPurpose } from '../types';
import { Plus, Search, DollarSign, Check, Copy, Trash2, X, MapPin, Banknote, CreditCard, Wallet } from 'lucide-react';

interface PaymentManagerProps {
  state: AppState;
  updateState: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
}

export const PaymentManager: React.FC<PaymentManagerProps> = ({ state, updateState }) => {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [copyId, setCopyId] = useState<string | null>(null);

  const [newPayment, setNewPayment] = useState<Partial<Payment>>({
    tenantId: '',
    amount: 0,
    method: 'Transfer',
    dueMonth: new Date().toISOString().substring(0, 7),
    date: new Date().toISOString().split('T')[0],
    purposes: [PaymentPurpose.RENT]
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayment.tenantId || !newPayment.amount) return;
    
    const tenant = state.tenants.find(t => t.id === newPayment.tenantId);
    const payment: Payment = {
      ...newPayment as Payment,
      id: `p-${Date.now()}`,
      houseId: tenant?.houseId || ''
    };
    
    updateState('payments', [payment, ...state.payments]);
    setShowForm(false);
  };

  const copyReceipt = (p: Payment) => {
    const tenant = state.tenants.find(t => t.id === p.tenantId);
    const text = `PropTrack Receipt\nResident: ${tenant?.name}\nMonth: ${p.dueMonth}\nAmount: $${p.amount}\nDate: ${p.date}`;
    navigator.clipboard.writeText(text);
    setCopyId(p.id);
    setTimeout(() => setCopyId(null), 2000);
  };

  const filtered = state.payments.filter(p => {
    const t = state.tenants.find(ten => ten.id === p.tenantId);
    return t?.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Rent Ledger</h2>
          <p className="text-slate-500 text-sm">Track income and generate digital receipts.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
        >
          <Plus size={20} /> Record Payment
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search by resident name..." 
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-emerald-100 shadow-2xl relative animate-in zoom-in-95">
          <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X /></button>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Resident</label>
              <select 
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl"
                value={newPayment.tenantId}
                onChange={e => {
                  const t = state.tenants.find(ten => ten.id === e.target.value);
                  setNewPayment({...newPayment, tenantId: e.target.value, amount: t?.monthlyRent || 0})
                }}
              >
                <option value="">Select Resident</option>
                {state.tenants.filter(t => t.isActive).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>

              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount ($)</label>
              <input 
                required
                type="number"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black"
                value={newPayment.amount}
                onChange={e => setNewPayment({...newPayment, amount: parseFloat(e.target.value)})}
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Payment Month</label>
              <input 
                type="month"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl"
                value={newPayment.dueMonth}
                onChange={e => setNewPayment({...newPayment, dueMonth: e.target.value})}
              />

              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Method</label>
              <div className="flex gap-2">
                {['Transfer', 'Cash', 'Card'].map(m => (
                  <button 
                    key={m}
                    type="button"
                    onClick={() => setNewPayment({...newPayment, method: m})}
                    className={`flex-1 p-3 rounded-xl border-2 font-bold transition-all ${newPayment.method === m ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-400'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-bold text-slate-500">Cancel</button>
              <button type="submit" className="px-10 py-3 bg-emerald-600 text-white rounded-2xl font-black shadow-lg">Post Transaction</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Resident</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Month</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Amount</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(p => {
              const t = state.tenants.find(ten => ten.id === p.tenantId);
              return (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                        {p.method === 'Cash' ? <Banknote size={16} /> : p.method === 'Card' ? <CreditCard size={16} /> : <Wallet size={16} />}
                      </div>
                      <span className="font-bold text-slate-800">{t?.name || 'Archived'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase">{p.dueMonth}</span>
                  </td>
                  <td className="px-8 py-6 font-black text-emerald-600 text-lg">${p.amount.toLocaleString()}</td>
                  <td className="px-8 py-6">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => copyReceipt(p)}
                        className={`p-2 rounded-xl border flex items-center gap-2 text-[10px] font-black uppercase ${copyId === p.id ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-400 hover:text-emerald-500 border-slate-200'}`}
                      >
                        {copyId === p.id ? <Check size={14} /> : <Copy size={14} />}
                        {copyId === p.id ? 'Copied' : 'Receipt'}
                      </button>
                      <button onClick={() => updateState('payments', state.payments.filter(pay => pay.id !== p.id))} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
