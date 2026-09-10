import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  RotateCw, 
  AlertOctagon, 
  TrendingUp, 
  ShoppingCart, 
  ShieldAlert, 
  CheckCircle2,
  Brain,
  Lightbulb,
  Factory
} from 'lucide-react';
import { MovementType } from '../types';

interface AIAdvisorViewProps {
  onOpenNewMovement: (prefill?: { type?: MovementType; itemId?: string }) => void;
}

export const AIAdvisorView: React.FC<AIAdvisorViewProps> = ({ onOpenNewMovement }) => {
  const { items } = useApp();

  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/stock-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao processar diagnóstico de IA');
      }
      setAnalysis(data.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com assistente de IA.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Diagnóstico de Manufatura com IA Gemini
              </h2>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                Server-Side Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Algoritmo de inteligência preditiva que analisa em tempo real os níveis de estoque, lead-time de fornecedores e ordens em aberto para mitigar riscos de ruptura e controlar custos.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAnalysis}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow transition-all active:scale-95 shrink-0 self-start md:self-auto"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Processando...' : 'Atualizar Diagnóstico'}</span>
        </button>
      </div>

      {loading && !analysis && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <RotateCw className="w-8 h-8 mx-auto text-amber-500 animate-spin" />
          <h4 className="text-base font-bold text-slate-800">
            Consultando Rede Neural de Manufatura...
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Avaliando histórico de movimentações, divergências de auditoria e ordens de fabricação com o modelo Gemini 3.8 Flash.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-3">
          <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            onClick={fetchAnalysis}
            className="px-3 py-1 rounded-lg bg-rose-200 hover:bg-rose-300 text-rose-900 font-bold text-xs"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">

          {/* Factory Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-base">
                Parecer Executivo de Suprimentos & Produção
              </h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {analysis.factorySummary}
            </p>
          </div>

          {/* Critical Risks Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left: Stockout Risks */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Riscos Críticos de Ruptura & Parada
                </h3>
              </div>

              <div className="space-y-3">
                {analysis.criticalStockoutRisks?.map((risk: any, idx: number) => {
                  const matchedItem = items.find(i => i.code === risk.itemCode);

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/40 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                              {risk.itemCode}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">
                              {risk.itemName}
                            </span>
                          </div>
                          <p className="text-xs text-rose-900 font-semibold mt-1">
                            Linhas Afetadas: {risk.affectedLines}
                          </p>
                        </div>

                        {matchedItem && (
                          <button
                            onClick={() => onOpenNewMovement({ type: 'ENTRADA', itemId: matchedItem.id })}
                            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 transition-colors"
                          >
                            Receber
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                        <div>Saldo Atual: <strong className="text-slate-900">{risk.currentStock}</strong></div>
                        <div>Estoque Mínimo: <strong className="text-slate-900">{risk.minStock}</strong></div>
                        <div>Lead Time: <strong className="text-slate-900">{risk.leadTimeDays} dias</strong></div>
                        <div>Fornecedor: <strong className="text-slate-900">{risk.supplier}</strong></div>
                      </div>

                      <div className="text-xs text-rose-800 bg-white/70 p-2 rounded-lg border border-rose-100 font-medium">
                        {risk.impactAnalysis}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Suggested Purchase Orders */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-base">
                  Recomendações Inteligentes de Reposição
                </h3>
              </div>

              <div className="space-y-3">
                {analysis.purchaseRecommendations?.map((rec: any, idx: number) => {
                  const matchedItem = items.find(i => i.code === rec.itemCode);

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                              {rec.itemCode}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">
                              {rec.itemName}
                            </span>
                          </div>
                          <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                            rec.urgency === 'URGENTE' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                          }`}>
                            Prioridade: {rec.urgency}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[11px] text-slate-500 block">Sugerido:</span>
                          <span className="text-base font-extrabold text-slate-900">
                            +{rec.suggestedQuantity} un.
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600">
                        {rec.justification}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-xs">
                        <span className="text-slate-600 font-medium">
                          Investimento Estimado: <strong className="text-slate-900">{formatCurrency(rec.estimatedCost)}</strong>
                        </span>
                        {matchedItem && (
                          <button
                            onClick={() => onOpenNewMovement({ type: 'ENTRADA', itemId: matchedItem.id })}
                            className="text-amber-700 hover:text-amber-800 font-bold"
                          >
                            Registrar Entrada &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Root Causes & Divergence Insights */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-base">
                Análise de Causas-Raiz de Perdas & Ações Preventivas
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                  Causas Identificadas de Divergências
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                  {analysis.divergenceRootCauses?.map((cause: string, i: number) => (
                    <li key={i} className="leading-relaxed">{cause}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                  Plano de Ação Imediato
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                  {analysis.immediateActionItems?.map((action: string, i: number) => (
                    <li key={i} className="leading-relaxed">{action}</li>
                  ))}
                </ul>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
};
