
import React, { useState, useMemo } from 'react';
import { AppState, Showing } from '../types';
import { Plus, Eye, User, Briefcase, DollarSign, Calendar, Trash2, X, Clock, MapPin, ClipboardList, Archive, RotateCcw } from 'lucide-react';

interface ShowingManagerProps {
  state: AppState;
  updateState: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
}

export const ShowingManager: React.FC<ShowingManagerProps> = ({ state, updateState }) => {
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [newShowing, setNewShowing] = useState<Partial<Showing>>({
    name: '',
    phone: '',
    job: '',
    houseId: '',
    roomId: '',
    showingDate: new Date().toISOString().split('T')[0],
    targetMoveIn: '',
    showedPrice: 0,
    offeredPrice: 0,
    isActive: true,
    notes: ''
  });

  const handleAddShowing = (e: React.FormEvent) => {
    e.preventDefault();
    const showing: Showing = {
      ...newShowing as Showing,
      id: `s-${Date.now()}`,
      isActive: true
    };
    updateState('showings', [...state.showings, showing]);
    setShowForm(false);
    setNewShowing({
      name: '',
      phone: '',
      job: '',
      houseId: '',
      roomId: '',
      showingDate: new Date().toISOString().split('T')[0],
      targetMoveIn: '',
      showedPrice: 0,
      offeredPrice: 0,
      isActive: true,
      notes: ''
    });
  };

  const handleToggleArchive = (id: string, currentlyActive: boolean) => {
    const action = currentlyActive ? "archive" : "reactivate";
    if (window.confirm(`Move this showing to ${action}?`)) {
      updateState('showings', state.showings.map(s => 
        s.id === id ? { ...s, isActive: !currentlyActive } : s
      ));
    }
  };

  const handleDeleteShowing = (id: string) => {
    if (window.confirm("Permanently remove this showing record?")) {
      updateState('showings', state.showings.filter(s => s.id !== id));
    }
  };

  const sortedShowings = useMemo(() => {
    return [...state.showings]
      .filter(s => s.isActive === !showArchived)
      .sort((a, b) => a.showingDate.localeCompare(b.showingDate));
  }, [state.showings, showArchived]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Showing Calendar</h3>
          <p className="text-sm text-slate-500">Track scheduled tours and interest levels</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowArchived(!showArchived)} 
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${showArchived ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {showArchived ? <RotateCcw size={18} /> : <Archive size={18} />}
            {showArchived ? 'Active Tours' : 'View Past/Archived'}
          </button>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex-1 sm:flex-none bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg transition-all"
          >
            <Plus size={18} /> Schedule Showing
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAddShowing} className="bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-xl space-y-4 animate-in slide-in-from-top duration-300">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h4 className="font-bold text-slate-800">Log New Visit</h4>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-black text-slate-400 uppercase mb-1">Prospect Name</label>
               <input required type="text" value={newShowing.name} onChange={e => setNewShowing({...newShowing, name: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm" />
             </div>
             <div>
               <label className="block text-xs font-black text-slate-400 uppercase mb-1">Prospect Job</label>
               <input type="text" value={newShowing.job} onChange={e => setNewShowing({...newShowing, job: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm" />
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Property</label>
              <select required value={newShowing.houseId} onChange={e => setNewShowing({...newShowing, houseId: e.target.value, roomId: ''})} className="w-full p-2.5 border rounded-xl text-sm">
                <option value="">Select House</option>
                {state.houses.map(h => <option key={h.id} value={h.id}>{h.address}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Room</label>
              <select required value={newShowing.roomId} onChange={e => setNewShowing({...newShowing, roomId: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm">
                <option value="">Select Room</option>
                {state.rooms.filter(r => r.houseId === newShowing.houseId).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-black text-slate-400 uppercase mb-1">Showing Date</label>
               <input required type="date" value={newShowing.showingDate} onChange={e => setNewShowing({...newShowing, showingDate: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm" />
             </div>
             <div>
               <label className="block text-xs font-black text-slate-400 uppercase mb-1">Target Move-in</label>
               <input type="date" value={newShowing.targetMoveIn} onChange={e => setNewShowing({...newShowing, targetMoveIn: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm" />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-black text-slate-400 uppercase mb-1">Asking Price</label>
               <input type="number" value={newShowing.showedPrice} onChange={e => setNewShowing({...newShowing, showedPrice: parseFloat(e.target.value)})} className="w-full p-2.5 border rounded-xl text-sm" />
             </div>
             <div>
               <label className="block text-xs font-black text-slate-400 uppercase mb-1">Offered Price</label>
               <input type="number" value={newShowing.offeredPrice} onChange={e => setNewShowing({...newShowing, offeredPrice: parseFloat(e.target.value)})} className="w-full p-2.5 border rounded-xl text-sm" />
             </div>
          </div>

          <div>
             <label className="block text-xs font-black text-slate-400 uppercase mb-1">Showing Outcome / Notes</label>
             <textarea 
               value={newShowing.notes} 
               onChange={e => setNewShowing({...newShowing, notes: e.target.value})} 
               className="w-full p-2.5 border rounded-xl text-sm min-h-[80px]" 
               placeholder="Interested? Budget issues? Follow-up date?"
             />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 text-slate-500 font-bold rounded-xl">Cancel</button>
            <button type="submit" className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-black shadow-lg">Schedule Visit</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedShowings.map(s => {
          const house = state.houses.find(h => h.id === s.houseId);
          const room = state.rooms.find(r => r.id === s.roomId);
          const showingDate = new Date(s.showingDate);
          const isUpcoming = showingDate >= new Date(new Date().setHours(0,0,0,0));

          return (
            <div key={s.id} className={`bg-white p-6 rounded-2xl border ${showArchived ? 'border-slate-100 opacity-75' : isUpcoming ? 'border-indigo-100 shadow-sm' : 'border-slate-200'} relative group hover:shadow-md transition-all`}>
              <div className="absolute top-4 right-4 flex items-center gap-1">
                <button 
                  onClick={() => handleToggleArchive(s.id, s.isActive)}
                  className="p-2 text-slate-300 hover:text-amber-500 transition-colors"
                  title={s.isActive ? "Archive Tour" : "Reactivate Tour"}
                >
                  <Archive size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteShowing(s.id)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  title="Delete Log"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                 <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${isUpcoming && s.isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                    <Clock size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{s.showingDate}</span>
                 </div>
                 {isUpcoming && s.isActive && <span className="text-[10px] font-black uppercase text-indigo-500 animate-pulse">Upcoming</span>}
              </div>
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${isUpcoming && s.isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}><User size={24} /></div>
                  <div>
                    <h5 className="font-bold text-slate-800">{s.name}</h5>
                    <div className="flex items-center gap-1.5 text-slate-400">
                       <MapPin size={10} />
                       <p className="text-[10px] font-black uppercase tracking-tight truncate w-40">{house?.address.split(',')[0]} - {room?.name}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase">Offered</p>
                   <p className="text-xl font-black text-emerald-600">${s.offeredPrice.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Briefcase size={14} className="text-slate-400" /> 
                  <span className="truncate">{s.job || 'Job N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" /> 
                  <span>Target: {s.targetMoveIn || 'TBD'}</span>
                </div>
              </div>

              {s.notes && (
                <div className="mt-4 p-3 bg-indigo-50/30 rounded-xl border border-indigo-50">
                   <div className="flex items-center gap-1.5 mb-1">
                     <ClipboardList size={10} className="text-indigo-400" />
                     <p className="text-[9px] font-black text-indigo-400 uppercase">Visit Notes</p>
                   </div>
                   <p className="text-xs text-slate-600 italic whitespace-pre-wrap">{s.notes}</p>
                </div>
              )}
            </div>
          );
        })}
        {sortedShowings.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <Eye size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold italic">No visits found in this view.</p>
          </div>
        )}
      </div>
    </div>
  );
};
