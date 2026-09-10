import fs from 'fs';
import path from 'path';
import { 
  Item, 
  Sector, 
  Movement, 
  InventoryAudit, 
  AuditDivergence,
  ProductionOrder, 
  SystemUser,
  StockStatus 
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'inventory-db.json');

export function calculateStatus(current: number, min: number, critical: number): StockStatus {
  if (current <= 0) return 'RUPTURA';
  if (current <= critical) return 'CRITICO';
  if (current <= min) return 'ALERTA';
  return 'NORMAL';
}

const DEFAULT_SECTORS: Sector[] = [
  {
    id: 'almoxarifado-central',
    code: 'ALM-01',
    name: 'Almoxarifado Central',
    type: 'ALMOXARIFADO',
    responsible: 'Carlos Mendes',
    description: 'Recepção geral, armazenagem de matéria-prima, componentes e insumos industriais.'
  },
  {
    id: 'usinagem-cnc',
    code: 'USIN-01',
    name: 'Linha de Usinagem CNC',
    type: 'PRODUCAO',
    responsible: 'Marcio Tanaka',
    description: 'Centros de usinagem, tornos CNC e fresadoras para eixos e blocos estruturais.'
  },
  {
    id: 'montagem-principal',
    code: 'MONT-01',
    name: 'Linha de Montagem Mecânica',
    type: 'PRODUCAO',
    responsible: 'Mariana Costa',
    description: 'Montagem de subconjuntos, integração de bombas, redutores e motores.'
  },
  {
    id: 'pintura-acabamento',
    code: 'PINT-01',
    name: 'Pintura & Tratamento Superficial',
    type: 'PRODUCAO',
    responsible: 'Gilberto Alves',
    description: 'Cabines de jateamento, pintura epóxi eletrostática e estufas de cura térmica.'
  },
  {
    id: 'controle-qualidade',
    code: 'CQ-01',
    name: 'Controle de Qualidade & Quarentena',
    type: 'QUALIDADE',
    responsible: 'Dra. Patrícia Lima',
    description: 'Inspeção de recebimento, metrologia tridimensional e testes destrutivos.'
  },
  {
    id: 'expedicao',
    code: 'EXP-01',
    name: 'Expedição & Armazém de Acabados',
    type: 'EXPEDICAO',
    responsible: 'Alexandre Braga',
    description: 'Embalagem final, paletização e despacho rodoviário.'
  }
];

const DEFAULT_USERS: SystemUser[] = [
  {
    id: 'usr-1',
    name: 'Carlos Mendes',
    badge: 'MAT-8841',
    role: 'ALMOXARIFE',
    roleTitle: 'Almoxarife Líder',
    sector: 'Almoxarifado Central',
    email: 'carlos.mendes@inovatech.ind.br',
    avatarBg: 'bg-emerald-600',
    permissions: ['RECEIVE_MATERIALS', 'DISPATCH_MATERIALS', 'TRANSFER_MATERIALS', 'PERFORM_AUDIT']
  },
  {
    id: 'usr-2',
    name: 'Mariana Costa',
    badge: 'MAT-9210',
    role: 'OPERADOR_PRODUCAO',
    roleTitle: 'Operadora de Montagem Líder',
    sector: 'Linha de Montagem Mecânica',
    email: 'mariana.costa@inovatech.ind.br',
    avatarBg: 'bg-blue-600',
    permissions: ['REQUEST_MATERIALS', 'RETURN_MATERIALS', 'VIEW_STOCK', 'REPORT_COUNT']
  },
  {
    id: 'usr-3',
    name: 'Eng. Roberto Silva',
    badge: 'MAT-4022',
    role: 'GERENTE_MANUFATURA',
    roleTitle: 'Gerente Geral de Manufatura',
    sector: 'Gestão de Operações & PCP',
    email: 'roberto.silva@inovatech.ind.br',
    avatarBg: 'bg-purple-600',
    permissions: ['APPROVE_ADJUSTMENTS', 'CONFIGURE_PARAMETERS', 'VIEW_FINANCIALS', 'EXPORT_AUDITS', 'FULL_ADMIN']
  }
];

const DEFAULT_ITEMS: Item[] = [
  {
    id: 'item-101',
    code: 'INV-ROL-6205',
    name: 'Rolamento Rígido de Esferas 6205-2RS C3',
    category: 'Componentes Mecânicos',
    unit: 'UN',
    currentStock: 12,
    minStock: 40,
    criticalStock: 15,
    maxStock: 200,
    unitCost: 38.50,
    locationPrimary: 'Rua B - Prateleira 04 - Vão 02',
    leadTimeDays: 7,
    supplier: 'SKF do Brasil Rolamentos Ltda',
    stockBySector: {
      'almoxarifado-central': 8,
      'montagem-principal': 4,
      'usinagem-cnc': 0,
      'pintura-acabamento': 0,
      'controle-qualidade': 0,
      'expedicao': 0
    },
    lastAuditDate: '2026-08-28T14:30:00.000Z',
    status: 'CRITICO',
    description: 'Componente crítico para montagem das bombas centrífugas BH-200. Blindagem de borracha nitrílica.'
  },
  {
    id: 'item-102',
    code: 'INV-PAR-M0840',
    name: 'Parafuso Sextavado M8x40mm Aço 8.8 Zincado',
    category: 'Fixadores & Fixação',
    unit: 'CX',
    currentStock: 0,
    minStock: 15,
    criticalStock: 5,
    maxStock: 80,
    unitCost: 85.00,
    locationPrimary: 'Rua A - Prateleira 01 - Vão 08',
    leadTimeDays: 3,
    supplier: 'Ciser Parafusos e Porcas S.A.',
    stockBySector: {
      'almoxarifado-central': 0,
      'montagem-principal': 0,
      'usinagem-cnc': 0,
      'pintura-acabamento': 0,
      'controle-qualidade': 0,
      'expedicao': 0
    },
    lastAuditDate: '2026-09-02T10:15:00.000Z',
    status: 'RUPTURA',
    description: 'Caixa com 200 unidades. Parafuso de fixação de cabeçotes. Linha de montagem paralisada aguardando recebimento!'
  },
  {
    id: 'item-103',
    code: 'INV-CHP-1020',
    name: 'Chapa de Aço Carbono SAE 1020 3.00mm x 1200x3000mm',
    category: 'Matéria-Prima',
    unit: 'UN',
    currentStock: 28,
    minStock: 20,
    criticalStock: 10,
    maxStock: 60,
    unitCost: 485.00,
    locationPrimary: 'Pátio A - Cavalete 03',
    leadTimeDays: 12,
    supplier: 'Gerdau Aços Especiais',
    stockBySector: {
      'almoxarifado-central': 20,
      'usinagem-cnc': 8,
      'montagem-principal': 0,
      'pintura-acabamento': 0,
      'controle-qualidade': 0,
      'expedicao': 0
    },
    lastAuditDate: '2026-08-30T16:00:00.000Z',
    status: 'NORMAL',
    description: 'Matéria-prima base para corte a laser e conformação de carcaças estruturais.'
  },
  {
    id: 'item-104',
    code: 'INV-TNT-EPOX',
    name: 'Tinta Epóxi Industrial Cinza Munsell N6.5 (Galão 3.6L)',
    category: 'Insumos & Químicos',
    unit: 'GL',
    currentStock: 18,
    minStock: 25,
    criticalStock: 8,
    maxStock: 100,
    unitCost: 165.00,
    locationPrimary: 'Depósito Químico - Baias Anti-Chama',
    leadTimeDays: 5,
    supplier: 'WEG Tintas Industriais',
    stockBySector: {
      'almoxarifado-central': 12,
      'pintura-acabamento': 6,
      'usinagem-cnc': 0,
      'montagem-principal': 0,
      'controle-qualidade': 0,
      'expedicao': 0
    },
    lastAuditDate: '2026-09-01T09:00:00.000Z',
    status: 'ALERTA',
    description: 'Acabamento protetivo anticorrosivo conforme norma ISO 12944.'
  },
  {
    id: 'item-105',
    code: 'INV-VAL-SOL24',
    name: 'Válvula Solenóide Direcional Hidráulica 24V CC',
    category: 'Componentes Elétricos',
    unit: 'UN',
    currentStock: 14,
    minStock: 12,
    criticalStock: 6,
    maxStock: 50,
    unitCost: 320.00,
    locationPrimary: 'Rua C - Prateleira 02 - Vão 04',
    leadTimeDays: 15,
    supplier: 'Parker Hannifin Brasil',
    stockBySector: {
      'almoxarifado-central': 10,
      'montagem-principal': 3,
      'controle-qualidade': 1,
      'usinagem-cnc': 0,
      'pintura-acabamento': 0,
      'expedicao': 0
    },
    lastAuditDate: '2026-08-25T11:45:00.000Z',
    status: 'NORMAL',
    description: 'Comando eletro-hidráulico de alta precisão para atuação nos sistemas pressurizados.'
  },
  {
    id: 'item-106',
    code: 'INV-CAB-FLEX',
    name: 'Cabo Flexível de Cobre 2,5mm² 750V Preto (Rolo 100m)',
    category: 'Componentes Elétricos',
    unit: 'RL',
    currentStock: 9,
    minStock: 10,
    criticalStock: 4,
    maxStock: 40,
    unitCost: 195.00,
    locationPrimary: 'Rua C - Prateleira 05 - Vão 01',
    leadTimeDays: 4,
    supplier: 'Prysmian Cabos e Sistemas',
    stockBySector: {
      'almoxarifado-central': 6,
      'montagem-principal': 3,
      'usinagem-cnc': 0,
      'pintura-acabamento': 0,
      'controle-qualidade': 0,
      'expedicao': 0
    },
    lastAuditDate: '2026-08-29T15:20:00.000Z',
    status: 'ALERTA',
    description: 'Condutor elétrico para painéis de comando e botoeiras operacionais.'
  },
  {
    id: 'item-107',
    code: 'INV-SEL-VITON',
    name: 'Selo Mecânico Balanceado Viton / Carbeto de Silício 28mm',
    category: 'Componentes Mecânicos',
    unit: 'UN',
    currentStock: 6,
    minStock: 15,
    criticalStock: 8,
    maxStock: 50,
    unitCost: 410.00,
    locationPrimary: 'Armário Seguro A - Gaveta 03',
    leadTimeDays: 10,
    supplier: 'John Crane Brasil Vedações',
    stockBySector: {
      'almoxarifado-central': 4,
      'montagem-principal': 2,
      'usinagem-cnc': 0,
      'pintura-acabamento': 0,
      'controle-qualidade': 0,
      'expedicao': 0
    },
    lastAuditDate: '2026-09-04T14:10:00.000Z',
    status: 'CRITICO',
    description: 'Vedação primária para fluidos agressivos e alta temperatura.'
  },
  {
    id: 'item-108',
    code: 'INV-EMB-CX30',
    name: 'Caixa de Madeira e Papelão Duplo Paletizável 1200x800mm',
    category: 'Embalagem',
    unit: 'UN',
    currentStock: 45,
    minStock: 30,
    criticalStock: 12,
    maxStock: 120,
    unitCost: 72.00,
    locationPrimary: 'Armazém Externo - Baia 05',
    leadTimeDays: 3,
    supplier: 'Klabin Embalagens',
    stockBySector: {
      'almoxarifado-central': 35,
      'expedicao': 10,
      'usinagem-cnc': 0,
      'montagem-principal': 0,
      'pintura-acabamento': 0,
      'controle-qualidade': 0
    },
    lastAuditDate: '2026-08-20T17:00:00.000Z',
    status: 'NORMAL',
    description: 'Embalagem robusta para transporte e exportação de produtos montados.'
  },
  {
    id: 'item-109',
    code: 'INV-OLE-CORTE',
    name: 'Óleo Solúvel Refrigerante para Usinagem CNC (Tambor 200L)',
    category: 'Insumos & Químicos',
    unit: 'TB',
    currentStock: 3,
    minStock: 4,
    criticalStock: 2,
    maxStock: 12,
    unitCost: 1450.00,
    locationPrimary: 'Depósito Químico - Baia de Óleos',
    leadTimeDays: 6,
    supplier: 'Castrol Industrial do Brasil',
    stockBySector: {
      'almoxarifado-central': 2,
      'usinagem-cnc': 1,
      'montagem-principal': 0,
      'pintura-acabamento': 0,
      'controle-qualidade': 0,
      'expedicao': 0
    },
    lastAuditDate: '2026-08-15T11:00:00.000Z',
    status: 'ALERTA',
    description: 'Fluido de refrigeração e lubrificação para centros de usinagem e fresadoras.'
  }
];

const DEFAULT_MOVEMENTS: Movement[] = [
  {
    id: 'mov-1001',
    timestamp: '2026-09-08T08:15:00.000Z',
    type: 'ENTRADA',
    itemId: 'item-103',
    itemCode: 'INV-CHP-1020',
    itemName: 'Chapa de Aço Carbono SAE 1020 3.00mm',
    quantity: 15,
    unit: 'UN',
    sourceSector: 'Fornecedor Gerdau',
    targetSector: 'almoxarifado-central',
    documentNumber: 'NF-e 049.201',
    batch: 'LOTE-GERD-26B',
    responsible: 'Carlos Mendes',
    responsibleRole: 'Almoxarife Líder',
    notes: 'Recebimento de lote com certificado de composição química aprovado pelo CQ.',
    unitCost: 485.00,
    totalCost: 7275.00
  },
  {
    id: 'mov-1002',
    timestamp: '2026-09-08T10:45:00.000Z',
    type: 'TRANSFERENCIA',
    itemId: 'item-103',
    itemCode: 'INV-CHP-1020',
    itemName: 'Chapa de Aço Carbono SAE 1020 3.00mm',
    quantity: 4,
    unit: 'UN',
    sourceSector: 'almoxarifado-central',
    targetSector: 'usinagem-cnc',
    documentNumber: 'REQ-INT-891',
    batch: 'LOTE-GERD-26B',
    responsible: 'Carlos Mendes',
    responsibleRole: 'Almoxarife Líder',
    notes: 'Transferência para abastecimento da bancada de corte e fresamento.',
    unitCost: 485.00,
    totalCost: 1940.00
  },
  {
    id: 'mov-1003',
    timestamp: '2026-09-09T09:20:00.000Z',
    type: 'SAIDA',
    itemId: 'item-101',
    itemCode: 'INV-ROL-6205',
    itemName: 'Rolamento Rígido de Esferas 6205-2RS C3',
    quantity: 16,
    unit: 'UN',
    sourceSector: 'almoxarifado-central',
    targetSector: 'montagem-principal',
    documentNumber: 'OP-4081',
    batch: 'LOTE-SKF-881',
    responsible: 'Mariana Costa',
    responsibleRole: 'Operadora de Montagem Líder',
    notes: 'Consumo para montagem de 8 bombas centrífugas BH-200 na O.P. 4081.',
    unitCost: 38.50,
    totalCost: 616.00
  },
  {
    id: 'mov-1004',
    timestamp: '2026-09-09T14:00:00.000Z',
    type: 'SAIDA',
    itemId: 'item-102',
    itemCode: 'INV-PAR-M0840',
    itemName: 'Parafuso Sextavado M8x40mm Aço 8.8 Zincado',
    quantity: 8,
    unit: 'CX',
    sourceSector: 'almoxarifado-central',
    targetSector: 'montagem-principal',
    documentNumber: 'OP-4081',
    batch: 'LOTE-CIS-441',
    responsible: 'Mariana Costa',
    responsibleRole: 'Operadora de Montagem Líder',
    notes: 'Fixação geral dos flanges e carcaça das bombas. Esgotou saldo do almoxarifado!',
    unitCost: 85.00,
    totalCost: 680.00
  },
  {
    id: 'mov-1005',
    timestamp: '2026-09-09T16:30:00.000Z',
    type: 'DEVOLUCAO',
    itemId: 'item-106',
    itemCode: 'INV-CAB-FLEX',
    itemName: 'Cabo Flexível de Cobre 2,5mm² 750V Preto',
    quantity: 1,
    unit: 'RL',
    sourceSector: 'montagem-principal',
    targetSector: 'almoxarifado-central',
    documentNumber: 'DEV-OP-4079',
    batch: 'LOTE-PRYS-120',
    responsible: 'Mariana Costa',
    responsibleRole: 'Operadora de Montagem Líder',
    notes: 'Devolução de rolo não utilizado na finalização dos painéis da O.P. 4079.',
    unitCost: 195.00,
    totalCost: 195.00
  },
  {
    id: 'mov-1006',
    timestamp: '2026-09-10T08:00:00.000Z',
    type: 'AJUSTE',
    itemId: 'item-107',
    itemCode: 'INV-SEL-VITON',
    itemName: 'Selo Mecânico Balanceado Viton / Carbeto de Silício 28mm',
    quantity: -2,
    unit: 'UN',
    sourceSector: 'almoxarifado-central',
    targetSector: 'almoxarifado-central',
    documentNumber: 'AUD-2026-039',
    batch: 'LOTE-JC-909',
    responsible: 'Eng. Roberto Silva',
    responsibleRole: 'Gerente Geral de Manufatura',
    notes: 'Ajuste de inventário decorrente de peça avariada por queda na gaveta de armazenamento.',
    unitCost: 410.00,
    totalCost: -820.00
  }
];

const DEFAULT_AUDITS: InventoryAudit[] = [
  {
    id: 'aud-039',
    code: 'AUD-2026-039',
    date: '2026-09-07T15:00:00.000Z',
    sectorId: 'almoxarifado-central',
    sectorName: 'Almoxarifado Central',
    auditor: 'Carlos Mendes',
    status: 'APROVADA_COM_AJUSTE',
    itemsAudited: 6,
    itemsWithDivergence: 2,
    accuracyRate: 66.7,
    financialImpact: -820.00,
    notes: 'Auditoria quinzenal de componentes de precisão. Constatada avaria física em 2 selos mecânicos.',
    approvedBy: 'Eng. Roberto Silva',
    approvedAt: '2026-09-08T09:30:00.000Z',
    divergences: [
      {
        itemId: 'item-107',
        itemCode: 'INV-SEL-VITON',
        itemName: 'Selo Mecânico Balanceado Viton 28mm',
        unit: 'UN',
        systemStock: 8,
        physicalStock: 6,
        difference: -2,
        financialDifference: -820.00,
        reason: 'Avaria/Queda no manuseio interno',
        adjusted: true
      },
      {
        itemId: 'item-101',
        itemCode: 'INV-ROL-6205',
        itemName: 'Rolamento Rígido de Esferas 6205-2RS C3',
        unit: 'UN',
        systemStock: 30,
        physicalStock: 28,
        difference: -2,
        financialDifference: -77.00,
        reason: 'Retirada rápida de emergência sem baixa manual no papel',
        adjusted: true
      }
    ]
  },
  {
    id: 'aud-040',
    code: 'AUD-2026-040',
    date: '2026-09-10T11:30:00.000Z',
    sectorId: 'montagem-principal',
    sectorName: 'Linha de Montagem Mecânica',
    auditor: 'Mariana Costa',
    status: 'PENDENTE_APROVACAO',
    itemsAudited: 4,
    itemsWithDivergence: 1,
    accuracyRate: 75.0,
    financialImpact: 115.50,
    notes: 'Contagem física cíclica da linha de montagem. Constatado excedente de 3 rolamentos retornados de teste.',
    divergences: [
      {
        itemId: 'item-101',
        itemCode: 'INV-ROL-6205',
        itemName: 'Rolamento Rígido de Esferas 6205-2RS C3',
        unit: 'UN',
        systemStock: 1,
        physicalStock: 4,
        difference: 3,
        financialDifference: 115.50,
        reason: 'Sobra não apontada da ordem de montagem anterior',
        adjusted: false
      }
    ]
  }
];

const DEFAULT_ORDERS: ProductionOrder[] = [
  {
    id: 'op-4081',
    code: 'OP-4081',
    productName: 'Bomba Centrífuga Industrial Mod. BH-200',
    targetQuantity: 10,
    sector: 'Linha de Montagem Mecânica',
    status: 'AGUARDANDO_MATERIAL',
    deadline: '2026-09-15',
    requiredMaterials: [
      { itemId: 'item-101', itemCode: 'INV-ROL-6205', itemName: 'Rolamento 6205-2RS', requiredQty: 20, allocatedQty: 16, unit: 'UN' },
      { itemId: 'item-102', itemCode: 'INV-PAR-M0840', itemName: 'Parafuso M8x40mm', requiredQty: 10, allocatedQty: 8, unit: 'CX' },
      { itemId: 'item-107', itemCode: 'INV-SEL-VITON', itemName: 'Selo Mecânico Viton', requiredQty: 10, allocatedQty: 6, unit: 'UN' }
    ]
  },
  {
    id: 'op-4082',
    code: 'OP-4082',
    productName: 'Mancal Bipartido de Aço Fundido MB-120',
    targetQuantity: 25,
    sector: 'Linha de Usinagem CNC',
    status: 'EM_PRODUCAO',
    deadline: '2026-09-18',
    requiredMaterials: [
      { itemId: 'item-103', itemCode: 'INV-CHP-1020', itemName: 'Chapa Aço 1020 3mm', requiredQty: 12, allocatedQty: 12, unit: 'UN' },
      { itemId: 'item-109', itemCode: 'INV-OLE-CORTE', itemName: 'Óleo Solúvel Usinagem', requiredQty: 1, allocatedQty: 1, unit: 'TB' }
    ]
  },
  {
    id: 'op-4083',
    code: 'OP-4083',
    productName: 'Unidade Hidráulica Pressurizada UHP-50L',
    targetQuantity: 5,
    sector: 'Linha de Montagem Mecânica',
    status: 'PLANEJADA',
    deadline: '2026-09-22',
    requiredMaterials: [
      { itemId: 'item-105', itemCode: 'INV-VAL-SOL24', itemName: 'Válvula Solenóide 24V', requiredQty: 5, allocatedQty: 3, unit: 'UN' },
      { itemId: 'item-106', itemCode: 'INV-CAB-FLEX', itemName: 'Cabo Flexível 2.5mm', requiredQty: 3, allocatedQty: 3, unit: 'RL' },
      { itemId: 'item-104', itemCode: 'INV-TNT-EPOX', itemName: 'Tinta Epóxi Cinza', requiredQty: 4, allocatedQty: 2, unit: 'GL' }
    ]
  }
];

interface DatabaseSchema {
  items: Item[];
  sectors: Sector[];
  movements: Movement[];
  audits: InventoryAudit[];
  productionOrders: ProductionOrder[];
  users: SystemUser[];
  lastUpdated: string;
}

class InventoryDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (err) {
      console.warn('Falha ao carregar banco do arquivo, inicializando padrão:', err);
    }

    const initialData: DatabaseSchema = {
      items: DEFAULT_ITEMS,
      sectors: DEFAULT_SECTORS,
      movements: DEFAULT_MOVEMENTS,
      audits: DEFAULT_AUDITS,
      productionOrders: DEFAULT_ORDERS,
      users: DEFAULT_USERS,
      lastUpdated: new Date().toISOString()
    };

    this.save(initialData);
    return initialData;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = dataToSave || this.data;
      data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Erro ao salvar dados no disco:', err);
    }
  }

  // Items
  getItems(): Item[] {
    return this.data.items;
  }

  getItemById(id: string): Item | undefined {
    return this.data.items.find(i => i.id === id || i.code.toLowerCase() === id.toLowerCase());
  }

  createItem(itemData: Omit<Item, 'id' | 'status'>): Item {
    const newId = `item-${Date.now()}`;
    const status = calculateStatus(itemData.currentStock, itemData.minStock, itemData.criticalStock);
    
    // Ensure sectors are initialized
    const stockBySector: Record<string, number> = { ...itemData.stockBySector };
    this.data.sectors.forEach(s => {
      if (stockBySector[s.id] === undefined) {
        stockBySector[s.id] = 0;
      }
    });

    const newItem: Item = {
      ...itemData,
      id: newId,
      status,
      stockBySector
    };

    this.data.items.unshift(newItem);
    this.save();
    return newItem;
  }

  updateItem(id: string, updates: Partial<Item>): Item | null {
    const idx = this.data.items.findIndex(i => i.id === id);
    if (idx === -1) return null;

    const current = this.data.items[idx];
    const updated = { ...current, ...updates };
    
    // Recompute status
    updated.status = calculateStatus(updated.currentStock, updated.minStock, updated.criticalStock);
    this.data.items[idx] = updated;
    this.save();
    return updated;
  }

  deleteItem(id: string): boolean {
    const initialLen = this.data.items.length;
    this.data.items = this.data.items.filter(i => i.id !== id);
    if (this.data.items.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Sectors
  getSectors(): Sector[] {
    return this.data.sectors;
  }

  // Movements (Audit Trail / Kardex)
  getMovements(): Movement[] {
    return this.data.movements;
  }

  recordMovement(movementInput: {
    type: Movement['type'];
    itemId: string;
    quantity: number;
    sourceSector: string;
    targetSector: string;
    documentNumber: string;
    batch: string;
    responsible: string;
    responsibleRole: string;
    notes?: string;
  }): { success: boolean; movement?: Movement; error?: string } {
    const item = this.getItemById(movementInput.itemId);
    if (!item) {
      return { success: false, error: 'Material/Item não encontrado no catálogo.' };
    }

    if (movementInput.quantity <= 0) {
      return { success: false, error: 'A quantidade movimentada deve ser estritamente positiva.' };
    }

    const { type, quantity, sourceSector, targetSector } = movementInput;

    // Validate sector balances
    if (type === 'SAIDA' || type === 'TRANSFERENCIA') {
      const sourceBalance = item.stockBySector[sourceSector] || 0;
      if (sourceBalance < quantity) {
        return {
          success: false,
          error: `Saldo insuficiente no setor de origem. Saldo atual: ${sourceBalance} ${item.unit}, solicitado: ${quantity} ${item.unit}.`
        };
      }
    }

    // Apply stock modifications
    if (type === 'ENTRADA') {
      item.stockBySector[targetSector] = (item.stockBySector[targetSector] || 0) + quantity;
      item.currentStock += quantity;
    } else if (type === 'SAIDA') {
      item.stockBySector[sourceSector] = (item.stockBySector[sourceSector] || 0) - quantity;
      item.currentStock -= quantity;
    } else if (type === 'TRANSFERENCIA') {
      item.stockBySector[sourceSector] = (item.stockBySector[sourceSector] || 0) - quantity;
      item.stockBySector[targetSector] = (item.stockBySector[targetSector] || 0) + quantity;
    } else if (type === 'DEVOLUCAO') {
      item.stockBySector[sourceSector] = Math.max(0, (item.stockBySector[sourceSector] || 0) - quantity);
      item.stockBySector[targetSector] = (item.stockBySector[targetSector] || 0) + quantity;
      item.currentStock += quantity;
    } else if (type === 'AJUSTE') {
      // Adjustment can be negative or positive
      item.stockBySector[targetSector] = Math.max(0, (item.stockBySector[targetSector] || 0) + quantity);
      // Recalculate total
      item.currentStock = Object.values(item.stockBySector).reduce((a, b) => a + b, 0);
    }

    item.status = calculateStatus(item.currentStock, item.minStock, item.criticalStock);

    const movement: Movement = {
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      quantity,
      unit: item.unit,
      sourceSector,
      targetSector,
      documentNumber: movementInput.documentNumber || 'AVULSO',
      batch: movementInput.batch || 'SEM-LOTE',
      responsible: movementInput.responsible,
      responsibleRole: movementInput.responsibleRole,
      notes: movementInput.notes || '',
      unitCost: item.unitCost,
      totalCost: item.unitCost * quantity
    };

    this.data.movements.unshift(movement);
    this.save();

    return { success: true, movement };
  }

  // Audits & Physical Counts
  getAudits(): InventoryAudit[] {
    return this.data.audits;
  }

  createAudit(auditInput: {
    sectorId: string;
    auditor: string;
    notes?: string;
    counts: Array<{ itemId: string; physicalStock: number; reason?: string }>;
  }): InventoryAudit {
    const sector = this.data.sectors.find(s => s.id === auditInput.sectorId);
    const sectorName = sector ? sector.name : 'Geral';
    const auditCode = `AUD-2026-${String(this.data.audits.length + 41).padStart(3, '0')}`;

    const divergences: AuditDivergence[] = [];
    let itemsWithDivergence = 0;
    let netFinancialImpact = 0;

    for (const count of auditInput.counts) {
      const item = this.getItemById(count.itemId);
      if (!item) continue;

      const systemStock = item.stockBySector[auditInput.sectorId] ?? 0;
      const difference = count.physicalStock - systemStock;
      const finDiff = difference * item.unitCost;

      if (difference !== 0) {
        itemsWithDivergence++;
        netFinancialImpact += finDiff;
        divergences.push({
          itemId: item.id,
          itemCode: item.code,
          itemName: item.name,
          unit: item.unit,
          systemStock,
          physicalStock: count.physicalStock,
          difference,
          financialDifference: finDiff,
          reason: count.reason || 'Contagem física divergente do sistema',
          adjusted: false
        });
      }
    }

    const itemsAudited = auditInput.counts.length;
    const accuracyRate = itemsAudited > 0
      ? Number((((itemsAudited - itemsWithDivergence) / itemsAudited) * 100).toFixed(1))
      : 100;

    const audit: InventoryAudit = {
      id: `aud-${Date.now()}`,
      code: auditCode,
      date: new Date().toISOString(),
      sectorId: auditInput.sectorId,
      sectorName,
      auditor: auditInput.auditor,
      status: itemsWithDivergence === 0 ? 'APROVADA_COM_AJUSTE' : 'PENDENTE_APROVACAO',
      itemsAudited,
      itemsWithDivergence,
      accuracyRate,
      financialImpact: Number(netFinancialImpact.toFixed(2)),
      divergences,
      notes: auditInput.notes || ''
    };

    this.data.audits.unshift(audit);
    this.save();
    return audit;
  }

  approveAudit(auditId: string, approvedBy: string): { success: boolean; audit?: InventoryAudit; error?: string } {
    const audit = this.data.audits.find(a => a.id === auditId);
    if (!audit) {
      return { success: false, error: 'Auditoria não encontrada.' };
    }

    if (audit.status === 'APROVADA_COM_AJUSTE') {
      return { success: false, error: 'Esta auditoria já foi aprovada e ajustada anteriormente.' };
    }

    // Apply adjustments to stock and record in Kardex
    for (const div of audit.divergences) {
      if (!div.adjusted && div.difference !== 0) {
        const item = this.getItemById(div.itemId);
        if (item) {
          item.stockBySector[audit.sectorId] = div.physicalStock;
          item.currentStock = Object.values(item.stockBySector).reduce((a, b) => a + b, 0);
          item.status = calculateStatus(item.currentStock, item.minStock, item.criticalStock);
          item.lastAuditDate = new Date().toISOString();

          // Kardex entry
          const movement: Movement = {
            id: `mov-${Date.now()}-${div.itemCode}`,
            timestamp: new Date().toISOString(),
            type: 'AJUSTE',
            itemId: item.id,
            itemCode: item.code,
            itemName: item.name,
            quantity: div.difference,
            unit: item.unit,
            sourceSector: audit.sectorId,
            targetSector: audit.sectorId,
            documentNumber: audit.code,
            batch: 'CONCILIACAO-INVENTARIO',
            responsible: approvedBy,
            responsibleRole: 'Gerente Geral de Manufatura',
            notes: `Ajuste aprovado: ${div.reason}`,
            unitCost: item.unitCost,
            totalCost: div.financialDifference
          };
          this.data.movements.unshift(movement);
          div.adjusted = true;
        }
      }
    }

    audit.status = 'APROVADA_COM_AJUSTE';
    audit.approvedBy = approvedBy;
    audit.approvedAt = new Date().toISOString();

    this.save();
    return { success: true, audit };
  }

  // Production Orders
  getProductionOrders(): ProductionOrder[] {
    return this.data.productionOrders;
  }

  // Users
  getUsers(): SystemUser[] {
    return this.data.users;
  }

  // Reset database to initial manufacturing defaults
  resetToDefaults() {
    this.data = {
      items: JSON.parse(JSON.stringify(DEFAULT_ITEMS)),
      sectors: JSON.parse(JSON.stringify(DEFAULT_SECTORS)),
      movements: JSON.parse(JSON.stringify(DEFAULT_MOVEMENTS)),
      audits: JSON.parse(JSON.stringify(DEFAULT_AUDITS)),
      productionOrders: JSON.parse(JSON.stringify(DEFAULT_ORDERS)),
      users: JSON.parse(JSON.stringify(DEFAULT_USERS)),
      lastUpdated: new Date().toISOString()
    };
    this.save();
    return this.data;
  }

  exportData(): DatabaseSchema {
    return this.data;
  }
}

export const db = new InventoryDatabase();
