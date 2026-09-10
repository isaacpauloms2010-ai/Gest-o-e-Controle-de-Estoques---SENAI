import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Factory, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Layers, 
  Box, 
  ShieldAlert,
  ChevronRight,
  PackageCheck
} from 'lucide-react';
import { MovementType } from '../types';

interface ProductionOrdersViewProps {
  onOpenNewMovement: (prefill?: { type?: MovementType; itemId?: string }) => void;
}

export const ProductionOrdersView: React.FC<ProductionOrdersViewProps> = ({ onOpenNewMovement }) => {
  const { orders, items, requisitionMaterial } = useApp();

  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [isRequisitioning, setIsRequisitioning] = useState(false);

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  const handleRequisition = async (orderId: string, itemId: string, qty: number) => {
    setIsRequisitioning(true);
    await requisitionMaterial(orderId, itemId, qty);
    setIsRequisitioning(false);
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'EM_ANDAMENTO':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Em Andamento
        </span>;
      case 'AGUARDANDO_MATERIAL':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 animate-pulse">
          <AlertCircle className="w-3.5 h-3.5" /> Aguardando Peças (Parada)
        </span>;
      case 'CONCLUIDA':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Concluída
        </span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">Planejada</span>;
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Factory className="w-6 h-6 text-amber-500" />
              Ordens de Produção & Rastreabilidade de Peças (BOM)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Controle de consumo de componentes no chão de fábrica e prevenção ativa de paradas de linha
            </p>
          </div>
        </div>

        {/* Warning Callout */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Gargalo Operacional Identificado:</strong> Historicamente, a falta de registro prévio das requisições gerava desvios entre o estoque físico e os lotes montados. Toda transferência da lista de materiais (BOM) é debitada automaticamente do almoxarifado central e creditada no setor produtivo.
          </div>
        </div>
      </div>

      {/* Main Layout: Orders List on left + BOM inspector on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Orders Selector Column */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Ordens de Fabricação (PCP)
          </h3>

          {orders.map(order => {
            const isSelected = order.id === selectedOrder?.id;

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                    isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {order.code}
                  </span>
                  {getOrderStatusBadge(order.status)}
                </div>

                <div>
                  <h4 className="font-bold text-sm leading-tight">
                    {order.productName}
                  </h4>
                  <p className={`text-xs mt-0.5 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                    Qtd: <strong>{order.plannedQuantity} un.</strong> &bull; Setor: {order.targetSector}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/40">
                  <span className={isSelected ? 'text-slate-400' : 'text-slate-500'}>
                    Previsão: {new Date(order.targetDate).toLocaleDateString('pt-BR')}
                  </span>
                  <span className={`font-semibold flex items-center gap-1 ${isSelected ? 'text-amber-400' : 'text-amber-600'}`}>
                    <span>Ver BOM</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Order BOM Inspector */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
          {selectedOrder ? (
            <>
              {/* Order Header Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 border">
                      {selectedOrder.code}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedOrder.productName}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Meta de Fabricação: <strong>{selectedOrder.plannedQuantity} unidades</strong> na {selectedOrder.targetSector}
                  </p>
                </div>

                <div className="self-start sm:self-auto">
                  {getOrderStatusBadge(selectedOrder.status)}
                </div>
              </div>

              {/* Bill of Materials (BOM) Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-500" />
                    <span>Lista Técnica de Materiais (BOM Requerida)</span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    {selectedOrder.bom.length} componentes especificados
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-600 border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3">Componente / SKU</th>
                        <th className="p-3">Necessário</th>
                        <th className="p-3">Abastecido</th>
                        <th className="p-3">Saldo Almox.</th>
                        <th className="p-3">Status Peça</th>
                        <th className="p-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.bom.map((bomItem, idx) => {
                        const matchedItem = items.find(i => i.id === bomItem.itemId);
                        const almoxStock = matchedItem ? (matchedItem.stockBySector['almoxarifado-central'] || 0) : 0;
                        const pendingQty = bomItem.requiredQuantity - bomItem.allocatedQuantity;
                        const isFullyAllocated = pendingQty <= 0;
                        const hasAlmoxStock = almoxStock >= pendingQty;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{bomItem.itemName}</div>
                              <div className="font-mono text-[10px] text-slate-400">{bomItem.itemCode}</div>
                            </td>
                            <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">
                              {bomItem.requiredQuantity} {bomItem.unit}
                            </td>
                            <td className="p-3 font-bold whitespace-nowrap">
                              <span className={isFullyAllocated ? 'text-emerald-600' : 'text-slate-800'}>
                                {bomItem.allocatedQuantity} {bomItem.unit}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`font-bold ${almoxStock <= 0 ? 'text-rose-600' : almoxStock < pendingQty ? 'text-amber-600' : 'text-slate-800'}`}>
                                {almoxStock} {bomItem.unit}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              {isFullyAllocated ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 100% Entregue
                                </span>
                              ) : almoxStock <= 0 ? (
                                <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Falta no Estoque
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-sky-700 font-bold text-[11px]">
                                  Disponível para Baixa
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right whitespace-nowrap">
                              {isFullyAllocated ? (
                                <span className="text-slate-400 text-xs font-medium">OK</span>
                              ) : hasAlmoxStock ? (
                                <button
                                  onClick={() => handleRequisition(selectedOrder.id, bomItem.itemId, pendingQty)}
                                  disabled={isRequisitioning}
                                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all"
                                  title="Transferir material do Almoxarifado Central para a Linha de Montagem"
                                >
                                  Requisitar ({pendingQty} {bomItem.unit})
                                </button>
                              ) : (
                                <button
                                  onClick={() => onOpenNewMovement({ type: 'ENTRADA', itemId: bomItem.itemId })}
                                  className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs transition-all"
                                  title="Receber material de fornecedor"
                                >
                                  Receber NF
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-100">
                <span>
                  Responsável pelo PCP: <strong>Engenharia de Produção</strong>
                </span>
                <button
                  onClick={() => onOpenNewMovement({ type: 'SAIDA' })}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all self-end sm:self-auto"
                >
                  Registrar Saída Manual de Material
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Nenhuma ordem selecionada.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
