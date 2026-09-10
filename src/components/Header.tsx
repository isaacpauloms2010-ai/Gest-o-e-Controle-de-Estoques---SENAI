import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Factory, 
  UserCheck, 
  RotateCw, 
  ShieldCheck, 
  PlusCircle, 
  ClipboardCheck,
  ChevronDown,
  Database
} from 'lucide-react';

interface HeaderProps {
  onOpenNewMovement: () => void;
  onOpenNewAudit: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewMovement, onOpenNewAudit }) => {
  const { currentUser, setCurrentUser, users, refreshData, isLoading, items } = useApp();
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);

  const criticalCount = items.filter(i => i.status === 'CRITICO' || i.status === 'RUPTURA').length;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center shadow-inner shadow-black/30 shrink-0">
              <Factory className="w-6 h-6 text-slate-950 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg sm:text-xl text-white">
                  InovaTech
                </span>
                <span className="text-xs uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Manufatura S.A.
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate hidden sm:block">
                Controle Integrado de Almoxarifado, Chão de Fábrica & Rastreabilidade
              </p>
            </div>
          </div>

          {/* Center Badges (Industrial Shift & Live Status) */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300 font-medium">Turno A (06:00 - 14:45)</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Planta 01</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span>Persistência REST</span>
            </div>

            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>{criticalCount} {criticalCount === 1 ? 'item crítico' : 'itens críticos'}</span>
              </div>
            )}
          </div>

          {/* Right Actions: Quick Buttons & User Profile Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Action: New Movement */}
            <button
              onClick={onOpenNewMovement}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-sm transition-colors active:scale-95"
              title="Registrar entrada, saída ou transferência de materiais"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Movimentar</span>
            </button>

            {/* Quick Action: New Audit */}
            <button
              onClick={onOpenNewAudit}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition-colors"
              title="Realizar contagem física e relatório de divergências"
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Balanço Físico</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => refreshData()}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
              title="Sincronizar dados"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* User Switcher (RBAC) */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-all text-left"
              >
                <div className={`w-8 h-8 rounded-full ${currentUser?.avatarBg || 'bg-slate-600'} flex items-center justify-center font-bold text-xs text-white`}>
                  {currentUser?.name.substring(0, 2).toUpperCase() || 'OP'}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {currentUser?.name || 'Operador'}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-tight">
                    {currentUser?.roleTitle || 'Perfil'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {/* Dropdown for RBAC switching */}
              {showUserDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserDropdown(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 text-sm divide-y divide-slate-700/50">
                    <div className="px-3 py-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      Alternar Perfil de Acesso (RBAC)
                    </div>
                    <div className="py-1 space-y-1">
                      {users.map(u => {
                        const isSelected = u.id === currentUser?.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              setCurrentUser(u);
                              setShowUserDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                              isSelected ? 'bg-amber-500/15 text-amber-300 font-medium' : 'text-slate-300 hover:bg-slate-700/60'
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-full ${u.avatarBg} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                              {u.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold truncate">{u.name}</div>
                              <div className="text-[11px] text-slate-400 truncate">{u.roleTitle}</div>
                              <div className="text-[10px] text-slate-500 truncate">{u.sector}</div>
                            </div>
                            {isSelected && (
                              <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="pt-2 px-3 pb-1 text-[11px] text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Permissões operacionais ajustadas por perfil.</span>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
