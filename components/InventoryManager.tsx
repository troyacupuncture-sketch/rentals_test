
import React, { useState } from 'react';
import { AppState, LentItem } from '../types';
import { Package, Plus, User, CheckCircle, Trash2 } from 'lucide-react';

interface InventoryManagerProps {
  state: AppState;
  updateState: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ state, updateState }) => {
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<LentItem>>({
    tenantId: '',
    itemName: '',
    lentDate: new Date().toISOString().split('T')[0]
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const item: LentItem = {
      ...newItem as LentItem,
      id: `li-${Date.now()}`
    };
    updateState('lentItems', [...state.lentItems, item]);
    setShowForm(false);
  };

  const handleReturnItem = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    updateState('lentItems', state.lentItems.map(item => 
      item.id === id ? { ...item, returnDate: today } : item
    ));
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm("Permanently delete this item record?")) {
      updateState('lentItems', state.lentItems.filter(item => item.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Lent Items Log</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} /> Record Lent Item
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddItem} className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Item Name</label>
              <input required type="text" value={newItem.itemName} onChange={e => setNewItem({...newItem, itemName: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="e.g. Space Heater, Extra Key" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lent to Tenant</label>
              <select required value={newItem.tenantId} onChange={e => setNewItem({...newItem, tenantId: e.target.value})} className="w-full p-2 border rounded-lg">
                <option value="">Select Tenant</option>
                {state.tenants.filter(t => t.isActive).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date Lent</label>
              <input type="date" value={newItem.lentDate} onChange={e => setNewItem({...newItem, lentDate: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 rounded-lg">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg">Log Item</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400 border-b">
            <tr>
              <th className="px-6 py-3">Item</th>
              <th className="px-6 py-3">Tenant</th>
              <th className="px-6 py-3">Date Lent</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.lentItems.map(item => {
              const tenant = state.tenants.find(t => t.id === item.tenantId);
              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-semibold text-slate-700">{item.itemName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{tenant?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{item.lentDate}</td>
                  <td className="px-6 py-4 text-sm">
                    {item.returnDate ? (
                      <span className="text-emerald-600 font-medium">Returned on {item.returnDate}</span>
                    ) : (
                      <span className="text-amber-600 font-medium">Outstanding</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      {!item.returnDate && (
                        <button onClick={() => handleReturnItem(item.id)} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1">
                          <CheckCircle size={14} /> Mark Returned
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {state.lentItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No items currently lent out.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
