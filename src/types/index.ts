export type ItemCategory = 
  | 'Matéria-Prima'
  | 'Fixadores & Fixação'
  | 'Componentes Mecânicos'
  | 'Insumos & Químicos'
  | 'Componentes Elétricos'
  | 'Embalagem';

export type StockStatus = 'NORMAL' | 'ALERTA' | 'CRITICO' | 'RUPTURA';

export interface Item {
  id: string;
  code: string;
  name: string;
  category: ItemCategory;
  unit: string;
  currentStock: number;
  minStock: number;
  criticalStock: number;
  maxStock: number;
  unitCost: number;
  locationPrimary: string;
  leadTimeDays: number;
  supplier: string;
  stockBySector: Record<string, number>;
  lastAuditDate?: string;
  status: StockStatus;
  description?: string;
}

export type MovementType = 
  | 'ENTRADA' 
  | 'SAIDA' 
  | 'TRANSFERENCIA' 
  | 'DEVOLUCAO' 
  | 'AJUSTE';

export interface Movement {
  id: string;
  timestamp: string;
  type: MovementType;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unit: string;
  sourceSector: string;
  targetSector: string;
  documentNumber: string;
  batch: string;
  responsible: string;
  responsibleRole: string;
  notes?: string;
  unitCost: number;
  totalCost: number;
}

export interface Sector {
  id: string;
  code: string;
  name: string;
  type: 'ALMOXARIFADO' | 'PRODUCAO' | 'QUALIDADE' | 'EXPEDICAO';
  responsible: string;
  description: string;
  stats?: {
    totalItems: number;
    totalStockUnits: number;
    totalFinancialValue: number;
  };
}

export interface AuditDivergence {
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
  financialDifference: number;
  reason: string;
  adjusted: boolean;
}

export interface InventoryAudit {
  id: string;
  code: string;
  date: string;
  sectorId: string;
  sectorName: string;
  auditor: string;
  status: 'PENDENTE_APROVACAO' | 'APROVADA_COM_AJUSTE' | 'REJEITADA';
  itemsAudited: number;
  itemsWithDivergence: number;
  accuracyRate: number;
  financialImpact: number;
  divergences: AuditDivergence[];
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface MaterialRequirement {
  itemId: string;
  itemCode: string;
  itemName: string;
  requiredQty: number;
  allocatedQty: number;
  unit: string;
}

export interface ProductionOrder {
  id: string;
  code: string;
  productName: string;
  targetQuantity: number;
  sector: string;
  status: 'PLANEJADA' | 'EM_PRODUCAO' | 'AGUARDANDO_MATERIAL' | 'CONCLUIDA';
  deadline: string;
  requiredMaterials: MaterialRequirement[];
}

export type UserRole = 'ALMOXARIFE' | 'OPERADOR_PRODUCAO' | 'GERENTE_MANUFATURA';

export interface SystemUser {
  id: string;
  name: string;
  badge: string;
  role: UserRole;
  roleTitle: string;
  sector: string;
  email: string;
  avatarBg: string;
  permissions: string[];
}

export interface ManufacturingAIInsight {
  summary: string;
  riskLevel: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  lineStopRisks: Array<{
    itemCode: string;
    itemName: string;
    currentStock: number;
    affectedOrders: string[];
    recommendation: string;
  }>;
  divergenceAnalysis: string;
  smartPurchases: Array<{
    itemCode: string;
    itemName: string;
    suggestedQty: number;
    unit: string;
    estimatedCost: number;
    supplier: string;
    urgency: 'IMEDIATA' | 'PREVENTIVA' | 'PROGRAMADA';
  }>;
  processImprovements: string[];
}
