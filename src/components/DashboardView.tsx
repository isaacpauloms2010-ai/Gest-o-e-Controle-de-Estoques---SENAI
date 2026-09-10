import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  DollarSign, 
  Package, 
  AlertOctagon, 
  CheckCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Repeat, 
  TrendingUp, 
  Clock, 
  Factory, 
  ShieldAlert, 
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { MovementType } from '../types';

interface DashboardViewProps {
  onNavigateTab: (tabId: string) => void;
  onOpenNewMovement: (prefill?: { type?: MovementType; itemId?: string }) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab, onOpenNewMovement }) => {
  const { items, sectors, movements, audits, orders } = useApp();

  // Calculations
  const totalStockValue = items.reduce((acc, item) => acc + (item.currentStock * item.unitCost), 0);
  const totalItemsCount = items.length;
  
  const rupturaItems = items.filter(i => i.status === 'RUPTURA');
  const criticalItems = items.filter(i => i.status === 'CRITICO');
  const alertItems = items.filter(i => i.status === 'ALERTA');
  const totalAtRisk = rupturaItems.length + criticalItems.length + alertItems.length;

  const latestAudit = audits.length > 0 ? audits[0] : null;
  const averageAccuracy = audits.length > 0
    ? Number((audits.reduce((acc, a) => acc + a.accuracyRate, 0) / audits.length).toFixed(1))
    : 100;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getMovementBadge = (type: MovementType) => {
    switch (type) {
      case 'ENTRADA':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <ArrowDownRight className="w-3 h-3 text-emerald-600" /> ENTRADA
        </span>;
      case 'SAIDA':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <ArrowUpRight className="w-3 h-3 text-rose-600" /> SAÍDA
        </span>;
      case 'TRANSFERENCIA':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
          <Repeat className="w-3 h-3 text-sky-600" /> TRANSF.
        </span>;
      case 'DEVOLUCAO':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
          DEVOLUÇÃO
        </span>;
      case 'AJUSTE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          AJUSTE
        </span>;
    }
  };

  return (
    <div className="space-y-6">

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Valor em Estoque */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Patrimônio em Estoque
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {formatCurrency(totalStockValue)}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> Ativo Corrente
              </span>
              <span>em materiais</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total de SKUs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Materiais Cadastrados
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {totalItemsCount} <span className="text-sm font-normal text-slate-500">SKUs</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Distribuídos em 6 setores fabris
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Itens Críticos / Ruptura */}
        <div 
          onClick={() => onNavigateTab('materials')} 
          className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] ${
            rupturaItems.length > 0
              ? 'bg-rose-50/70 border-rose-300 hover:border-rose-400'
              : criticalItems.length > 0
              ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
              : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Em Risco / Ruptura
              </p>
              {rupturaItems.length > 0 && (
                <span className="animate-pulse bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  URGENTE
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 flex items-baseline gap-2">
              <span>{totalAtRisk}</span>
              <span className="text-xs font-normal text-slate-600">
                ({rupturaItems.length} zerados, {criticalItems.length} críticos)
              </span>
            </h3>
            <p className="text-xs text-rose-700 font-medium mt-1">
              Clique para ver lista e repor
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            rupturaItems.length > 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
          }`}>
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Acurácia do Inventário Físico */}
        <div 
          onClick={() => onNavigateTab('audits')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-all hover:scale-[1.01]"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Acurácia do Inventário
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 flex items-baseline gap-1.5">
              <span>{averageAccuracy}%</span>
              <span className="text-xs font-semibold text-slate-500">Meta: 98%</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Última auditoria: {latestAudit ? latestAudit.code : 'Sem registro'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Production Stoppage Alert Banner (Solving "Falta de peças em momentos críticos de produção") */}
      {(rupturaItems.length > 0 || criticalItems.length > 0) && (
        <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-amber-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-rose-700/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-rose-500 text-white">
                    Alerta de Chão de Fábrica
                  </span>
                  <span className="text-sm font-semibold text-rose-200">
                    Risco de Desabastecimento de Linhas Produtivas
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white mt-1">
                  {rupturaItems.length > 0 
                    ? `${rupturaItems[0].name} está com ESTOQUE ZERADO!`
                    : `${criticalItems[0].name} atingiu nível de emergência.`}
                </h4>
                <p className="text-xs sm:text-sm text-rose-100/90 mt-1 max-w-3xl">
                  {rupturaItems.length > 0 
                    ? `A Ordem de Produção OP-4081 (Bombas Centrífugas BH-200) está paralisada aguardando abastecimento de fixadores. Lead time de reposição estimado: ${rupturaItems[0].leadTimeDays} dias com ${rupturaItems[0].supplier}.`
                    : `Itens críticos requerem transferência imediata do almoxarifado central para a linha de montagem ou emissão de ordem de compra suplementar.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => onOpenNewMovement({ type: 'ENTRADA', itemId: rupturaItems[0]?.id || criticalItems[0]?.id })}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow active:scale-95 flex items-center gap-2"
              >
                <span>Receber Material</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigateTab('production')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all"
              >
                Ver Ordens Afetadas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Stock By Sector + Recent Movements Kardex */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sectors Distribution (2 columns on lg) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Estoque em Tempo Real por Setor
                </h3>
                <p className="text-xs text-slate-500">
                  Distribuição física entre almoxarifado central e linhas de fabricação
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('materials')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>Ver catálogo completo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {sectors.map(sector => {
              const stats = sector.stats || { totalItems: 0, totalStockUnits: 0, totalFinancialValue: 0 };
              const percent = totalStockValue > 0 ? (stats.totalFinancialValue / totalStockValue) * 100 : 0;

              return (
                <div
                  key={sector.id}
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px] font-bold">
                        {sector.code}
                      </span>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm truncate max-w-[170px]">
                        {sector.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      {percent.toFixed(0)}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        sector.type === 'ALMOXARIFADO' ? 'bg-amber-500' :
                        sector.type === 'PRODUCAO' ? 'bg-blue-600' :
                        sector.type === 'QUALIDADE' ? 'bg-purple-600' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, percent))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>{stats.totalItems} referências ({stats.totalStockUnits} un.)</span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(stats.totalFinancialValue)}
                    </span>
                  </div>
                  
                  <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-200/60 pt-2">
                    <span>Responsável: <strong className="text-slate-600">{sector.responsible}</strong></span>
                    <button
                      onClick={() => onOpenNewMovement({ type: 'TRANSFERENCIA' })}
                      className="text-amber-600 hover:text-amber-700 font-semibold"
                    >
                      Abastecer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Manufacturing Advisor Snapshot (1 column on lg) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between border border-slate-700">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Assistente IA de Manufatura</h4>
                  <p className="text-[11px] text-slate-400">Prevenção de paradas e perdas</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Gemini 3.8
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
              <p className="text-xs text-slate-300 leading-relaxed">
                A IA detectou vulnerabilidade iminente na <strong>Linha de Montagem</strong>: o estoque de parafusos M8 zerou e os rolamentos 6205 estão com apenas 12 unidades (suficiente para 3 dias).
              </p>
              <div className="text-[11px] text-amber-300 font-medium">
                💡 Ação recomendada: Antecipar pedido de compra emergencial e programar contagem cíclica na gaveta de vedações.
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Ordens com Prioridade PCP
              </div>
              {orders.slice(0, 2).map(o => (
                <div key={o.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/60 text-xs">
                  <div>
                    <span className="font-bold text-amber-300">{o.code}</span>
                    <span className="text-slate-300 ml-1.5">{o.productName}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    o.status === 'AGUARDANDO_MATERIAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {o.status === 'AGUARDANDO_MATERIAL' ? 'Falta Peça' : 'Em Produção'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-700/70">
            <button
              onClick={() => onNavigateTab('ai-advisor')}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Abrir Diagnóstico Completo da Fábrica</span>
            </button>
          </div>
        </div>

      </div>

      {/* Recent Movements Kardex Table (Kardex em Tempo Real) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Kardex Recente de Movimentações
              </h3>
              <p className="text-xs text-slate-500">
                Últimas entradas, saídas para produção e transferências rastreadas
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('movements')}
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Ver histórico completo e filtros</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-2.5 px-3">Data / Hora</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Material</th>
                <th className="py-2.5 px-3">Qtd.</th>
                <th className="py-2.5 px-3">Origem &rarr; Destino</th>
                <th className="py-2.5 px-3">Documento / Lote</th>
                <th className="py-2.5 px-3">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.slice(0, 6).map(m => {
                const dateObj = new Date(m.timestamp);
                const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                return (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {dateStr} às {timeStr}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getMovementBadge(m.type)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{m.itemName}</div>
                      <div className="font-mono text-[11px] text-slate-400">{m.itemCode}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-900">
                      {m.type === 'SAIDA' ? '-' : m.type === 'ENTRADA' ? '+' : ''}{Math.abs(m.quantity)} {m.unit}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                      <span className="font-medium text-slate-500">{m.sourceSector}</span>
                      <span className="mx-1 text-slate-400">&rarr;</span>
                      <span className="font-bold text-slate-800">{m.targetSector}</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{m.documentNumber}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{m.batch}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{m.responsible}</div>
                      <div className="text-[10px] text-slate-400">{m.responsibleRole}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
