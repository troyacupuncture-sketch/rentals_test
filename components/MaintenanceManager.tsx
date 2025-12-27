
import React, { useState } from 'react';
import { AppState, MaintenanceEntry } from '../types';
import { Hammer, ClipboardList, Plus, Trash2, Calendar, MapPin, Send } from 'lucide-react';

interface MaintenanceManagerProps {
  state: AppState;
  updateState: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
}

export const MaintenanceManager: React.FC<MaintenanceManagerProps> = ({ state, updateState }) => {
  const [newNotes, setNewNotes] = useState<Record<string, string>>({});

  const handleAddNote = (houseId: string) => {
    const noteText = newNotes[houseId]?.trim();
    if (!noteText) return;

    const newEntry: MaintenanceEntry = {
      id: `m-${Date.now()}`,
      text: noteText,
      date: new Date().toISOString().split('T')[0]
    };

    const updatedHouses = state.houses.map(h => {
      if (h.id === houseId) {
        return {
          ...h,
          maintenanceLog: [newEntry, ...(h.maintenanceLog || [])]
        };
      }
      return h;
    });

    updateState('houses', updatedHouses);
    setNewNotes(prev => ({ ...prev, [houseId]: '' }));
  };

  const handleDeleteNote = (houseId: string, noteId: string) => {
    if (!window.confirm("Delete this maintenance record?")) return;

    const updatedHouses = state.houses.map(h => {
      if (h.id === houseId) {
        return {
          ...h,
          maintenanceLog: (h.maintenanceLog || []).filter(entry => entry.id !== noteId)
        };
      }
      return h;
    });

    updateState('houses', updatedHouses);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Maintenance Records</h3>
          <p className="text-sm text-slate-500">Log repairs, checks, and property upkeep</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {state.houses.map(house => (
          <div key={house.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
            {/* House Header */}
            <div className="p-5 bg-slate-50 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-600 shadow-sm">
                  <MapPin size={18} />
                </div>
                <h4 className="font-bold text-slate-800 truncate max-w-[250px]">{house.address}</h4>
              </div>
              <div className="bg-slate-200/50 px-2 py-1 rounded text-[10px] font-black text-slate-500 uppercase">
                {house.maintenanceLog?.length || 0} Entries
              </div>
            </div>
            
            {/* Scrollable Log Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
              {(house.maintenanceLog || []).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                   <ClipboardList size={48} className="text-slate-300 mb-2" />
                   <p className="text-sm font-bold text-slate-400 italic">No maintenance history recorded.</p>
                </div>
              ) : (
                house.maintenanceLog?.map(entry => (
                  <div key={entry.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm group relative hover:border-emerald-100 transition-all">
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-black text-slate-500 uppercase">
                        <Calendar size={10} />
                        {entry.date}
                      </div>
                      <button 
                        onClick={() => handleDeleteNote(house.id, entry.id)}
                        className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{entry.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Note Input Footer */}
            <div className="p-4 bg-white border-t mt-auto">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder="Quick log a repair or task..." 
                    value={newNotes[house.id] || ''}
                    onChange={e => setNewNotes(prev => ({ ...prev, [house.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAddNote(house.id)}
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                    <Hammer size={14} />
                  </div>
                </div>
                <button 
                  onClick={() => handleAddNote(house.id)}
                  disabled={!newNotes[house.id]?.trim()}
                  className="bg-emerald-600 text-white p-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-600/10"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {state.houses.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
             <MapPin size={48} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400 font-bold italic">Add a property first to start logging maintenance.</p>
          </div>
        )}
      </div>
    </div>
  );
};
