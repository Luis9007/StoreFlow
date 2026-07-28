/**
 * @file CashController.ts
 * @description Controlador Hook de React para la apertura, cierre y gestión de movimientos de caja.
 * 
 * RELACIÓN CON EL SERVICIO (`src/services/cashService.ts`):
 * - Maneja el estado en memoria de las sesiones de caja (`activeCashSession`) y sus movimientos financieros.
 * - Sincroniza las operaciones con el servidor remoto invocando los métodos de `cashService`:
 *    • `openCash()` ➔ `cashService.openSession(session)`
 *    • `closeCash()` ➔ `cashService.closeSession(...)`
 *    • `addCashMovement()` y `logSessionMovement()` ➔ `cashService.insertMovement(...)`
 */

import { useMemo, useCallback } from 'react';
import type { AppDatabase, User, CashSession, CashMovement, CashMovementType } from '../models/types';
import { generateId } from '../lib/utils';
import { cashService } from '../services/cashService';

/**
 * Custom Hook que administra la caja registradora, turnos y movimientos de efectivo.
 */
export function useCashController(
  db: AppDatabase,
  setDb: React.Dispatch<React.SetStateAction<AppDatabase>>,
  currentUser: User | null,
  addLog: (action: string, detail: string) => void
) {
  /**
   * Obtiene la sesión de caja actualmente abierta (si existe).
   */
  const activeCashSession = useMemo(
    () => (db.cashSessions || []).find((cs) => cs.status === 'abierta') ?? null,
    [db.cashSessions]
  );

  /**
   * Función utilitaria para registrar movimientos automáticos del sistema o de la sesión (ej. ventas, nuevos clientes).
   * Inserta el movimiento en la caja abierta y lo sincroniza en Supabase vía `cashService.insertMovement(...)`.
   */
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

      // Llama a la API a través del servicio
      cashService.insertMovement(movement, activeCashSession?.id).catch(console.error);
    },
    [currentUser, activeCashSession, setDb]
  );

  /**
   * Abre un nuevo turno de caja registradora.
   * 1. Valida que no exista ya una caja abierta.
   * 2. Crea un objeto `CashSession` con monto base inicial y estado 'abierta'.
   * 3. Registra en la bitácora (`addLog`).
   * 4. Persiste en el backend llamando a `cashService.openSession(session)`.
   */
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

  /**
   * Cierra el turno de caja activa.
   * 1. Cambia el estado a 'cerrada' y guarda el monto en arqueo entregado.
   * 2. Escribe en la bitácora (`addLog`).
   * 3. Envía la actualización a la API vía `cashService.closeSession(...)`.
   */
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

  /**
   * Registra un ingreso o egreso manual en la caja registradora.
   * Invocado desde la página de Caja (`CashPage.tsx`).
   */
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
