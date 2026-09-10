import { Router, Request, Response } from 'express';
import { db } from './db';
import { analyzeInventoryWithGemini } from './gemini';

export const apiRouter = Router();

// Healthcheck
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'InovaTech Manufatura S.A. - Gestão de Estoques',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// -------------------------------------------------------------
// ITEMS & STOCK
// -------------------------------------------------------------
apiRouter.get('/items', (req: Request, res: Response) => {
  let items = db.getItems();
  const { sector, status, category, search } = req.query;

  if (sector && typeof sector === 'string') {
    items = items.filter(i => (i.stockBySector[sector] || 0) > 0);
  }

  if (status && typeof status === 'string') {
    items = items.filter(i => i.status === status);
  }

  if (category && typeof category === 'string') {
    items = items.filter(i => i.category === category);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    items = items.filter(i => 
      i.code.toLowerCase().includes(q) ||
      i.name.toLowerCase().includes(q) ||
      i.locationPrimary.toLowerCase().includes(q) ||
      i.supplier.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: items.length, data: items });
});

apiRouter.get('/items/:id', (req: Request, res: Response) => {
  const item = db.getItemById(req.params.id);
  if (!item) {
    res.status(404).json({ success: false, error: 'Material não encontrado.' });
    return;
  }

  const movements = db.getMovements().filter(m => m.itemId === item.id);
  res.json({ success: true, data: { ...item, movements } });
});

apiRouter.post('/items', (req: Request, res: Response) => {
  try {
    const {
      code,
      name,
      category,
      unit,
      currentStock = 0,
      minStock = 10,
      criticalStock = 5,
      maxStock = 100,
      unitCost = 0,
      locationPrimary = 'Almoxarifado Geral',
      leadTimeDays = 7,
      supplier = 'Fornecedor Padrão',
      stockBySector = {},
      description = ''
    } = req.body;

    if (!code || !name || !category || !unit) {
      res.status(400).json({ success: false, error: 'Código, nome, categoria e unidade de medida são obrigatórios.' });
      return;
    }

    // Default primary sector stock if provided
    const initialSectorStock: Record<string, number> = {
      'almoxarifado-central': currentStock,
      ...stockBySector
    };

    const newItem = db.createItem({
      code,
      name,
      category,
      unit,
      currentStock: Number(currentStock),
      minStock: Number(minStock),
      criticalStock: Number(criticalStock),
      maxStock: Number(maxStock),
      unitCost: Number(unitCost),
      locationPrimary,
      leadTimeDays: Number(leadTimeDays),
      supplier,
      stockBySector: initialSectorStock,
      description
    });

    res.status(201).json({ success: true, data: newItem });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Erro ao criar item.' });
  }
});

apiRouter.put('/items/:id', (req: Request, res: Response) => {
  const updated = db.updateItem(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ success: false, error: 'Material não encontrado para atualização.' });
    return;
  }
  res.json({ success: true, data: updated });
});

apiRouter.delete('/items/:id', (req: Request, res: Response) => {
  const deleted = db.deleteItem(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, error: 'Material não encontrado para exclusão.' });
    return;
  }
  res.json({ success: true, message: 'Item excluído com sucesso.' });
});

// -------------------------------------------------------------
// SECTORS
// -------------------------------------------------------------
apiRouter.get('/sectors', (req: Request, res: Response) => {
  const sectors = db.getSectors();
  const items = db.getItems();

  const enriched = sectors.map(s => {
    let totalItems = 0;
    let totalStockUnits = 0;
    let totalFinancialValue = 0;

    items.forEach(item => {
      const qtyInSector = item.stockBySector[s.id] || 0;
      if (qtyInSector > 0) {
        totalItems++;
        totalStockUnits += qtyInSector;
        totalFinancialValue += qtyInSector * item.unitCost;
      }
    });

    return {
      ...s,
      stats: {
        totalItems,
        totalStockUnits,
        totalFinancialValue: Number(totalFinancialValue.toFixed(2))
      }
    };
  });

  res.json({ success: true, data: enriched });
});

// -------------------------------------------------------------
// MOVEMENTS & AUDIT TRAIL (Kardex)
// -------------------------------------------------------------
apiRouter.get('/movements', (req: Request, res: Response) => {
  let movements = db.getMovements();
  const { itemId, type, sector, limit } = req.query;

  if (itemId && typeof itemId === 'string') {
    movements = movements.filter(m => m.itemId === itemId);
  }

  if (type && typeof type === 'string') {
    movements = movements.filter(m => m.type === type);
  }

  if (sector && typeof sector === 'string') {
    movements = movements.filter(m => m.sourceSector === sector || m.targetSector === sector);
  }

  if (limit && !isNaN(Number(limit))) {
    movements = movements.slice(0, Number(limit));
  }

  res.json({ success: true, count: movements.length, data: movements });
});

apiRouter.post('/movements', (req: Request, res: Response) => {
  try {
    const {
      type,
      itemId,
      quantity,
      sourceSector,
      targetSector,
      documentNumber,
      batch,
      responsible,
      responsibleRole,
      notes
    } = req.body;

    if (!type || !itemId || !quantity || !sourceSector || !targetSector || !responsible) {
      res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: tipo, material, quantidade, setor de origem, setor de destino e responsável.'
      });
      return;
    }

    const result = db.recordMovement({
      type,
      itemId,
      quantity: Number(quantity),
      sourceSector,
      targetSector,
      documentNumber: documentNumber || 'AVULSO',
      batch: batch || 'GERAL',
      responsible,
      responsibleRole: responsibleRole || 'Operador',
      notes
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Erro ao registrar movimentação.' });
  }
});

// -------------------------------------------------------------
// AUDITS & DIVERGENCES
// -------------------------------------------------------------
apiRouter.get('/audits', (req: Request, res: Response) => {
  const audits = db.getAudits();
  res.json({ success: true, count: audits.length, data: audits });
});

apiRouter.post('/audits', (req: Request, res: Response) => {
  try {
    const { sectorId, auditor, notes, counts } = req.body;

    if (!sectorId || !auditor || !Array.isArray(counts) || counts.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Setor, auditor e lista de contagens físicas são obrigatórios.'
      });
      return;
    }

    const audit = db.createAudit({ sectorId, auditor, notes, counts });
    res.status(201).json({ success: true, data: audit });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Erro ao registrar contagem de auditoria.' });
  }
});

apiRouter.post('/audits/:id/approve', (req: Request, res: Response) => {
  try {
    const { approvedBy = 'Eng. Roberto Silva' } = req.body;
    const result = db.approveAudit(req.params.id, approvedBy);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Erro ao aprovar auditoria.' });
  }
});

// -------------------------------------------------------------
// PRODUCTION ORDERS & REQUISITIONS
// -------------------------------------------------------------
apiRouter.get('/production-orders', (req: Request, res: Response) => {
  const orders = db.getProductionOrders();
  res.json({ success: true, data: orders });
});

apiRouter.post('/production-orders/:id/requisition', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { itemId, quantity, responsible, responsibleRole } = req.body;
    const orders = db.getProductionOrders();
    const order = orders.find(o => o.id === id || o.code.toLowerCase() === id.toLowerCase());

    if (!order) {
      res.status(404).json({ success: false, error: 'Ordem de Produção não encontrada.' });
      return;
    }

    const reqItem = order.requiredMaterials.find(m => m.itemId === itemId);
    if (!reqItem) {
      res.status(400).json({ success: false, error: 'Item não pertence à lista de materiais desta O.P.' });
      return;
    }

    // Execute transfer from almoxarifado-central to order.sector
    const moveResult = db.recordMovement({
      type: 'SAIDA',
      itemId,
      quantity: Number(quantity),
      sourceSector: 'almoxarifado-central',
      targetSector: 'montagem-principal',
      documentNumber: order.code,
      batch: `LOTE-OP-${order.code}`,
      responsible: responsible || 'Mariana Costa',
      responsibleRole: responsibleRole || 'Operadora de Montagem Líder',
      notes: `Atendimento de requisição para O.P. ${order.code} (${order.productName})`
    });

    if (!moveResult.success) {
      res.status(400).json(moveResult);
      return;
    }

    reqItem.allocatedQty = Math.min(reqItem.requiredQty, reqItem.allocatedQty + Number(quantity));
    
    // Check if order can be marked in production
    const allAllocated = order.requiredMaterials.every(m => m.allocatedQty >= m.requiredQty);
    if (allAllocated) {
      order.status = 'EM_PRODUCAO';
    }

    res.json({ success: true, message: 'Material requisitado e baixado com sucesso.', order, movement: moveResult.movement });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// USERS & RBAC
// -------------------------------------------------------------
apiRouter.get('/users', (req: Request, res: Response) => {
  res.json({ success: true, data: db.getUsers() });
});

// -------------------------------------------------------------
// AI ADVISOR (Gemini)
// -------------------------------------------------------------
apiRouter.post('/ai/analyze', async (req: Request, res: Response) => {
  try {
    const items = db.getItems();
    const orders = db.getProductionOrders();
    const movements = db.getMovements();
    const audits = db.getAudits();

    const insight = await analyzeInventoryWithGemini(items, orders, movements, audits);
    res.json({ success: true, data: insight });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Erro ao gerar análise preditiva.' });
  }
});

// -------------------------------------------------------------
// SYSTEM, EXPORT & ARCHITECTURE
// -------------------------------------------------------------
apiRouter.post('/system/reset', (req: Request, res: Response) => {
  const data = db.resetToDefaults();
  res.json({ success: true, message: 'Dados de manufatura restaurados para padrão de fábrica.', data });
});

apiRouter.get('/system/export', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: db.exportData(),
    sqlSchema: `
-- =============================================================
-- INOVATECH MANUFATURA S.A. | DDL POSTGRESQL / MYSQL SCHEMA
-- =============================================================

CREATE TABLE sectors (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(32) NOT NULL,
    responsible VARCHAR(128) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    unit VARCHAR(16) NOT NULL,
    current_stock NUMERIC(14,3) NOT NULL DEFAULT 0,
    min_stock NUMERIC(14,3) NOT NULL DEFAULT 0,
    critical_stock NUMERIC(14,3) NOT NULL DEFAULT 0,
    max_stock NUMERIC(14,3) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    location_primary VARCHAR(128),
    lead_time_days INT NOT NULL DEFAULT 7,
    supplier VARCHAR(128),
    status VARCHAR(32) NOT NULL DEFAULT 'NORMAL',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE item_sector_stock (
    item_id VARCHAR(64) REFERENCES items(id) ON DELETE CASCADE,
    sector_id VARCHAR(64) REFERENCES sectors(id) ON DELETE CASCADE,
    quantity NUMERIC(14,3) NOT NULL DEFAULT 0,
    PRIMARY KEY (item_id, sector_id)
);

CREATE TABLE movements (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(32) NOT NULL, -- ENTRADA, SAIDA, TRANSFERENCIA, DEVOLUCAO, AJUSTE
    item_id VARCHAR(64) REFERENCES items(id),
    quantity NUMERIC(14,3) NOT NULL,
    source_sector VARCHAR(64),
    target_sector VARCHAR(64),
    document_number VARCHAR(64) NOT NULL, -- NF ou O.P.
    batch VARCHAR(64),
    responsible VARCHAR(128) NOT NULL,
    responsible_role VARCHAR(64) NOT NULL,
    notes TEXT,
    unit_cost NUMERIC(12,2) NOT NULL,
    total_cost NUMERIC(14,2) NOT NULL
);

CREATE INDEX idx_movements_item ON movements(item_id);
CREATE INDEX idx_movements_timestamp ON movements(timestamp);
CREATE INDEX idx_movements_doc ON movements(document_number);

CREATE TABLE inventory_audits (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sector_id VARCHAR(64) REFERENCES sectors(id),
    auditor VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL, -- PENDENTE_APROVACAO, APROVADA_COM_AJUSTE
    accuracy_rate NUMERIC(5,2) NOT NULL,
    financial_impact NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    approved_by VARCHAR(128),
    approved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE audit_divergences (
    id SERIAL PRIMARY KEY,
    audit_id VARCHAR(64) REFERENCES inventory_audits(id) ON DELETE CASCADE,
    item_id VARCHAR(64) REFERENCES items(id),
    system_stock NUMERIC(14,3) NOT NULL,
    physical_stock NUMERIC(14,3) NOT NULL,
    difference NUMERIC(14,3) NOT NULL,
    financial_difference NUMERIC(14,2) NOT NULL,
    reason TEXT,
    adjusted BOOLEAN DEFAULT FALSE
);
    `
  });
});
