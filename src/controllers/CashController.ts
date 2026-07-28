import { useMemo, useCallback } from 'react';
import type { AppDatabase, User, CashSession, CashMovement, CashMovementType } from '../models/types';
import { generateId } from '../lib/utils';
import { cashService } from '../services/cashService';

export function useCashController(
  db: AppDatabase,
  setDb: React.Dispatch<React.SetStateAction<AppDatabase>>,
  currentUser: User | null,
  addLog: (action: string, detail: string) => void
) {
  const activeCashSession = useMemo(
    () => (db.cashSessions || []).find((cs) => cs.status === 'abierta') ?? null,
    [db.cashSessions]
  );

  const logSessionMovement = useCallback(
    (
      type: CashMovementType,
      amount: number,
      concept: string,
      reference: string = '',
      details?: Record<string, any>
    ) => {
      const nowIso = new Date().toISOString();
      const movId = generateId('mov');
      const movement: CashMovement = {
        id: movId,
        type,
        amount,
        concept,
        reference,
        details,
        userId: currentUser?.id ?? '',
        userName: currentUser?.name ?? 'Sistema',
        createdAt: nowIso,
      };

      setDb((prev) => {
        const cashSessions = prev.cashSessions.map((cs) =>
          cs.status === 'abierta'
            ? { ...cs, movements: [...(cs.movements || []), movement] }
            : cs
        );
        return { ...prev, cashSessions };
      });

      cashService.insertMovement(movement, activeCashSession?.id).catch(console.error);
    },
    [currentUser, activeCashSession, setDb]
  );

  const openCash = useCallback(
    (amount: number) => {
      const sessionId = generateId('cash');
      const nowIso = new Date().toISOString();
      const session: CashSession = {
        id: sessionId,
        openingAmount: amount,
        closingAmount: null,
        status: 'abierta',
        openedAt: nowIso,
        closedAt: null,
        userId: currentUser?.id ?? 'system',
        userName: currentUser?.name ?? 'Sistema',
        movements: [
          {
            id: generateId('mov'),
            type: 'apertura',
            amount,
            concept: 'Apertura de caja',
            reference: '',
            userId: currentUser?.id ?? 'system',
            userName: currentUser?.name ?? 'Sistema',
            createdAt: nowIso,
          },
        ],
      };

      setDb((prev) => {
        if (prev.cashSessions.some((cs) => cs.status === 'abierta')) return prev;
        return { ...prev, cashSessions: [session, ...prev.cashSessions] };
      });

      addLog('Apertura de Caja', `Caja abierta con base inicial de ${amount}`);
      cashService.openSession(session).catch(console.error);
    },
    [currentUser, setDb, addLog]
  );

  const closeCash = useCallback(
    (amount: number) => {
      const nowIso = new Date().toISOString();

      setDb((prev) => {
        const cashSessions = prev.cashSessions.map((cs) => {
          if (cs.status !== 'abierta') return cs;
          const cierre = {
            id: generateId('mov'),
            type: 'cierre' as const,
            amount,
            concept: 'Cierre de caja',
            reference: '',
            userId: currentUser?.id ?? 'system',
            userName: currentUser?.name ?? 'Sistema',
            createdAt: nowIso,
          };
          return {
            ...cs,
            status: 'cerrada' as const,
            closingAmount: amount,
            closedAt: nowIso,
            movements: [...(cs.movements || []), cierre],
          };
        });
        return { ...prev, cashSessions };
      });

      addLog('Cierre de Caja', `Caja cerrada con monto entregado de ${amount}`);
      if (activeCashSession) {
        cashService.closeSession(activeCashSession.id, amount, nowIso).catch(console.error);
      }
    },
    [currentUser, activeCashSession, setDb, addLog]
  );

  const addCashMovement = useCallback(
    (m: Omit<CashMovement, 'id' | 'createdAt' | 'userId' | 'userName' | 'reference'>) => {
      const movId = generateId('mov');
      const nowIso = new Date().toISOString();
      const movement: CashMovement = {
        ...m,
        id: movId,
        reference: '',
        userId: currentUser?.id ?? 'system',
        userName: currentUser?.name ?? 'Sistema',
        createdAt: nowIso,
      };

      setDb((prev) => {
        const cashSessions = prev.cashSessions.map((cs) =>
          cs.status === 'abierta' ? { ...cs, movements: [...(cs.movements || []), movement] } : cs
        );
        return { ...prev, cashSessions };
      });

      addLog('Movimiento de Caja', `${m.concept} (${m.type.toUpperCase()}): $${m.amount}`);
      cashService.insertMovement(movement, activeCashSession?.id).catch(console.error);
    },
    [currentUser, activeCashSession, setDb, addLog]
  );

  return {
    activeCashSession,
    logSessionMovement,
    openCash,
    closeCash,
    addCashMovement,
  };
}
