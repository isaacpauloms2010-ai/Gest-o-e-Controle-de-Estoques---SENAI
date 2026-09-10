import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Item, 
  ItemCategory, 
  StockStatus, 
  MovementType 
} from '../types';
import { 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  AlertOctagon, 
  History, 
  Settings2, 
  Package, 
  ArrowRight, 
  X, 
  MapPin, 
  Truck, 
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

interface MaterialsViewProps {
  onOpenNewMovement: (prefill?: { type?: MovementType; itemId?: string }) => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({ onOpenNewMovement }) => {
  const { items, sectors, movements, currentUser, createItem, updateItem } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [selectedSector, setSelectedSector] = useState<string>('TODOS');
  
  // Modals
  const [kardexItem, setKardexItem] = useState<Item | null>(null);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for new item
  const [newItemForm, setNewItemForm] = useState({
    code: '',
    name: '',
    category: 'Componentes Mecânicos' as ItemCategory,
    unit: 'UN',
    currentStock: 10,
    minStock: 20,
    criticalStock: 10,
    maxStock: 100,
    unitCost: 25.0,
    locationPrimary: 'Almoxarifado Central - Rua A',
    leadTimeDays: 7,
    supplier: '',
    description: ''
  });

  const categories: ItemCategory[] = [
    'Matéria-Prima',
    'Fixadores & Fixação',
    'Componentes Mecânicos',
    'Insumos & Químicos',
    'Componentes Elétricos',
    'Embalagem'
  ];

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.locationPrimary.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'TODAS' || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'TODOS' || item.status === selectedStatus;
      const matchesSector = selectedSector === 'TODOS' || (item.stockBySector[selectedSector] || 0) > 0;

      return matchesSearch && matchesCategory && matchesStatus && matchesSector;
    });
  }, [items, searchTerm, selectedCategory, selectedStatus, selectedSector]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getStatusBadge = (status: StockStatus) => {
    switch (status) {
      case 'NORMAL':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Normal
        </span>;
      case 'ALERTA':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Abaixo do Mínimo
        </span>;
      case 'CRITICO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-600" /> Estoque Crítico
        </span>;
      case 'RUPTURA':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
          <AlertOctagon className="w-3.5 h-3.5 text-rose-600" /> Ruptura (Zerado)
        </span>;
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createItem({
      ...newItemForm,
      currentStock: Number(newItemForm.currentStock),
      minStock: Number(newItemForm.minStock),
      criticalStock: Number(newItemForm.criticalStock),
      maxStock: Number(newItemForm.maxStock),
      unitCost: Number(newItemForm.unitCost),
      leadTimeDays: Number(newItemForm.leadTimeDays),
      stockBySector: {
        'almoxarifado-central': Number(newItemForm.currentStock)
      }
    });

    if (success) {
      setShowCreateModal(false);
      setNewItemForm({
        code: '',
        name: '',
        category: 'Componentes Mecânicos',
        unit: 'UN',
        currentStock: 10,
        minStock: 20,
        criticalStock: 10,
        maxStock: 100,
        unitCost: 25.0,
        locationPrimary: 'Almoxarifado Central - Rua A',
        leadTimeDays: 7,
        supplier: '',
        description: ''
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    const success = await updateItem(editItem.id, {
      minStock: Number(editItem.minStock),
      criticalStock: Number(editItem.criticalStock),
      maxStock: Number(editItem.maxStock),
      unitCost: Number(editItem.unitCost),
      locationPrimary: editItem.locationPrimary,
      leadTimeDays: Number(editItem.leadTimeDays),
      supplier: editItem.supplier,
      description: editItem.description
    });

    if (success) {
      setEditItem(null);
    }
  };

  const canEditParameters = currentUser?.role === 'GERENTE_MANUFATURA' || currentUser?.role === 'ALMOXARIFE';

  return (
    <div className="space-y-6">

      {/* Header with Search and Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="w-6 h-6 text-amber-500" />
              Catálogo de Materiais & Componentes
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestão de parâmetros de estoque, ponto de reposição, lead-time e rastreabilidade setorial
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {canEditParameters && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-sm transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Novo Material</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar SKU, nome, fornecedor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            />
          </div>

          {/* Filter: Category */}
          <div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            >
              <option value="TODAS">Todas as Categorias</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Filter: Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="NORMAL">Normal</option>
              <option value="ALERTA">Alerta (Abaixo do Mínimo)</option>
              <option value="CRITICO">Crítico</option>
              <option value="RUPTURA">Ruptura (Zerado)</option>
            </select>
          </div>

          {/* Filter: Sector */}
          <div>
            <select
              value={selectedSector}
              onChange={e => setSelectedSector(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            >
              <option value="TODOS">Todos os Setores</option>
              {sectors.map(sec => (
                <option key={sec.id} value={sec.id}>{sec.code} - {sec.name}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Materials List Cards */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Package className="w-12 h-12 mx-auto text-slate-300 stroke-1 mb-2" />
            <h4 className="text-base font-bold text-slate-700">Nenhum material encontrado</h4>
            <p className="text-xs text-slate-400 mt-1">Tente ajustar seus termos de busca ou filtros.</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const stockPercent = Math.min(100, Math.round((item.currentStock / item.maxStock) * 100));
            const minPercent = Math.round((item.minStock / item.maxStock) * 100);
            const critPercent = Math.round((item.criticalStock / item.maxStock) * 100);
            const totalItemValue = item.currentStock * item.unitCost;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {item.code}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {item.category}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Stock Quantity Callout */}
                  <div className="sm:text-right shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <div className="text-xs font-semibold text-slate-500 uppercase">
                      Estoque Físico Total
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900">
                      {item.currentStock} <span className="text-sm font-bold text-slate-500">{item.unit}</span>
                    </div>
                    <div className="text-xs text-slate-600 font-semibold mt-0.5">
                      {formatCurrency(totalItemValue)}
                    </div>
                  </div>
                </div>

                {/* Stock Level Visual Gauge */}
                <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="text-rose-600 font-bold">Crítico: {item.criticalStock} {item.unit}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-amber-600 font-bold">Mínimo: {item.minStock} {item.unit}</span>
                    </span>
                    <span className="text-slate-500">
                      Capacidade Máxima: <strong>{item.maxStock} {item.unit}</strong>
                    </span>
                  </div>

                  {/* Visual Bar with markers */}
                  <div className="relative w-full h-3.5 bg-slate-200 rounded-full overflow-hidden">
                    {/* Fill */}
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        item.status === 'RUPTURA' ? 'bg-rose-500' :
                        item.status === 'CRITICO' ? 'bg-orange-500' :
                        item.status === 'ALERTA' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(item.currentStock > 0 ? 4 : 0, stockPercent)}%` }}
                    />

                    {/* Critical Marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-700/80 z-10"
                      style={{ left: `${critPercent}%` }}
                      title={`Nível Crítico: ${item.criticalStock}`}
                    />

                    {/* Min Marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-700/80 z-10"
                      style={{ left: `${minPercent}%` }}
                      title={`Estoque de Segurança Mínimo: ${item.minStock}`}
                    />
                  </div>
                </div>

                {/* Breakdown by Manufacturing Sector */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Saldos por Setor Fabril:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sectors.map(sec => {
                      const qty = item.stockBySector[sec.id] || 0;
                      return (
                        <div
                          key={sec.id}
                          className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 ${
                            qty > 0
                              ? 'bg-slate-50 border-slate-200 text-slate-800'
                              : 'bg-transparent border-dashed border-slate-200 text-slate-400 opacity-60'
                          }`}
                        >
                          <span className="font-semibold text-slate-600">{sec.code}:</span>
                          <span className={`font-bold ${qty > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                            {qty} {item.unit}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Logistics Info & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.locationPrimary}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.supplier} ({item.leadTimeDays}d lead time)</span>
                    </span>
                    <span>Custo: <strong className="text-slate-800">{formatCurrency(item.unitCost)}</strong>/{item.unit}</span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* View Digital Kardex */}
                    <button
                      onClick={() => setKardexItem(item)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
                      title="Ver Kardex auditável do material"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Kardex</span>
                    </button>

                    {/* Configure Parameters (Manager or Storekeeper) */}
                    {canEditParameters && (
                      <button
                        onClick={() => setEditItem({ ...item })}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                        title="Parametrizar estoque mínimo, crítico e custos"
                      >
                        <Settings2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Quick Move Button */}
                    <button
                      onClick={() => onOpenNewMovement({ itemId: item.id })}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1 transition-colors"
                    >
                      <span>Movimentar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* MODAL: DIGITAL KARDEX (HISTÓRICO AUDITÁVEL) */}
      {kardexItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold">
                    {kardexItem.code}
                  </span>
                  <span className="text-xs text-slate-400">Livro Kardex Digital</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {kardexItem.name}
                </h3>
              </div>
              <button
                onClick={() => setKardexItem(null)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Saldo Atual:</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {kardexItem.currentStock} {kardexItem.unit}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Valor Unitário:</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {formatCurrency(kardexItem.unitCost)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Estoque Mínimo:</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {kardexItem.minStock} {kardexItem.unit}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Localização:</span>
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {kardexItem.locationPrimary}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Registro Cronológico de Movimentações (Kardex)
                </h4>

                {movements.filter(m => m.itemId === kardexItem.id).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Nenhuma movimentação registrada para este item.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Data/Hora</th>
                          <th className="p-2.5">Tipo</th>
                          <th className="p-2.5">Qtd</th>
                          <th className="p-2.5">Origem &rarr; Destino</th>
                          <th className="p-2.5">Doc / Lote</th>
                          <th className="p-2.5">Responsável</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {movements
                          .filter(m => m.itemId === kardexItem.id)
                          .map(m => (
                            <tr key={m.id} className="hover:bg-slate-50/70">
                              <td className="p-2.5 font-mono text-slate-500 whitespace-nowrap">
                                {new Date(m.timestamp).toLocaleDateString('pt-BR')} {new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  m.type === 'ENTRADA' ? 'bg-emerald-100 text-emerald-800' :
                                  m.type === 'SAIDA' ? 'bg-rose-100 text-rose-800' :
                                  m.type === 'TRANSFERENCIA' ? 'bg-sky-100 text-sky-800' :
                                  m.type === 'DEVOLUCAO' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {m.type}
                                </span>
                              </td>
                              <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">
                                {m.type === 'SAIDA' ? '-' : m.type === 'ENTRADA' ? '+' : ''}{Math.abs(m.quantity)} {m.unit}
                              </td>
                              <td className="p-2.5 text-slate-700 whitespace-nowrap">
                                {m.sourceSector} &rarr; <strong>{m.targetSector}</strong>
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                <div className="font-semibold text-slate-800">{m.documentNumber}</div>
                                <div className="text-[10px] text-slate-400">{m.batch}</div>
                              </td>
                              <td className="p-2.5 whitespace-nowrap text-slate-700">
                                {m.responsible}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setKardexItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: EDIT MATERIAL PARAMETERS */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="font-bold text-base">Parâmetros de Estoque</h3>
                <p className="text-xs text-slate-400">{editItem.code} - {editItem.name}</p>
              </div>
              <button onClick={() => setEditItem(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estoque Mínimo ({editItem.unit})</label>
                  <input
                    type="number"
                    min="0"
                    value={editItem.minStock}
                    onChange={e => setEditItem({ ...editItem, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500/30"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Ponto de pedido automático</p>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estoque Crítico ({editItem.unit})</label>
                  <input
                    type="number"
                    min="0"
                    value={editItem.criticalStock}
                    onChange={e => setEditItem({ ...editItem, criticalStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500/30"
                    required
                  />
                  <p className="text-[10px] text-rose-500 mt-0.5">Dispara alerta de parada de fábrica</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Capacidade Máxima ({editItem.unit})</label>
                  <input
                    type="number"
                    min="1"
                    value={editItem.maxStock}
                    onChange={e => setEditItem({ ...editItem, maxStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500/30"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Custo Unitário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editItem.unitCost}
                    onChange={e => setEditItem({ ...editItem, unitCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500/30"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tempo de Reposição (Lead Time em dias)</label>
                  <input
                    type="number"
                    min="1"
                    value={editItem.leadTimeDays}
                    onChange={e => setEditItem({ ...editItem, leadTimeDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500/30"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Endereçamento / Localização</label>
                  <input
                    type="text"
                    value={editItem.locationPrimary}
                    onChange={e => setEditItem({ ...editItem, locationPrimary: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500/30"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fornecedor Homologado</label>
                <input
                  type="text"
                  value={editItem.supplier}
                  onChange={e => setEditItem({ ...editItem, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500/30"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Salvar Parâmetros
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW MATERIAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="font-bold text-base">Cadastrar Novo Material Fabril</h3>
                <p className="text-xs text-slate-400">Adicionar componente ou matéria-prima ao sistema</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código SKU / Part Number</label>
                  <input
                    type="text"
                    placeholder="Ex: INV-MOT-05CV"
                    value={newItemForm.code}
                    onChange={e => setNewItemForm({ ...newItemForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold uppercase focus:ring-2 focus:ring-amber-500/30"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unidade de Medida</label>
                  <select
                    value={newItemForm.unit}
                    onChange={e => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="UN">UN - Unidade</option>
                    <option value="KG">KG - Quilograma</option>
                    <option value="M">M - Metro</option>
                    <option value="M²">M² - Metro Quadrado</option>
                    <option value="L">L - Litro</option>
                    <option value="GL">GL - Galão</option>
                    <option value="CX">CX - Caixa</option>
                    <option value="RL">RL - Rolo</option>
                    <option value="TB">TB - Tambor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição / Nome Completo do Material</label>
                <input
                  type="text"
                  placeholder="Ex: Motor Elétrico Trifásico 5CV 4 Polos 220/380V"
                  value={newItemForm.name}
                  onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500/30"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria de Material</label>
                  <select
                    value={newItemForm.category}
                    onChange={e => setNewItemForm({ ...newItemForm, category: e.target.value as ItemCategory })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500/30"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estoque Inicial (Almoxarifado)</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemForm.currentStock}
                    onChange={e => setNewItemForm({ ...newItemForm, currentStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-amber-500/30"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemForm.minStock}
                    onChange={e => setNewItemForm({ ...newItemForm, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500/30"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Crítico</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemForm.criticalStock}
                    onChange={e => setNewItemForm({ ...newItemForm, criticalStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500/30"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItemForm.unitCost}
                    onChange={e => setNewItemForm({ ...newItemForm, unitCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500/30"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fornecedor</label>
                  <input
                    type="text"
                    placeholder="Ex: WEG Motores"
                    value={newItemForm.supplier}
                    onChange={e => setNewItemForm({ ...newItemForm, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500/30"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Endereçamento Físico</label>
                  <input
                    type="text"
                    placeholder="Rua B - Prateleira 02"
                    value={newItemForm.locationPrimary}
                    onChange={e => setNewItemForm({ ...newItemForm, locationPrimary: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500/30"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Cadastrar Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
