import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { ToastContainer } from './components/ToastContainer';
import { DashboardView } from './components/DashboardView';
import { MaterialsView } from './components/MaterialsView';
import { MovementsView } from './components/MovementsView';
import { AuditsView } from './components/AuditsView';
import { ProductionOrdersView } from './components/ProductionOrdersView';
import { AIAdvisorView } from './components/AIAdvisorView';
import { ArchitectureDocsView } from './components/ArchitectureDocsView';
import { 
  LayoutDashboard, 
  Package, 
  Repeat, 
  ClipboardCheck, 
  Factory, 
  Sparkles, 
  FileCode,
  RotateCcw,
  ShieldCheck,
  Building2,
  X
} from 'lucide-react';
import { MovementType } from './types';

type NavigationTab = 'dashboard' | 'materials' | 'movements' | 'audits' | 'production' | 'ai-advisor' | 'architecture';

const MainLayout: React.FC = () => {
  const { resetDatabase, items } = useApp();
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  
  // Prefill state for movements modal/screen
  const [movementPrefill, setMovementPrefill] = useState<{ type?: MovementType; itemId?: string } | undefined>(undefined);
  const [isQuickMoveOpen, setIsQuickMoveOpen] = useState(false);

  const handleOpenNewMovement = (prefill?: { type?: MovementType; itemId?: string }) => {
    setMovementPrefill(prefill);
    setActiveTab('movements');
  };

  const handleOpenNewAudit = () => {
    setActiveTab('audits');
  };

  const criticalCount = items.filter(i => i.status === 'CRITICO' || i.status === 'RUPTURA').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      
      {/* Top Industrial Header with RBAC Switcher */}
      <Header
        onOpenNewMovement={() => handleOpenNewMovement({ type: 'ENTRADA' })}
        onOpenNewAudit={handleOpenNewAudit}
      />

      {/* Main Tab Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 sm:top-20 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar">
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('materials')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'materials'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Materiais & Catálogo</span>
              {criticalCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-bold">
                  {criticalCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('movements')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'movements'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Repeat className="w-4 h-4" />
              <span>Movimentação & Kardex</span>
            </button>

            <button
              onClick={() => setActiveTab('audits')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'audits'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Balanço Físico & Divergências</span>
            </button>

            <button
              onClick={() => setActiveTab('production')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'production'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Factory className="w-4 h-4" />
              <span>Ordens de Produção (BOM)</span>
            </button>

            <button
              onClick={() => setActiveTab('ai-advisor')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'ai-advisor'
                  ? 'bg-slate-900 text-amber-400 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Diagnóstico IA</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'architecture'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Arquitetura & Implantação</span>
            </button>

          </nav>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigateTab={(tab) => setActiveTab(tab as NavigationTab)}
            onOpenNewMovement={handleOpenNewMovement}
          />
        )}

        {activeTab === 'materials' && (
          <MaterialsView
            onOpenNewMovement={handleOpenNewMovement}
          />
        )}

        {activeTab === 'movements' && (
          <MovementsView
            initialPrefill={movementPrefill}
          />
        )}

        {activeTab === 'audits' && (
          <AuditsView />
        )}

        {activeTab === 'production' && (
          <ProductionOrdersView
            onOpenNewMovement={handleOpenNewMovement}
          />
        )}

        {activeTab === 'ai-advisor' && (
          <AIAdvisorView
            onOpenNewMovement={handleOpenNewMovement}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureDocsView />
        )}
      </main>

      {/* Industrial Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-white">InovaTech Manufatura S.A.</span>
            <span>&bull;</span>
            <span>Sistema Integrado de Controle de Estoques & Chão de Fábrica</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-500">Versão 2.4-PROD</span>
            <button
              onClick={() => {
                if (window.confirm('Deseja restaurar a base de dados padrão da InovaTech?')) {
                  resetDatabase();
                }
              }}
              className="flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition-colors"
              title="Restaurar SKUs e registros originais de demonstração"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Banco de Dados</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Notifications */}
      <ToastContainer />

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
