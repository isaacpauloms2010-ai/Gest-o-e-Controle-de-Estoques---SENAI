import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  MovementType 
} from '../types';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Repeat, 
  RotateCcw, 
  Sliders, 
  Calendar, 
  Search, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Clock,
  User,
  Layers
} from 'lucide-react';

interface MovementsViewProps {
  initialPrefill?: { type?: MovementType; itemId?: string };
}

export const MovementsView: React.FC<MovementsViewProps> = ({ initialPrefill }) => {
  const { items, sectors, movements, currentUser, recordMovement } = useApp();

  // Form State
  const [type, setType] = useState<MovementType>(initialPrefill?.type || 'ENTRADA');
  const [selectedItemId, setSelectedItemId] = useState<string>(initialPrefill?.itemId || (items[0]?.id || ''));
  const [quantity, setQuantity] = useState<number>(10);
  const [sourceSector, setSourceSector] = useState<string>('almoxarifado-central');
  const [targetSector, setTargetSector] = useState<string>('montagem-principal');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [batch, setBatch] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Table Filters
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [filterSector, setFilterSector] = useState<string>('TODOS');
  const [searchDoc, setSearchDoc] = useState<string>('');

  // Selected Item details for balance check
  const selectedItem = useMemo(() => {
    return items.find(i => i.id === selectedItemId);
  }, [items, selectedItemId]);

  // Current balance in source sector
  const sourceBalance = useMemo(() => {
    if (!selectedItem) return 0;
    return selectedItem.stockBySector[sourceSector] || 0;
  }, [selectedItem, sourceSector]);

  // Has enough balance for withdrawal/transfer?
  const hasEnoughBalance = useMemo(() => {
    if (type === 'ENTRADA') return true;
    return sourceBalance >= quantity;
  }, [type, sourceBalance, quantity]);

  const handleTypeChange = (newType: MovementType) => {
    setType(newType);
    if (newType === 'ENTRADA') {
      setSourceSector('Fornecedor Externo');
      setTargetSector('almoxarifado-central');
      setDocumentNumber('NF-e ');
      setBatch('LOTE-2026-');
    } else if (newType === 'SAIDA') {
      setSourceSector('almoxarifado-central');
      setTargetSector('montagem-principal');
      setDocumentNumber('OP-4081');
      setBatch(selectedItem ? `LOTE-${selectedItem.code}` : 'LOTE-PROD');
    } else if (newType === 'TRANSFERENCIA') {
      setSourceSector('almoxarifado-central');
      setTargetSector('usinagem-cnc');
      setDocumentNumber('REQ-TRANSF');
      setBatch('LOTE-INTERNO');
    } else if (newType === 'DEVOLUCAO') {
      setSourceSector('montagem-principal');
      setTargetSector('almoxarifado-central');
      setDocumentNumber('DEV-OP');
      setBatch('LOTE-SOBRA');
    } else if (newType === 'AJUSTE') {
      setSourceSector('almoxarifado-central');
      setTargetSector('almoxarifado-central');
      setDocumentNumber('AUD-AJUSTE');
      setBatch('BALANCO-FISICO');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasEnoughBalance) return;

    setIsSubmitting(true);
    const success = await recordMovement({
      type,
      itemId: selectedItemId,
      quantity: Number(quantity),
      sourceSector,
      targetSector,
      documentNumber: documentNumber || 'DOC-AVULSO',
      batch: batch || 'SEM-LOTE',
      notes
    });

    setIsSubmitting(false);
    if (success) {
      setNotes('');
      // Keep item or reset
    }
  };

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const matchesType = filterType === 'TODOS' || m.type === filterType;
      const matchesSector = filterSector === 'TODOS' || m.sourceSector === filterSector || m.targetSector === filterSector;
      const matchesDoc = searchDoc === '' || 
        m.documentNumber.toLowerCase().includes(searchDoc.toLowerCase()) ||
        m.itemCode.toLowerCase().includes(searchDoc.toLowerCase()) ||
        m.itemName.toLowerCase().includes(searchDoc.toLowerCase()) ||
        m.responsible.toLowerCase().includes(searchDoc.toLowerCase());

      return matchesType && matchesSector && matchesDoc;
    });
  }, [movements, filterType, filterSector, searchDoc]);

  const exportCSV = () => {
    const headers = ['ID', 'Data/Hora', 'Tipo', 'Código Material', 'Nome Material', 'Qtd', 'Unidade', 'Origem', 'Destino', 'Documento', 'Lote', 'Responsável', 'Cargo', 'Custo Total'];
    const rows = filteredMovements.map(m => [
      m.id,
      m.timestamp,
      m.type,
      m.itemCode,
      `"${m.itemName.replace(/"/g, '""')}"`,
      m.quantity,
      m.unit,
      m.sourceSector,
      m.targetSector,
      m.documentNumber,
      m.batch,
      m.responsible,
      m.responsibleRole,
      m.totalCost
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kardex_inovatech_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">

      {/* Terminal de Registro Rápido de Movimentação */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Repeat className="w-6 h-6 text-amber-500" />
              Terminal de Movimentação Operacional
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Registro imediato sem burocracia em papel — rastreabilidade com documento, lote e operador
            </p>
          </div>

          <div className="text-xs text-slate-600 flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>Operador Atual: <strong className="text-slate-900">{currentUser?.name}</strong></span>
          </div>
        </div>

        {/* Operation Type Switcher Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          
          <button
            type="button"
            onClick={() => handleTypeChange('ENTRADA')}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
              type === 'ENTRADA'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-[1.02]'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <ArrowDownRight className="w-5 h-5" />
            <span>1. Entrada (NF)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('SAIDA')}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
              type === 'SAIDA'
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm scale-[1.02]'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <ArrowUpRight className="w-5 h-5" />
            <span>2. Saída (O.P.)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('TRANSFERENCIA')}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
              type === 'TRANSFERENCIA'
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm scale-[1.02]'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Repeat className="w-5 h-5" />
            <span>3. Transferência</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('DEVOLUCAO')}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
              type === 'DEVOLUCAO'
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm scale-[1.02]'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <RotateCcw className="w-5 h-5" />
            <span>4. Devolução</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('AJUSTE')}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
              type === 'AJUSTE'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm scale-[1.02]'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Sliders className="w-5 h-5" />
            <span>5. Ajuste Avulso</span>
          </button>

        </div>

        {/* Transaction Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            
            {/* Select Material */}
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Material / Componente a Movimentar
              </label>
              <select
                value={selectedItemId}
                onChange={e => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                required
              >
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    [{item.code}] {item.name} - Saldo Total: {item.currentStock} {item.unit}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">
                  Quantidade ({selectedItem?.unit || 'UN'})
                </label>
                {type !== 'ENTRADA' && selectedItem && (
                  <span className={`text-[11px] font-bold ${sourceBalance < quantity ? 'text-rose-600' : 'text-emerald-700'}`}>
                    Disp. no setor: {sourceBalance} {selectedItem.unit}
                  </span>
                )}
              </div>
              <input
                type="number"
                min="0.01"
                step="any"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 ${
                  !hasEnoughBalance
                    ? 'border-rose-300 bg-rose-50 text-rose-900 focus:ring-rose-500/30'
                    : 'border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-amber-500/30'
                }`}
                required
              />
            </div>

          </div>

          {/* Insufficient Balance Alert */}
          {!hasEnoughBalance && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Saldo insuficiente!</strong> O setor de origem possui apenas {sourceBalance} {selectedItem?.unit}, mas você solicitou {quantity} {selectedItem?.unit}. Reduza a quantidade ou transfira materiais previamente.
              </span>
            </div>
          )}

          {/* Sectors Routing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Origin */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Origem da Movimentação
              </label>
              {type === 'ENTRADA' ? (
                <input
                  type="text"
                  value={sourceSector}
                  onChange={e => setSourceSector(e.target.value)}
                  placeholder="Nome do Fornecedor / Transportadora"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white"
                  required
                />
              ) : (
                <select
                  value={sourceSector}
                  onChange={e => setSourceSector(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white"
                >
                  {sectors.map(sec => (
                    <option key={sec.id} value={sec.id}>
                      {sec.code} - {sec.name} (Saldo: {selectedItem?.stockBySector[sec.id] || 0} {selectedItem?.unit})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Destination */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Destino da Movimentação
              </label>
              <select
                value={targetSector}
                onChange={e => setTargetSector(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white"
              >
                {sectors.map(sec => (
                  <option key={sec.id} value={sec.id}>
                    {sec.code} - {sec.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Audit Trail Fields: Document, Batch, Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Documento de Referência (NF ou O.P.)
              </label>
              <input
                type="text"
                value={documentNumber}
                onChange={e => setDocumentNumber(e.target.value)}
                placeholder="Ex: NF-e 049210 ou OP-4081"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Lote de Rastreabilidade
              </label>
              <input
                type="text"
                value={batch}
                onChange={e => setBatch(e.target.value)}
                placeholder="Ex: LOTE-SKF-881"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Observação / Justificativa
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex: Montagem das bombas centrífugas"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              />
            </div>

          </div>

          {/* Submit button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={!hasEnoughBalance || isSubmitting}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 ${
                !hasEnoughBalance || isSubmitting
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Confirmar Movimentação & Gravar Kardex</span>
            </button>
          </div>

        </form>

      </div>

      {/* Complete Audit Trail Table (Kardex Geral) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Kardex Auditável Geral ({filteredMovements.length} registros)
            </h3>
            <p className="text-xs text-slate-500">
              Histórico inalterável com carimbo de tempo, responsável e documento comprobatório
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors"
              title="Exportar para Excel / CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Table Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar documento, SKU, operador..."
              value={searchDoc}
              onChange={e => setSearchDoc(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
            />
          </div>

          <div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
            >
              <option value="TODOS">Todos os Tipos de Movimento</option>
              <option value="ENTRADA">Entrada (Recebimento NF)</option>
              <option value="SAIDA">Saída (Consumo O.P.)</option>
              <option value="TRANSFERENCIA">Transferência Setorial</option>
              <option value="DEVOLUCAO">Devolução de Sobra</option>
              <option value="AJUSTE">Ajuste de Inventário</option>
            </select>
          </div>

          <div>
            <select
              value={filterSector}
              onChange={e => setFilterSector(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
            >
              <option value="TODOS">Todos os Setores Envolvidos</option>
              {sectors.map(s => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Data / Hora</th>
                <th className="py-2.5 px-3">Operação</th>
                <th className="py-2.5 px-3">Material</th>
                <th className="py-2.5 px-3">Qtd.</th>
                <th className="py-2.5 px-3">Origem &rarr; Destino</th>
                <th className="py-2.5 px-3">Doc / Lote</th>
                <th className="py-2.5 px-3">Responsável</th>
                <th className="py-2.5 px-3">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Nenhum registro correspondente aos filtros.
                  </td>
                </tr>
              ) : (
                filteredMovements.map(m => {
                  const date = new Date(m.timestamp);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.type === 'ENTRADA' ? 'bg-emerald-100 text-emerald-800' :
                          m.type === 'SAIDA' ? 'bg-rose-100 text-rose-800' :
                          m.type === 'TRANSFERENCIA' ? 'bg-sky-100 text-sky-800' :
                          m.type === 'DEVOLUCAO' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{m.itemName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{m.itemCode}</div>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {m.type === 'SAIDA' ? '-' : m.type === 'ENTRADA' ? '+' : ''}{Math.abs(m.quantity)} {m.unit}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                        <span className="text-slate-500">{m.sourceSector}</span>
                        <span className="mx-1 text-slate-400">&rarr;</span>
                        <strong className="text-slate-800">{m.targetSector}</strong>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{m.documentNumber}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{m.batch}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{m.responsible}</div>
                        <div className="text-[10px] text-slate-400">{m.responsibleRole}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate" title={m.notes}>
                        {m.notes || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
