import React, { useState } from 'react';
import { 
  FileCode, 
  Terminal, 
  BookOpen, 
  Database, 
  Server, 
  Copy, 
  Check, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Workflow, 
  HardDriveDownload,
  Users,
  CheckCircle2,
  Lock,
  Factory
} from 'lucide-react';

export const ArchitectureDocsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'database' | 'deployment' | 'manual'>('architecture');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedDeploy, setCopiedDeploy] = useState(false);

  const sqlSchema = `-- ============================================================================
-- INOVATECH MANUFATURA S.A. - SCHEMA DE BANCO DE DADOS RELACIONAL (POSTGRESQL)
-- GESTÃO E CONTROLE DE ESTOQUES, KARDEX & AUDITORIA CÍCLICA
-- ============================================================================

-- 1. Tabela de Setores Fabris e Almoxarifados
CREATE TABLE sectors (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('ALMOXARIFADO', 'PRODUCAO', 'QUALIDADE', 'EXPEDICAO')),
    responsible VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Catálogo de Materiais e Componentes
CREATE TABLE items (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    current_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
    min_stock NUMERIC(12, 3) NOT NULL,
    critical_stock NUMERIC(12, 3) NOT NULL,
    max_stock NUMERIC(12, 3) NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL,
    location_primary VARCHAR(100) NOT NULL,
    lead_time_days INTEGER NOT NULL DEFAULT 7,
    supplier VARCHAR(150) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('NORMAL', 'ALERTA', 'CRITICO', 'RUPTURA')),
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Saldo de Materiais por Setor Fabril (Rastreabilidade Multilocal)
CREATE TABLE item_sector_balances (
    item_id VARCHAR(50) REFERENCES items(id) ON DELETE CASCADE,
    sector_id VARCHAR(50) REFERENCES sectors(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    PRIMARY KEY (item_id, sector_id)
);

-- 4. Livro Kardex - Histórico Auditável e Inalterável de Movimentações
CREATE TABLE movements (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(20) NOT NULL CHECK (type IN ('ENTRADA', 'SAIDA', 'TRANSFERENCIA', 'DEVOLUCAO', 'AJUSTE')),
    item_id VARCHAR(50) REFERENCES items(id) ON DELETE RESTRICT,
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    source_sector VARCHAR(100) NOT NULL,
    target_sector VARCHAR(100) NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    batch VARCHAR(100) NOT NULL,
    responsible VARCHAR(100) NOT NULL,
    responsible_role VARCHAR(100) NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL,
    total_cost NUMERIC(12, 2) NOT NULL,
    notes TEXT
);

-- 5. Ordens de Produção (PCP) e BOM
CREATE TABLE production_orders (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(150) NOT NULL,
    planned_quantity INTEGER NOT NULL,
    target_sector VARCHAR(50) REFERENCES sectors(id),
    status VARCHAR(30) NOT NULL CHECK (status IN ('PLANEJADA', 'EM_ANDAMENTO', 'AGUARDANDO_MATERIAL', 'CONCLUIDA')),
    target_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Itens da Lista Técnica da O.P. (Bill of Materials)
CREATE TABLE production_order_bom (
    id VARCHAR(50) PRIMARY KEY,
    production_order_id VARCHAR(50) REFERENCES production_orders(id) ON DELETE CASCADE,
    item_id VARCHAR(50) REFERENCES items(id) ON DELETE RESTRICT,
    required_quantity NUMERIC(12, 3) NOT NULL,
    allocated_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0
);

-- 7. Auditorias de Inventário Cíclico e Divergências
CREATE TABLE inventory_audits (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sector_id VARCHAR(50) REFERENCES sectors(id),
    auditor VARCHAR(100) NOT NULL,
    accuracy_rate NUMERIC(5, 2) NOT NULL,
    financial_impact NUMERIC(12, 2) NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('PENDENTE_APROVACAO', 'APROVADA_COM_AJUSTE')),
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- 8. Índices para Otimização de Consultas em Chão de Fábrica
CREATE INDEX idx_movements_item ON movements(item_id);
CREATE INDEX idx_movements_timestamp ON movements(timestamp DESC);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_code ON items(code);`;

  const copyToClipboard = (text: string, type: 'sql' | 'deploy') => {
    navigator.clipboard.writeText(text);
    if (type === 'sql') {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } else {
      setCopiedDeploy(true);
      setTimeout(() => setCopiedDeploy(false), 2000);
    }
  };

  return (
    <div className="space-y-6">

      {/* Tabs Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FileCode className="w-6 h-6 text-amber-500" />
              Documentação Técnica, Arquitetura & Implantação
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Especificações completas de engenharia de software da InovaTech Manufatura S.A.
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200/80 pb-2">
          
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'architecture'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>1. Arquitetura do Sistema & Fluxo</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'database'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>2. Modelo de Dados & Schema DDL</span>
          </button>

          <button
            onClick={() => setActiveTab('deployment')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'deployment'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>3. Guia de Implantação (Deploy)</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'manual'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>4. Manual de Operação & POP</span>
          </button>

        </div>
      </div>

      {/* TAB 1: ARCHITECTURE */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              Visão Arquitetural Full-Stack em Camadas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                  Camada de Apresentação (Frontend)
                </div>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Stack:</strong> React 18, TypeScript, Tailwind CSS, Lucide Icons.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Interface ergonômica voltada para operadores industriais e gerência. Totalmente responsiva para tablets no chão de fábrica e computadores fixos de almoxarifado.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>
                  Camada de Serviços & API (Backend)
                </div>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Stack:</strong> Node.js, Express, TypeScript, Esbuild.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  API RESTful em <code className="bg-slate-200 px-1 py-0.5 rounded">/api/*</code> encapsulando regras de negócio industriais: cálculo de status dinâmico, validação de saldo setorial e registro imutável no Kardex.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>
                  Camada de Inteligência & Persistência
                </div>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Persistência:</strong> Armazenamento atômico local em arquivo JSON (Singleton) com compatibilidade nativa para PostgreSQL.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  <strong>IA:</strong> Google GenAI SDK (Gemini 3.8 Flash) operando 100% server-side com proteção estrita de segredos e chaves.
                </p>
              </div>

            </div>

            {/* Data Flow Diagram */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Workflow className="w-4 h-4 text-amber-500" />
                Fluxos Operacionais Críticos Mapeados
              </h4>

              <div className="space-y-3 text-xs text-slate-700">
                
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                  <strong className="text-slate-900 block mb-1">
                    1. Fluxo de Recebimento de Matéria-Prima (Entrada com NF):
                  </strong>
                  Fornecedor entrega carga &rarr; Conferente insere NF e Lote no sistema &rarr; Material é creditado no Almoxarifado Central &rarr; Saldo geral e valor financeiro são recalculados &rarr; Registro permanente gerado no Kardex.
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                  <strong className="text-slate-900 block mb-1">
                    2. Fluxo de Abastecimento da Linha de Montagem (Baixa para O.P.):
                  </strong>
                  Engenharia abre O.P. com lista BOM &rarr; Sistema verifica estoque &rarr; Operador clica em "Requisitar Material" &rarr; Débito imediato no Almoxarifado Central e crédito no setor de Montagem &rarr; Prevenção de paralisação da produção.
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                  <strong className="text-slate-900 block mb-1">
                    3. Fluxo de Auditoria Cíclica e Eliminação de Divergências:
                  </strong>
                  Auditor realiza contagem física no setor fabril &rarr; Sistema compara contagem real vs. saldo sistêmico &rarr; Emite relatório com % de acurácia e desvio financeiro em R$ &rarr; Gerente de Manufatura aprova com 1 clique, conciliando os saldos e lançando movimento de ajuste no Kardex.
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: DATABASE */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-500" />
                  Script DDL de Criação do Banco de Dados Relacional
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compatível com PostgreSQL 14+, MySQL 8+ ou Cloud SQL
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(sqlSchema, 'sql')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all"
              >
                {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? 'Copiado!' : 'Copiar Script SQL'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[500px] border border-slate-800 leading-relaxed">
                {sqlSchema}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEPLOYMENT */}
      {activeTab === 'deployment' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-500" />
              Instruções de Instalação & Execução em Produção
            </h3>

            <div className="space-y-4 text-xs">
              
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">
                  A. Execução Local para Desenvolvimento
                </h4>
                <div className="bg-slate-950 text-slate-200 p-3 rounded-xl font-mono text-xs border border-slate-800 space-y-1">
                  <div># 1. Instalar dependências</div>
                  <div className="text-amber-400">npm install</div>
                  <div className="pt-1"># 2. Iniciar servidor Express + Vite na porta 3000</div>
                  <div className="text-amber-400">npm run dev</div>
                  <div className="pt-1 text-slate-400"># Acessar em http://localhost:3000</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">
                  B. Compilação para Produção (Docker / Cloud Run)
                </h4>
                <div className="bg-slate-950 text-slate-200 p-3 rounded-xl font-mono text-xs border border-slate-800 space-y-1">
                  <div># Compilação do bundle React (dist/) e servidor Express (dist/server.cjs)</div>
                  <div className="text-amber-400">npm run build</div>
                  <div className="pt-1"># Inicialização do binário autônomo em produção</div>
                  <div className="text-amber-400">npm start</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">
                  C. Dockerfile Homologado para Manufatura
                </h4>
                <div className="bg-slate-950 text-slate-200 p-3 rounded-xl font-mono text-xs border border-slate-800">
                  <pre>{`FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]`}</pre>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MANUAL & SOP */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              Procedimento Operacional Padrão (POP) & Guia por Perfil
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              {/* Almoxarife */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  Perfil: Almoxarife
                </div>
                <ul className="space-y-2 text-slate-600 list-disc list-inside leading-relaxed">
                  <li>Registrar toda entrada física imediatamente no menu <strong>Movimentar &rarr; Entrada</strong> com número da Nota Fiscal.</li>
                  <li>Atender requisições da produção apenas com baixa no sistema. <strong>Fim do papel!</strong></li>
                  <li>Realizar contagens quinzenais das gavetas de alta rotatividade.</li>
                </ul>
              </div>

              {/* Operador de Produção */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Factory className="w-4 h-4 text-blue-600" />
                  Perfil: Operador de Linha
                </div>
                <ul className="space-y-2 text-slate-600 list-disc list-inside leading-relaxed">
                  <li>Consultar lista BOM da sua Ordem de Produção no menu <strong>Ordens de Produção</strong>.</li>
                  <li>Caso falte parafuso ou componente, usar o botão <strong>Requisitar</strong> em vez de buscar avulso.</li>
                  <li>Sobras de lote montado devem ser registradas como <strong>Devolução</strong> para o almoxarifado.</li>
                </ul>
              </div>

              {/* Gerente de Manufatura */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  Perfil: Gerente de Manufatura
                </div>
                <ul className="space-y-2 text-slate-600 list-disc list-inside leading-relaxed">
                  <li>Monitorar o <strong>Dashboard</strong> no início de cada turno (atenção aos itens em Ruptura).</li>
                  <li>Analisar e aprovar relatórios de divergência no menu <strong>Balanço Físico</strong>.</li>
                  <li>Executar o <strong>Diagnóstico IA Gemini</strong> semanalmente para orientar o departamento de compras.</li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
