import { GoogleGenAI } from '@google/genai';
import { Item, ProductionOrder, InventoryAudit, Movement } from './types';

let genAIClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return genAIClient;
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

export async function analyzeInventoryWithGemini(
  items: Item[],
  orders: ProductionOrder[],
  movements: Movement[],
  audits: InventoryAudit[]
): Promise<ManufacturingAIInsight> {
  const ai = getAIClient();

  // Fallback heuristic if API key is not configured or in case of network issue
  const generateHeuristicInsight = (): ManufacturingAIInsight => {
    const criticalItems = items.filter(i => i.status === 'CRITICO' || i.status === 'RUPTURA');
    const ordersBlocked = orders.filter(o => o.status === 'AGUARDANDO_MATERIAL');

    const lineStopRisks = criticalItems.map(item => {
      const affected = orders
        .filter(o => o.requiredMaterials.some(m => m.itemId === item.id || m.itemCode === item.code))
        .map(o => `${o.code} (${o.productName})`);

      return {
        itemCode: item.code,
        itemName: item.name,
        currentStock: item.currentStock,
        affectedOrders: affected.length > 0 ? affected : ['Demanda geral das linhas'],
        recommendation: item.currentStock === 0
          ? `RUPTURA ATIVA! Disparar compra emergencial junto à ${item.supplier} com frete dedicado (Lead time: ${item.leadTimeDays} dias).`
          : `Nível abaixo do ponto crítico (${item.currentStock}/${item.criticalStock} ${item.unit}). Emitir pedido suplementar imediato.`
      };
    });

    const smartPurchases = criticalItems.map(item => {
      const suggestedQty = Math.max(item.maxStock - item.currentStock, item.minStock * 2);
      return {
        itemCode: item.code,
        itemName: item.name,
        suggestedQty,
        unit: item.unit,
        estimatedCost: suggestedQty * item.unitCost,
        supplier: item.supplier,
        urgency: (item.status === 'RUPTURA' ? 'IMEDIATA' : 'PREVENTIVA') as 'IMEDIATA' | 'PREVENTIVA'
      };
    });

    return {
      summary: `Diagnóstico Operacional InovaTech: Identificadas ${criticalItems.length} referências em situação de alto risco ou ruptura. Há ${ordersBlocked.length} Ordem(ns) de Produção paralisadas ou sob risco iminente de desabastecimento na linha de montagem.`,
      riskLevel: criticalItems.some(i => i.status === 'RUPTURA') ? 'CRITICO' : 'ALTO',
      lineStopRisks,
      divergenceAnalysis: 'Auditorias recentes demonstram que retiradas de emergência sem baixa no sistema e sobras de montagem não registradas são os principais ofensores da acurácia de inventário. A substituição das requisições em papel por baixas digitais imediatas reduzirá perdas em até 85%.',
      smartPurchases,
      processImprovements: [
        'Instituir leitor de código de barras/código QR móvel na entrega de materiais do almoxarifado para as bancadas de montagem.',
        'Impedir retiradas de emergência sem associação a um número de Ordem de Produção (O.P.) ativa.',
        'Implantar contagem física semanal rotativa (inventário cíclico Classe A) com aprovação gerencial das divergências.',
        'Revisar o estoque de segurança dos itens de fixação e vedações de alto giro.'
      ]
    };
  };

  if (!ai) {
    return generateHeuristicInsight();
  }

  try {
    const prompt = `
Você é o Engenheiro Especialista em Logística e Gestão de Manufatura da InovaTech Manufatura S.A.
Analise os seguintes dados do chão de fábrica e almoxarifado:

ITENS E SALDOS:
${JSON.stringify(items.map(i => ({ code: i.code, name: i.name, stock: i.currentStock, min: i.minStock, crit: i.criticalStock, max: i.maxStock, cost: i.unitCost, supplier: i.supplier, leadTime: i.leadTimeDays, status: i.status })))}

ORDENS DE PRODUÇÃO ATIVAS:
${JSON.stringify(orders.map(o => ({ code: o.code, product: o.productName, status: o.status, reqs: o.requiredMaterials })))}

ÚLTIMAS AUDITORIAS E DIVERGÊNCIAS:
${JSON.stringify(audits.map(a => ({ code: a.code, accuracy: a.accuracyRate, impact: a.financialImpact, divs: a.divergences })))}

Retorne um JSON estritamente válido com a estrutura:
{
  "summary": "Resumo executivo do estado atual da fábrica",
  "riskLevel": "BAIXO" ou "MEDIO" ou "ALTO" ou "CRITICO",
  "lineStopRisks": [
    {
      "itemCode": "código",
      "itemName": "nome",
      "currentStock": 0,
      "affectedOrders": ["OP-xxxx"],
      "recommendation": "ação recomendada"
    }
  ],
  "divergenceAnalysis": "análise da causa-raiz das divergências físicas vs sistema",
  "smartPurchases": [
    {
      "itemCode": "código",
      "itemName": "nome",
      "suggestedQty": 100,
      "unit": "UN",
      "estimatedCost": 1200.0,
      "supplier": "fornecedor",
      "urgency": "IMEDIATA" ou "PREVENTIVA" ou "PROGRAMADA"
    }
  ],
  "processImprovements": [
    "melhoria 1 no processo do almoxarifado",
    "melhoria 2",
    "melhoria 3"
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: 'Você é um consultor sênior de Supply Chain e Manufatura Enxuta (Lean Manufacturing) focado em evitar rupturas de estoque e eliminar desperdícios operacionais.'
      }
    });

    if (response && response.text) {
      const parsed = JSON.parse(response.text.trim());
      return parsed;
    }
  } catch (err) {
    console.error('Erro ao consultar Gemini API, recorrendo a heurística industrial:', err);
  }

  return generateHeuristicInsight();
}
