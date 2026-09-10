import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Item, 
  Sector, 
  Movement, 
  InventoryAudit, 
  ProductionOrder, 
  SystemUser,
  MovementType 
} from '../types';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface AppContextType {
  items: Item[];
  sectors: Sector[];
  movements: Movement[];
  audits: InventoryAudit[];
  orders: ProductionOrder[];
  users: SystemUser[];
  currentUser: SystemUser | null;
  setCurrentUser: (user: SystemUser) => void;
  isLoading: boolean;
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  refreshData: () => Promise<void>;
  recordMovement: (data: {
    type: MovementType;
    itemId: string;
    quantity: number;
    sourceSector: string;
    targetSector: string;
    documentNumber: string;
    batch: string;
    notes?: string;
  }) => Promise<boolean>;
  createItem: (itemData: any) => Promise<boolean>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  submitAudit: (data: {
    sectorId: string;
    auditor: string;
    notes?: string;
    counts: Array<{ itemId: string; physicalStock: number; reason?: string }>;
  }) => Promise<boolean>;
  approveAudit: (auditId: string) => Promise<boolean>;
  requisitionMaterial: (orderId: string, itemId: string, quantity: number) => Promise<boolean>;
  resetDatabase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [audits, setAudits] = useState<InventoryAudit[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [itemsRes, sectorsRes, movementsRes, auditsRes, ordersRes, usersRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/sectors'),
        fetch('/api/movements'),
        fetch('/api/audits'),
        fetch('/api/production-orders'),
        fetch('/api/users')
      ]);

      const [itemsData, sectorsData, movementsData, auditsData, ordersData, usersData] = await Promise.all([
        itemsRes.json(),
        sectorsRes.json(),
        movementsRes.json(),
        auditsRes.json(),
        ordersRes.json(),
        usersRes.json()
      ]);

      if (itemsData.success) setItems(itemsData.data);
      if (sectorsData.success) setSectors(sectorsData.data);
      if (movementsData.success) setMovements(movementsData.data);
      if (auditsData.success) setAudits(auditsData.data);
      if (ordersData.success) setOrders(ordersData.data);
      if (usersData.success) {
        setUsers(usersData.data);
        if (!currentUser && usersData.data.length > 0) {
          // Default to Almoxarife Carlos Mendes
          setCurrentUser(usersData.data[0]);
        }
      }
    } catch (err: any) {
      console.error('Erro ao sincronizar dados com o backend:', err);
      addToast('Erro ao carregar dados do servidor. Verifique a conexão.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, addToast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const recordMovement = async (data: {
    type: MovementType;
    itemId: string;
    quantity: number;
    sourceSector: string;
    targetSector: string;
    documentNumber: string;
    batch: string;
    notes?: string;
  }): Promise<boolean> => {
    if (!currentUser) {
      addToast('Selecione um usuário ativo para registrar operações.', 'warning');
      return false;
    }

    try {
      const res = await fetch('/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          responsible: currentUser.name,
          responsibleRole: currentUser.roleTitle
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        addToast(json.error || 'Falha ao registrar movimentação.', 'error');
        return false;
      }

      addToast(`Movimentação ${data.type} registrada com sucesso no Kardex!`, 'success');
      await refreshData();
      return true;
    } catch (err: any) {
      addToast(err.message || 'Erro de comunicação ao registrar movimentação.', 'error');
      return false;
    }
  };

  const createItem = async (itemData: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        addToast(json.error || 'Falha ao cadastrar novo material.', 'error');
        return false;
      }

      addToast(`Material ${json.data.code} cadastrado no catálogo!`, 'success');
      await refreshData();
      return true;
    } catch (err: any) {
      addToast(err.message || 'Erro ao cadastrar material.', 'error');
      return false;
    }
  };

  const updateItem = async (id: string, updates: Partial<Item>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        addToast(json.error || 'Falha ao atualizar parâmetros do material.', 'error');
        return false;
      }

      addToast('Parâmetros de estoque atualizados com sucesso.', 'success');
      await refreshData();
      return true;
    } catch (err: any) {
      addToast(err.message || 'Erro ao atualizar material.', 'error');
      return false;
    }
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        addToast(json.error || 'Falha ao excluir material.', 'error');
        return false;
      }

      addToast('Material removido do catálogo.', 'info');
      await refreshData();
      return true;
    } catch (err: any) {
      addToast(err.message || 'Erro ao excluir material.', 'error');
      return false;
    }
  };

  const submitAudit = async (data: {
    sectorId: string;
    auditor: string;
    notes?: string;
    counts: Array<{ itemId: string; physicalStock: number; reason?: string }>;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        addToast(json.error || 'Falha ao salvar contagem de inventário.', 'error');
        return false;
      }

      addToast(`Auditoria ${json.data.code} registrada! Acurácia: ${json.data.accuracyRate}%`, 'success');
      await refreshData();
      return true;
    } catch (err: any) {
      addToast(err.message || 'Erro ao registrar auditoria.', 'error');
      return false;
    }
  };

  const approveAudit = async (auditId: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/audits/${auditId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: currentUser.name })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        addToast(json.error || 'Falha ao aprovar auditoria.', 'error');
        return false;
      }

      addToast('Auditoria aprovada e ajustes conciliados no estoque!', 'success');
      await refreshData();
      return true;
    } catch (err: any) {
      addToast(err.message || 'Erro ao aprovar auditoria.', 'error');
      return false;
    }
  };

  const requisitionMaterial = async (orderId: string, itemId: string, quantity: number): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/production-orders/${orderId}/requisition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          quantity,
          responsible: currentUser.name,
          responsibleRole: currentUser.roleTitle
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        addToast(json.error || 'Falha ao requisitar material para a O.P.', 'error');
        return false;
      }

      addToast('Material transferido do almoxarifado para a Linha de Montagem!', 'success');
      await refreshData();
      return true;
    } catch (err: any) {
      addToast(err.message || 'Erro ao requisitar material.', 'error');
      return false;
    }
  };

  const resetDatabase = async (): Promise<void> => {
    try {
      const res = await fetch('/api/system/reset', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        addToast('Banco de dados restaurado com dados de manufatura padrão.', 'info');
        await refreshData();
      }
    } catch (err: any) {
      addToast('Erro ao restaurar banco de dados.', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        items,
        sectors,
        movements,
        audits,
        orders,
        users,
        currentUser,
        setCurrentUser,
        isLoading,
        toasts,
        addToast,
        removeToast,
        refreshData,
        recordMovement,
        createItem,
        updateItem,
        deleteItem,
        submitAudit,
        approveAudit,
        requisitionMaterial,
        resetDatabase
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser utilizado dentro de um AppProvider');
  }
  return context;
};
