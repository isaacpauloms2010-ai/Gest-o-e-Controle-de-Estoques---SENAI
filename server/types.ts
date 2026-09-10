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
  code: string; // SKU / Part number
  name: string;
  category: ItemCategory;
  unit: string; // UN, KG, M, L, CX, etc.
  currentStock: number;
  minStock: number;
  criticalStock: number;
  maxStock: number;
  unitCost: number; // R$
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
  documentNumber: string; // NF ou OP
  batch: string; // Lote
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
}

export interface AuditDivergence {
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  systemStock: number;
  physicalStock: number;
  difference: number; // physical - system
  financialDifference: number; // diff * unitCost
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
  accuracyRate: number; // %
  financialImpact: number; // R$ líquido
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
  code: string; // OP-4081
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
  badge: string; // Matrícula
  role: UserRole;
  roleTitle: string;
  sector: string;
  email: string;
  avatarBg: string;
  permissions: string[];
}
