import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ClipboardCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Plus, 
  ShieldCheck, 
  TrendingDown, 
  TrendingUp,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { InventoryAudit } from '../types';

export const AuditsView: React.FC = () => {
  const { items, sectors, audits, currentUser, submitAudit, approveAudit } = useApp();

  const [showNewAuditModal, setShowNewAuditModal] = useState(false);
  const [selectedAuditDetails, setSelectedAuditDetails] = useState<InventoryAudit | null>(null);

  // New Audit Form State
  const [auditSectorId, setAuditSectorId] = useState<string>('almoxarifado-central');
  const [auditNotes, setAuditNotes] = useState<string>('');
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, { count: number; reason: string }>>({});

  // Initialize counts when sector changes or modal opens
  const sectorItems = useMemo(() => {
    return items.filter(i => (i.stockBySector[auditSectorId] ?? 0) >= 0);
  }, [items, auditSectorId]);

  const handleStartAuditModal = () => {
    const initial: Record<string, { count: number; reason: string }> = {};
    sectorItems.forEach(item => {
      initial[item.id] = {
        count: item.stockBySector[auditSectorId] || 0,
        reason: ''
      };
    });
    setPhysicalCounts(initial);
    setShowNewAuditModal(true);
  };

  const handleCountChange = (itemId: string, count: number) => {
    setPhysicalCounts(prev => ({
      ...prev,
      [itemId]: {
        count,
        reason: prev[itemId]?.reason || ''
      }
    }));
  };

  const handleReasonChange = (itemId: string, reason: string) => {
    setPhysicalCounts(prev => ({
      ...prev,
      [itemId]: {
        count: prev[itemId]?.count ?? 0,
        reason
      }
    }));
  };

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const countsPayload = sectorItems.map(item => ({
      itemId: item.id,
      physicalStock: physicalCounts[item.id]?.count ?? (item.stockBySector[auditSectorId] || 0),
      reason: physicalCounts[item.id]?.reason || ''
    }));

    const success = await submitAudit({
      sectorId: auditSectorId,
      auditor: currentUser.name,
      notes: auditNotes,
      counts: countsPayload
    });

    if (success) {
      setShowNewAuditModal(false);
      setAuditNotes('');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const isManager = currentUser?.role === 'GERENTE_MANUFATURA';

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-emerald-500" />
              Inventário Cíclico & Relatório de Divergências
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditoria de saldos físicos versus sistêmicos, cálculo de acurácia (KPI) e conciliação gerencial
            </p>
          </div>

          <button
            onClick={handleStartAuditModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Iniciar Contagem Física</span>
          </button>
        </div>

        {/* Why this matters (Solving manufacturing pain) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <strong className="text-slate-900 block mb-0.5">Zero Papel</strong>
            Contagens físicas digitadas diretamente na interface com validação instantânea e eliminação de retrabalho.
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <strong className="text-slate-900 block mb-0.5">Impacto Financeiro</strong>
            Cálculo imediato do desvio em R$ por SKU e identificação de causas-raiz de perdas no almoxarifado.
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <strong className="text-slate-900 block mb-0.5">Conciliação com 1 Clique</strong>
            Aprovação pelo Gerente de Manufatura que atualiza o saldo e gera o registro inalterável no Kardex.
          </div>
        </div>

      </div>

      {/* Audits History List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          Histórico de Auditorias & Relatórios de Divergência
        </h3>

        {audits.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <ClipboardCheck className="w-12 h-12 mx-auto text-slate-300 stroke-1 mb-2" />
            <h4 className="text-base font-bold text-slate-700">Nenhuma auditoria realizada ainda</h4>
            <p className="text-xs text-slate-400 mt-1">
              Clique em "Iniciar Contagem Física" para registrar o primeiro inventário cíclico.
            </p>
          </div>
        ) : (
          audits.map(audit => {
            const date = new Date(audit.date);
            const isApproved = audit.status === 'APROVADA_COM_AJUSTE';
            const isPending = audit.status === 'PENDENTE_APROVACAO';

            return (
              <div
                key={audit.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-sm space-y-4 ${
                  isPending ? 'border-amber-300 ring-1 ring-amber-300/50' : 'border-slate-200'
                }`}
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {audit.accuracyRate}%
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {audit.code}
                        </span>
                        <span className="font-bold text-slate-800 text-sm">
                          {audit.sectorName}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isApproved ? 'Ajustes Conciliados' : 'Pendente Aprovação'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Realizada em {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} por <strong>{audit.auditor}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Financial & Accuracy Badges */}
                  <div className="flex items-center gap-4 text-xs shrink-0">
                    <div className="text-right">
                      <span className="text-slate-400 block text-[11px]">Impacto Financeiro:</span>
                      <span className={`font-bold text-sm ${audit.financialImpact < 0 ? 'text-rose-600' : audit.financialImpact > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {formatCurrency(audit.financialImpact)}
                      </span>
                    </div>

                    {/* Approve Button (Manager only) */}
                    {isPending && isManager && (
                      <button
                        onClick={() => approveAudit(audit.id)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all"
                      >
                        Aprovar & Ajustar
                      </button>
                    )}
                  </div>
                </div>

                {/* Audit notes if any */}
                {audit.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                    "{audit.notes}"
                  </p>
                )}

                {/* Divergence Items Breakdown */}
                {audit.divergences.length === 0 ? (
                  <div className="text-xs text-emerald-700 bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>100% de Acurácia!</strong> Todos os itens contados coincidiram rigorosamente com os registros do sistema.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Divergências Encontradas ({audit.divergences.length} itens)</span>
                      <span className="text-slate-400 font-normal text-[11px]">
                        {audit.itemsAudited} referências auditadas
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Material</th>
                            <th className="p-2.5">Saldo Sistêmico</th>
                            <th className="p-2.5">Contagem Física</th>
                            <th className="p-2.5">Variação</th>
                            <th className="p-2.5">Impacto (R$)</th>
                            <th className="p-2.5">Motivo / Causa-Raiz</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {audit.divergences.map((div, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60">
                              <td className="p-2.5">
                                <div className="font-bold text-slate-900">{div.itemName}</div>
                                <div className="font-mono text-[10px] text-slate-400">{div.itemCode}</div>
                              </td>
                              <td className="p-2.5 text-slate-700 font-medium">
                                {div.systemStock} {div.unit}
                              </td>
                              <td className="p-2.5 font-bold text-slate-900">
                                {div.physicalStock} {div.unit}
                              </td>
                              <td className="p-2.5 font-bold whitespace-nowrap">
                                <span className={div.difference < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                                  {div.difference > 0 ? `+${div.difference}` : div.difference} {div.unit}
                                </span>
                              </td>
                              <td className="p-2.5 font-semibold whitespace-nowrap">
                                <span className={div.financialDifference < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                                  {formatCurrency(div.financialDifference)}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-700 max-w-xs">
                                {div.reason}
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                {div.adjusted ? (
                                  <span className="text-emerald-700 text-[11px] font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Conciliado
                                  </span>
                                ) : (
                                  <span className="text-amber-700 text-[11px] font-bold flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Aguardando Gerente
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Audit approval stamp if approved */}
                {isApproved && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Aprovado por <strong>{audit.approvedBy}</strong> em {new Date(audit.approvedAt || audit.date).toLocaleDateString('pt-BR')}. Estoque e Kardex atualizados.</span>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* MODAL: REALIZAR NOVA CONTAGEM FÍSICA */}
      {showNewAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="font-bold text-base">Nova Contagem Física de Inventário</h3>
                <p className="text-xs text-slate-400">Insira a contagem real e justificativas para divergências</p>
              </div>
              <button onClick={() => setShowNewAuditModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAuditSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Setor a Inventariar</label>
                  <select
                    value={auditSectorId}
                    onChange={e => {
                      setAuditSectorId(e.target.value);
                      // Reset counts for new sector
                      const nextItems = items.filter(i => (i.stockBySector[e.target.value] ?? 0) >= 0);
                      const initial: Record<string, { count: number; reason: string }> = {};
                      nextItems.forEach(item => {
                        initial[item.id] = { count: item.stockBySector[e.target.value] || 0, reason: '' };
                      });
                      setPhysicalCounts(initial);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500/30"
                  >
                    {sectors.map(s => (
                      <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Auditor / Responsável</label>
                  <input
                    type="text"
                    disabled
                    value={`${currentUser?.name} (${currentUser?.roleTitle})`}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas da Auditoria</label>
                <input
                  type="text"
                  placeholder="Ex: Contagem de rotina quinzenal das prateleiras A e B"
                  value={auditNotes}
                  onChange={e => setAuditNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* Items Counting Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-700">
                    Materiais presentes no setor ({sectorItems.length} referências)
                  </h4>
                  <span className="text-slate-400 text-[11px]">
                    Insira a contagem física conferida
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Material</th>
                        <th className="p-2.5">Saldo Sistema</th>
                        <th className="p-2.5">Contagem Física</th>
                        <th className="p-2.5">Diferença</th>
                        <th className="p-2.5">Motivo da Divergência</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sectorItems.map(item => {
                        const sysStock = item.stockBySector[auditSectorId] || 0;
                        const physStock = physicalCounts[item.id]?.count ?? sysStock;
                        const diff = physStock - sysStock;
                        const hasDiff = diff !== 0;

                        return (
                          <tr key={item.id} className={hasDiff ? 'bg-amber-50/50' : ''}>
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900">{item.name}</div>
                              <div className="font-mono text-[10px] text-slate-400">{item.code} ({item.unit})</div>
                            </td>
                            <td className="p-2.5 font-semibold text-slate-700">
                              {sysStock} {item.unit}
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                min="0"
                                value={physStock}
                                onChange={e => handleCountChange(item.id, Number(e.target.value))}
                                className="w-20 px-2 py-1 border border-slate-300 rounded font-bold text-slate-900 text-center"
                                required
                              />
                            </td>
                            <td className="p-2.5 font-bold whitespace-nowrap">
                              {hasDiff ? (
                                <span className={diff < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                                  {diff > 0 ? `+${diff}` : diff} {item.unit}
                                </span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>
                            <td className="p-2.5">
                              {hasDiff ? (
                                <input
                                  type="text"
                                  placeholder="Motivo (avaria, sobra, etc.)"
                                  value={physicalCounts[item.id]?.reason || ''}
                                  onChange={e => handleReasonChange(item.id, e.target.value)}
                                  className="w-full px-2 py-1 border border-amber-300 rounded text-slate-900 focus:ring-1 focus:ring-amber-500"
                                  required
                                />
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Sem divergência</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewAuditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Salvar Relatório de Auditoria
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
