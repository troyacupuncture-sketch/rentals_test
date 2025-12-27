
import React, { useMemo, useState, useRef } from 'react';
import { AppState, House, Tenant, Payment, PaymentPurpose } from '../types';
import { 
  CheckCircle2, 
  DollarSign, 
  Home, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Clock,
  CircleDashed,
  AlertTriangle,
  X,
  Info,
  ArrowRight,
  TrendingDown,
  Calendar,
  UserPlus,
  UserMinus,
  Navigation,
  ShieldCheck,
  Wallet,
  Zap,
  MapPin,
  Maximize2,
  Minimize2,
  Search,
  ZoomIn,
  RefreshCw
} from 'lucide-react';

interface DashboardProps {
  state: AppState;
  onNavigate: (tab: string) => void;
}

const getLocalMonthString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [timelineOffset, setTimelineOffset] = useState(0); 
  const [zoomLevel, setZoomLevel] = useState(1); // Smooth range: 1.0 to 8.0
  const [selectedTimelineGroup, setSelectedTimelineGroup] = useState<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const selectedMonth = useMemo(() => getLocalMonthString(viewDate), [viewDate]);

  const changeMonth = (offset: number) => {
    const next = new Date(viewDate);
    next.setMonth(next.getMonth() + offset);
    setViewDate(next);
  };

  const changeTimelineWindow = (offset: number) => {
    setTimelineOffset(prev => prev + offset);
  };

  const timelineConfig = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const baseStart = new Date(today);
    baseStart.setDate(today.getDate() - 7);
    const windowStart = new Date(baseStart);
    windowStart.setMonth(windowStart.getMonth() + timelineOffset);
    windowStart.setHours(0,0,0,0);
    const windowEnd = new Date(windowStart);
    windowEnd.setDate(windowStart.getDate() + 90);
    windowEnd.setHours(23,59,59,999);
    return { windowStart, windowEnd, today };
  }, [timelineOffset]);

  const groupedTimelineEvents = useMemo(() => {
    const rawEvents: Array<{
      date: string,
      houseId: string,
      type: string,
      status?: 'paid' | 'partial' | 'unpaid',
      label: string,
      details: string
    }> = [];

    state.tenants.forEach(t => {
      if (t.isActive) {
        rawEvents.push({ date: t.moveInDate, houseId: t.houseId, type: 'move-in', label: 'Move-in', details: t.name });
        if (t.moveOutDate) rawEvents.push({ date: t.moveOutDate, houseId: t.houseId, type: 'lease-end', label: 'Lease Ends', details: t.name });
      }
    });

    state.houses.forEach(h => {
      if (h.insuranceRenewalDate) rawEvents.push({ date: h.insuranceRenewalDate, houseId: h.id, type: 'insurance-renewal', label: 'Insurance', details: 'Policy Renewal' });
    });

    const currentIter = new Date(timelineConfig.windowStart);
    currentIter.setDate(1); 
    for (let i = 0; i < 6; i++) { 
      const year = currentIter.getFullYear();
      const month = String(currentIter.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;
      state.tenants.filter(t => t.isActive).forEach(t => {
        const day = String(t.rentDueDate || 1).padStart(2, '0');
        const eventDateStr = `${year}-${month}-${day}`;
        const eventDateObj = new Date(eventDateStr);
        if (eventDateObj >= timelineConfig.windowStart && eventDateObj <= timelineConfig.windowEnd) {
          const monthPayments = state.payments.filter(p => p.tenantId === t.id && p.dueMonth === monthKey && (p.purposes.includes(PaymentPurpose.RENT) || p.purposes.includes(PaymentPurpose.FIRST_MONTH)));
          const totalPaid = monthPayments.reduce((sum, p) => sum + p.amount, 0);
          let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
          if (totalPaid >= t.monthlyRent) status = 'paid';
          else if (totalPaid > 0) status = 'partial';
          rawEvents.push({ date: eventDateStr, houseId: t.houseId, type: 'rent-due', status, label: 'Rent Due', details: t.name });
        }
      });
      currentIter.setMonth(currentIter.getMonth() + 1);
    }

    const groups: Record<string, any> = {};
    rawEvents.forEach(e => {
      const key = `${e.date}_${e.houseId}`;
      if (!groups[key]) {
        const house = state.houses.find(h => h.id === e.houseId);
        const houseNum = house?.address.match(/^\d+/)?.[0] || house?.address.split(' ')[0] || '??';
        groups[key] = {
          date: e.date,
          houseId: e.houseId,
          houseNumber: houseNum,
          houseAddress: house?.address,
          events: [],
          xPos: 0,
          yStack: 0
        };
      }
      groups[key].events.push(e);
    });

    const start = timelineConfig.windowStart.getTime();
    const end = timelineConfig.windowEnd.getTime();
    const filteredGroups = Object.values(groups)
      .filter(g => {
        const d = new Date(g.date).getTime();
        return d >= start && d <= end;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    const dayStacks: Record<string, number> = {};
    return filteredGroups.map(g => {
      const x = ((new Date(g.date).getTime() - start) / (end - start)) * 100;
      const currentStack = dayStacks[g.date] || 0;
      dayStacks[g.date] = currentStack + 1;
      
      const rentEvents = g.events.filter((e: any) => e.type === 'rent-due');
      let status = 'info';
      if (rentEvents.length > 0) {
        const allPaid = rentEvents.every((e: any) => e.status === 'paid');
        status = allPaid ? 'paid' : 'unpaid';
      }

      return { ...g, xPos: x, yStack: currentStack, status };
    });
  }, [state, timelineConfig]);

  // Dynamic scaling to prevent markers from touching as volume increases
  const markerDiameter = useMemo(() => {
    const baseDiameter = 32;
    const densityFactor = groupedTimelineEvents.length > 10 
      ? Math.max(0.6, 1 - (groupedTimelineEvents.length / 80)) 
      : 1;
    return baseDiameter * densityFactor;
  }, [groupedTimelineEvents.length]);

  const monthTicks = useMemo(() => {
    const ticks = [];
    const start = timelineConfig.windowStart;
    const end = timelineConfig.windowEnd;
    
    let curr = new Date(start);
    curr.setDate(1); 
    
    while (curr <= end) {
      const displayDate = new Date(curr);
      const actualStart = Math.max(displayDate.getTime(), start.getTime());
      const x = ((actualStart - start.getTime()) / (end.getTime() - start.getTime())) * 100;
      
      if (x < 100) {
        const mm = String(displayDate.getMonth() + 1).padStart(2, '0');
        const yy = String(displayDate.getFullYear()).slice(-2);
        ticks.push({ x, label: `${mm}/${yy}` });
      }
      curr.setMonth(curr.getMonth() + 1);
    }
    return ticks;
  }, [timelineConfig]);

  const todayX = useMemo(() => {
    const d = timelineConfig.today.getTime();
    const start = timelineConfig.windowStart.getTime();
    const end = timelineConfig.windowEnd.getTime();
    if (d >= start && d <= end) return ((d - start) / (end - start)) * 100;
    return null;
  }, [timelineConfig]);

  const globalStats = useMemo(() => {
    const periodPayments = state.payments.filter(p => p.dueMonth === selectedMonth);
    const totalRevenue = periodPayments.reduce((acc, p) => acc + p.amount, 0);
    const activeTenants = state.tenants.filter(t => t.isActive);
    const totalExpectedRevenue = activeTenants.reduce((acc, t) => acc + t.monthlyRent, 0);
    const totalMortgage = state.houses.reduce((acc, h) => acc + (h.mortgagePayment || 0), 0);
    const totalInsurance = state.houses.reduce((acc, h) => acc + ((h.insuranceAmount || 0) / 12), 0);
    const totalExpenses = totalMortgage + totalInsurance;
    const netProfit = totalRevenue - totalExpenses;
    const vacancies = state.rooms.filter(room => !state.tenants.some(t => t.roomId === room.id && t.isActive));
    const collectionProgress = totalExpectedRevenue > 0 ? (totalRevenue / totalExpectedRevenue) * 100 : 0;
    return { 
      totalRevenue, totalExpenses, totalMortgage, totalInsurance, netProfit, 
      vacantCount: vacancies.length, vacancies, totalExpectedRevenue, 
      collectionProgress, periodPayments, activeTenants
    };
  }, [state, selectedMonth]);

  const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative pb-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Portfolio Status</h1>
          <p className="text-sm text-slate-500">Managing operations for {monthName}</p>
        </div>
        <div className="flex items-center bg-slate-100 rounded-xl p-1.5 border border-slate-200">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-lg transition-all text-slate-600 shadow-sm"><ChevronLeft size={20} /></button>
          <span className="px-6 font-bold text-slate-800 min-w-[160px] text-center">{monthName}</span>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-lg transition-all text-slate-600 shadow-sm"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Monthly Collection Goal</h3>
            <p className="text-2xl font-black text-slate-800">
              ${globalStats.totalRevenue.toLocaleString()} <span className="text-slate-300 text-lg font-normal">/ ${globalStats.totalExpectedRevenue.toLocaleString()}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-emerald-600">{Math.round(globalStats.collectionProgress)}%</span>
          </div>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${globalStats.collectionProgress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Revenue" value={`$${globalStats.totalRevenue.toLocaleString()}`} icon={<DollarSign />} subText="Cash inbound" color="emerald" onClick={() => onNavigate('payments')} />
        <StatCard label="Est. Net Profit" value={`$${globalStats.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={globalStats.netProfit >= 0 ? <TrendingUp /> : <TrendingDown />} subText="After fixed costs" color={globalStats.netProfit >= 0 ? "blue" : "red"} onClick={() => onNavigate('dashboard')} />
        <StatCard label="Collection" value={`${Math.round(globalStats.collectionProgress)}%`} icon={<CheckCircle2 />} subText="Target progress" color="amber" onClick={() => onNavigate('dashboard')} />
        <StatCard label="Vacancies" value={globalStats.vacantCount} icon={<Home />} subText="Available rooms" color="indigo" onClick={() => onNavigate('properties')} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col min-h-[600px]">
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
           
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                   <h3 className="text-xl font-bold text-white">Transition Pulse</h3>
                </div>
                <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest text-balance">Markers auto-scale based on event volume</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                 {/* Finger Zoom Slider */}
                 <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700 w-full sm:w-auto shadow-xl ring-1 ring-white/5">
                    <ZoomIn size={16} className="text-slate-400 shrink-0" />
                    <div className="relative flex-1 sm:w-40 flex items-center">
                      <input 
                         type="range" 
                         min="1" 
                         max="8" 
                         step="0.1"
                         value={zoomLevel} 
                         onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                         className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                    {zoomLevel > 1 && (
                      <button onClick={() => setZoomLevel(1)} className="p-1 hover:bg-slate-700 rounded-md transition-colors">
                        <RefreshCw size={12} className="text-emerald-400" />
                      </button>
                    )}
                    <span className="text-[10px] font-black text-emerald-400 w-8 text-right">{Math.round(zoomLevel * 100) / 100}x</span>
                 </div>

                 <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 shadow-inner">
                    <button onClick={() => changeTimelineWindow(-1)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400"><ChevronLeft size={18} /></button>
                    <button onClick={() => changeTimelineWindow(1)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400"><ChevronRight size={18} /></button>
                 </div>
              </div>
           </div>

           <div ref={scrollContainerRef} className="relative flex-1 mb-8 mt-2 overflow-x-auto select-none custom-scrollbar overscroll-x-contain pb-8">
              <div className="relative h-full transition-all duration-300 ease-out" style={{ width: `${zoomLevel * 100}%`, minWidth: '100%' }}>
                
                {/* LARGE STICKY MONTH HEADERS - SHORTHAND FORMAT */}
                <div className="absolute top-0 left-0 w-full h-10 flex items-center pointer-events-none z-30">
                   {monthTicks.map((tick, i) => (
                     <div key={i} className="absolute h-10 border-l border-slate-700/50" style={{ left: `${tick.x}%` }}>
                        <div className="ml-2 mt-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-xl shadow-lg backdrop-blur-md">
                           <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] whitespace-nowrap">
                             {tick.label}
                           </span>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="absolute inset-0 flex pointer-events-none z-0">
                   {monthTicks.map((tick, i) => (
                     <div key={i} className="absolute h-full border-l border-slate-800/40" style={{ left: `${tick.x}%` }}></div>
                   ))}
                </div>

                {todayX !== null && (
                  <div className="absolute h-full w-[2px] bg-emerald-500/30 z-10 pointer-events-none" style={{ left: `${todayX}%` }}>
                     <div className="absolute top-10 -left-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-[0_0_15px_rgba(52,211,153,0.6)] animate-pulse"></div>
                     <div className="absolute top-6 -left-1.5 text-[9px] font-black text-emerald-400 uppercase bg-slate-900 border border-emerald-500/20 px-2 py-0.5 rounded-full backdrop-blur-sm">Today</div>
                  </div>
                )}

                {/* Timeline Axis */}
                <div className="absolute top-[60%] left-0 w-full h-[2px] bg-slate-800 rounded-full -translate-y-1/2"></div>

                {/* Event Markers */}
                <div className="absolute top-[60%] left-0 w-full h-0">
                   {groupedTimelineEvents.map((group, idx) => {
                     const isSelected = selectedTimelineGroup?.date === group.date && selectedTimelineGroup?.houseId === group.houseId;
                     const isTop = idx % 2 === 0;
                     const verticalGap = 52; 
                     const baseOffset = 38;
                     const stackOffset = group.yStack * verticalGap;
                     const finalY = isTop ? -(baseOffset + stackOffset) : (baseOffset + stackOffset);
                     
                     const color = group.status === 'paid' ? 'bg-emerald-500' : group.status === 'unpaid' ? 'bg-rose-500' : 'bg-blue-500';

                     return (
                       <div
                         key={idx}
                         className={`absolute -translate-x-1/2 transition-all duration-300 z-20 ${isSelected ? 'z-40' : ''}`}
                         style={{ 
                           left: `${group.xPos}%`, 
                           top: `${finalY}px` 
                         }}
                       >
                         {/* Layout updated: Flex-row with label on the LEFT of the marker */}
                         <button
                           onMouseEnter={() => setSelectedTimelineGroup(group)}
                           onClick={() => setSelectedTimelineGroup(group)}
                           className={`group flex items-center gap-1.5 relative ${isSelected ? 'scale-125' : 'hover:scale-110'} active:scale-95 transition-transform`}
                         >
                            <span className={`text-[9px] font-black text-white px-2 py-1 rounded-lg border shadow-xl transition-all whitespace-nowrap ${isSelected ? 'bg-emerald-600 border-emerald-400 shadow-emerald-500/20' : 'bg-slate-800 border-slate-700'}`}>
                              {group.houseNumber}
                            </span>
                            
                            <div 
                               className={`relative rounded-full border-2 border-slate-900 shadow-2xl flex items-center justify-center transition-all ${color} ${isSelected ? 'ring-4 ring-emerald-500/20' : ''}`}
                               style={{ width: `${markerDiameter}px`, height: `${markerDiameter}px` }}
                            >
                               <Home size={Math.max(10, markerDiameter * 0.45)} className="text-white" />
                               <div className={`absolute w-[1px] bg-slate-700/80 pointer-events-none ${isTop ? 'top-full h-[38px]' : 'bottom-full h-[38px]'}`} style={{ left: '50%' }}></div>
                            </div>

                            <div className="absolute inset-0 -m-5 z-0"></div>
                         </button>
                       </div>
                     );
                   })}
                </div>
              </div>
           </div>

           {/* Detail View Container */}
           <div className="relative z-10 bg-slate-800/60 border border-slate-700/50 rounded-[2rem] p-5 md:p-6 min-h-[160px] transition-all duration-500 shadow-inner backdrop-blur-sm">
              {selectedTimelineGroup ? (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                   <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/50">
                      <div className="flex items-center gap-3">
                         <div className="p-3 bg-slate-800 rounded-2xl text-emerald-400 border border-slate-700 shadow-lg"><MapPin size={20} /></div>
                         <div>
                            <h4 className="text-base font-bold text-white leading-none mb-1.5 truncate max-w-[180px] md:max-w-none">{selectedTimelineGroup.houseAddress}</h4>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{selectedTimelineGroup.date}</p>
                         </div>
                      </div>
                      <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg ${selectedTimelineGroup.status === 'paid' ? 'bg-emerald-500 text-white' : selectedTimelineGroup.status === 'unpaid' ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'}`}>
                         {selectedTimelineGroup.status === 'paid' ? 'House: All Paid' : selectedTimelineGroup.status === 'unpaid' ? 'House: Action Needed' : 'House: Active'}
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {selectedTimelineGroup.events.map((e: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-700 shadow-md ring-1 ring-white/5">
                           <div className={`p-2 rounded-xl ${
                             e.type === 'rent-due' ? (e.status === 'paid' ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10') : 'text-blue-400 bg-blue-400/10'
                           }`}>
                              {e.type === 'rent-due' ? <Wallet size={16} /> : e.type === 'move-in' ? <UserPlus size={16} /> : e.type === 'lease-end' ? <UserMinus size={16} /> : <ShieldCheck size={16} />}
                           </div>
                           <div className="min-w-0">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{e.label}</p>
                              <p className="text-xs font-bold text-white truncate">{e.details}</p>
                           </div>
                           {e.type === 'rent-due' && (
                             <div className={`ml-auto w-2 h-2 rounded-full ${e.status === 'paid' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]'}`} />
                           )}
                        </div>
                      ))}
                   </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 py-6">
                   <div className="p-4 bg-slate-800/40 rounded-full mb-1 border border-slate-700/50">
                      <Search size={28} className="text-slate-500" />
                   </div>
                   <p className="text-sm font-bold uppercase tracking-widest">Select a house marker above</p>
                </div>
              )}
           </div>
        </div>

        <div className="xl:col-span-1 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
           <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             <Clock size={20} className="text-emerald-500" /> Action List
           </h3>
           <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {state.houses.map(house => {
                const activeTenants = state.tenants.filter(t => t.houseId === house.id && t.isActive);
                if (activeTenants.length === 0) return null;

                return (
                  <div key={house.id} className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">{house.address.split(',')[0]}</h4>
                     <div className="space-y-2">
                        {activeTenants.map(t => {
                          const p = state.payments.filter(p => p.tenantId === t.id && p.dueMonth === selectedMonth && (p.purposes.includes(PaymentPurpose.RENT) || p.purposes.includes(PaymentPurpose.FIRST_MONTH)));
                          const total = p.reduce((sum, item) => sum + item.amount, 0);
                          const status = total >= t.monthlyRent ? 'paid' : total > 0 ? 'partial' : 'unpaid';

                          return (
                            <div key={t.id} className="flex justify-between items-center p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                               <div className="flex items-center gap-2 min-w-0">
                                  {status === 'paid' ? <CheckCircle2 className="text-emerald-500 shrink-0" size={14} /> : status === 'partial' ? <AlertTriangle className="text-amber-500 shrink-0" size={14} /> : <CircleDashed className="text-slate-300 shrink-0" size={14} />}
                                  <span className="text-xs font-bold text-slate-700 truncate">{t.name}</span>
                               </div>
                               <p className={`text-[10px] font-black shrink-0 ${status === 'paid' ? 'text-emerald-500' : status === 'partial' ? 'text-amber-500' : 'text-rose-500'}`}>
                                  ${total.toLocaleString()}
                               </p>
                            </div>
                          );
                        })}
                     </div>
                  </div>
                );
              })}
           </div>
           <button onClick={() => onNavigate('payments')} className="mt-6 w-full py-3 bg-slate-900 text-white text-xs font-black uppercase rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg">
              Go to Ledger <ArrowRight size={14} />
           </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, subText, color, onClick }: any) => {
  const colorMap: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100'
  };

  return (
    <button onClick={onClick} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left hover:shadow-xl transition-all group flex flex-col w-full active:scale-95">
      <div className={`p-3 rounded-xl mb-4 w-fit border ${colorMap[color]}`}>{React.cloneElement(icon, { size: 24 })}</div>
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</h4>
      <p className="text-3xl font-black text-slate-800 mb-2 leading-none">{value}</p>
      <div className="mt-auto flex items-center gap-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase">{subText}</p>
        <ArrowRight size={10} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
};
