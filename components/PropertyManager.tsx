
import React, { useState } from 'react';
import { House, Room, AppState } from '../types';
import { Plus, Home, Calculator, Landmark, ShieldCheck, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface PropertyManagerProps {
  state: AppState;
  updateState: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
}

export const PropertyManager: React.FC<PropertyManagerProps> = ({ state, updateState }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedHouse, setExpandedHouse] = useState<string | null>(null);

  const [newHouse, setNewHouse] = useState<Partial<House>>({
    address: '',
    roomCount: 1,
    mortgagePayment: 0,
    bank: '',
    mortgageBalance: 0,
    paymentDate: 1,
    insuranceAmount: 0,
    insuranceRenewalDate: ''
  });

  const handleAddHouse = (e: React.FormEvent) => {
    e.preventDefault();
    const houseId = `h-${Date.now()}`;
    const house: House = {
      ...newHouse as House,
      id: houseId
    };

    const newRooms: Room[] = Array.from({ length: house.roomCount }).map((_, i) => ({
      id: `r-${houseId}-${i}`,
      houseId: houseId,
      name: `Room ${i + 1}`
    }));

    updateState('houses', [...state.houses, house]);
    updateState('rooms', [...state.rooms, ...newRooms]);
    setShowAddForm(false);
    setNewHouse({
      address: '',
      roomCount: 1,
      mortgagePayment: 0,
      bank: '',
      mortgageBalance: 0,
      paymentDate: 1,
      insuranceAmount: 0,
      insuranceRenewalDate: ''
    });
  };

  const handleDeleteHouse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to remove this property? The house will be deleted, but payment records will be preserved and tenants will be archived.")) {
      // 1. Archive tenants associated with this house
      const updatedTenants = state.tenants.map(t => 
        t.houseId === id ? { ...t, isActive: false } : t
      );
      
      // 2. Remove house and rooms
      updateState('houses', state.houses.filter(h => h.id !== id));
      updateState('rooms', state.rooms.filter(r => r.houseId !== id));
      updateState('tenants', updatedTenants);
      
      if (expandedHouse === id) setExpandedHouse(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Portfolio</h3>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors"
        >
          <Plus size={18} /> Add Property
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddHouse} className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg space-y-4 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <input 
                required
                type="text" 
                value={newHouse.address} 
                onChange={e => setNewHouse({...newHouse, address: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Number of Rooms</label>
              <input 
                required
                type="number" 
                value={newHouse.roomCount} 
                onChange={e => setNewHouse({...newHouse, roomCount: parseInt(e.target.value)})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bank</label>
              <input 
                type="text" 
                value={newHouse.bank} 
                onChange={e => setNewHouse({...newHouse, bank: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mortgage Payment</label>
              <input 
                type="number" 
                value={newHouse.mortgagePayment} 
                onChange={e => setNewHouse({...newHouse, mortgagePayment: parseFloat(e.target.value)})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Balance Owed</label>
              <input 
                type="number" 
                value={newHouse.mortgageBalance} 
                onChange={e => setNewHouse({...newHouse, mortgageBalance: parseFloat(e.target.value)})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Insurance Amount</label>
              <input 
                type="number" 
                value={newHouse.insuranceAmount} 
                onChange={e => setNewHouse({...newHouse, insuranceAmount: parseFloat(e.target.value)})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Insurance Renewal</label>
              <input 
                type="date" 
                value={newHouse.insuranceRenewalDate} 
                onChange={e => setNewHouse({...newHouse, insuranceRenewalDate: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Save Property</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {state.houses.map(house => {
          const houseRooms = state.rooms.filter(r => r.houseId === house.id);
          const isExpanded = expandedHouse === house.id;
          
          return (
            <div key={house.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-all">
              <div 
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                onClick={() => setExpandedHouse(isExpanded ? null : house.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-lg text-slate-600">
                    <Home size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">{house.address}</h4>
                    <p className="text-slate-500 flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1"><Calculator size={14} /> {house.roomCount} Rooms</span>
                      <span className="flex items-center gap-1"><Landmark size={14} /> {house.bank}</span>
                      <span className="flex items-center gap-1"><ShieldCheck size={14} /> Next: {house.insuranceRenewalDate || 'N/A'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                   <div className="text-right">
                     <p className="text-xs text-slate-400 uppercase font-bold">Mortgage</p>
                     <p className="font-semibold text-slate-700">${house.mortgagePayment}/mo</p>
                   </div>
                   <button 
                     onClick={(e) => handleDeleteHouse(house.id, e)}
                     className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                     title="Delete Property"
                   >
                     <Trash2 size={18} />
                   </button>
                   {isExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-6 bg-slate-50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h5 className="font-bold text-slate-700 mb-3 border-b pb-2">Room Management</h5>
                    <div className="space-y-2">
                      {houseRooms.map(room => {
                        const tenant = state.tenants.find(t => t.roomId === room.id && t.isActive);
                        return (
                          <div key={room.id} className="bg-white p-3 rounded border border-slate-200 flex justify-between items-center">
                            <span className="font-medium text-slate-700">{room.name}</span>
                            {tenant ? (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Occupied: {tenant.name}</span>
                            ) : (
                              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Vacant</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <h5 className="font-bold text-slate-700 mb-3 border-b pb-2">Financial Snapshot</h5>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white p-4 rounded-lg border border-slate-200">
                         <p className="text-xs text-slate-400 uppercase font-bold">Balance Owed</p>
                         <p className="text-xl font-bold text-slate-800">${house.mortgageBalance.toLocaleString()}</p>
                       </div>
                       <div className="bg-white p-4 rounded-lg border border-slate-200">
                         <p className="text-xs text-slate-400 uppercase font-bold">Insurance</p>
                         <p className="text-xl font-bold text-slate-800">${house.insuranceAmount.toLocaleString()}/yr</p>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {state.houses.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400">No properties in your portfolio yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
