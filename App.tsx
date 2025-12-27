
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Home, Users, DollarSign, Package, 
  Menu, X, TrendingUp, Download, ShieldCheck, 
  Sparkles, Plus, Info
} from 'lucide-react';
import { AppState } from './types';
import { INITIAL_STATE } from './constants';
import { Dashboard } from './components/Dashboard';
import { PropertyManager } from './components/PropertyManager';
import { TenantManager } from './components/TenantManager';
import { PaymentManager } from './components/PaymentManager';
import { InventoryManager } from './components/InventoryManager';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Persistence Layer
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('proptrack_v2_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure arrays exist
        return {
          ...INITIAL_STATE,
          ...parsed,
          houses: parsed.houses || [],
          tenants: parsed.tenants || [],
          payments: parsed.payments || [],
          lentItems: parsed.lentItems || []
        };
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  useEffect(() => {
    localStorage.setItem('proptrack_v2_data', JSON.stringify(state));
  }, [state]);

  const updateState = <K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const handleAiAudit = async () => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Analyze this property management data:
        Properties: ${state.houses.length}
        Active Tenants: ${state.tenants.filter(t => t.isActive).length}
        Payments Recorded: ${state.payments.length}
        Lent Items Pending: ${state.lentItems.filter(i => !i.returnDate).length}
        
        Provide a 2-sentence professional analysis of financial health and one risk recommendation.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
      });
      setAiAnalysis(response.text || "Analysis complete. Stability confirmed.");
    } catch (error) {
      setAiAnalysis("AI Analyst is currently unavailable. Review records manually.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'properties', label: 'Portfolio', icon: Home },
    { id: 'tenants', label: 'Residents', icon: Users },
    { id: 'payments', label: 'Rent Ledger', icon: DollarSign },
    { id: 'inventory', label: 'Lent Items', icon: Package },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-[#0F172A] text-white z-50 transition-all duration-300 shadow-2xl ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'}`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between overflow-hidden">
          <h1 className={`text-xl font-black flex items-center gap-3 transition-opacity duration-300 ${!isSidebarOpen && 'lg:opacity-0'}`}>
            <div className="bg-emerald-500 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20">
              <TrendingUp size={20} className="text-white" />
            </div>
            PropTrack
          </h1>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
            {isSidebarOpen ? <X size={20} className="lg:hidden" /> : <Menu size={20} />}
          </button>
        </div>
        
        <nav className="flex-1 py-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 transition-all group ${
                activeTab === item.id 
                  ? 'bg-emerald-500/10 text-emerald-400 border-r-4 border-emerald-500 font-bold' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <item.icon size={22} className={activeTab === item.id ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'} />
              <span className={`whitespace-nowrap transition-opacity duration-300 ${!isSidebarOpen && 'lg:hidden'}`}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <button 
            onClick={handleAiAudit}
            disabled={isAnalyzing}
            className={`w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 active:scale-95 transition-all ${!isSidebarOpen && 'lg:justify-center lg:px-0'}`}
          >
            <Sparkles size={18} className={isAnalyzing ? 'animate-spin' : ''} />
            <span className={`text-sm font-black whitespace-nowrap ${!isSidebarOpen && 'lg:hidden'}`}>
              {isAnalyzing ? 'Analyzing...' : 'AI Audit'}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className={`lg:hidden p-2 text-slate-600`}>
               <Menu size={24} />
             </button>
             <h2 className="text-xl font-black text-slate-800 capitalize tracking-tight">{activeTab.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full text-[10px] font-black text-emerald-700 border border-emerald-100 uppercase tracking-widest">
               <ShieldCheck size={14} />
               Secure Session
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
          {aiAnalysis && (
            <div className="bg-white border-2 border-emerald-500/20 p-6 rounded-3xl shadow-xl shadow-emerald-500/5 animate-in slide-in-from-top duration-500 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4">
                 <button onClick={() => setAiAnalysis(null)} className="text-slate-300 hover:text-slate-500 transition-colors"><X size={18} /></button>
               </div>
               <div className="flex gap-5 items-start">
                 <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shrink-0">
                   <Sparkles size={24} />
                 </div>
                 <div>
                   <h4 className="font-black text-emerald-600 uppercase text-[10px] tracking-[0.2em] mb-2">AI Insights Engine</h4>
                   <p className="text-slate-700 leading-relaxed font-semibold italic">"{aiAnalysis}"</p>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'dashboard' && <Dashboard state={state} onNavigate={setActiveTab} />}
          {activeTab === 'properties' && <PropertyManager state={state} updateState={updateState} />}
          {activeTab === 'tenants' && <TenantManager state={state} updateState={updateState} />}
          {activeTab === 'payments' && <PaymentManager state={state} updateState={updateState} />}
          {activeTab === 'inventory' && <InventoryManager state={state} updateState={updateState} />}
        </div>
      </main>
    </div>
  );
};

export default App;
