/**
 * @file cashService.ts
 * @description Capa de Servicio / Lógica de Negocio para Sesiones de Caja y Movimientos.
 * 
 * REGLA DE ARQUITECTURA:
 * - `cashService` contiene las reglas de negocio de turnos de caja.
 * - Consume ÚNICAMENTE el modelo `cashModel` (sin llamadas directas a Supabase).
 * - Es invocado por `CashController.ts` y `StoreController.tsx`.
 */

import type { CashSession, CashMovement, CashMovementType } from '../models/types';
import { cashModel } from '../models/cashModel';
import { isSupabaseConfigured } from '../models/supabase';
import { syncService } from './syncService';

export const cashService = {
  /**
   * Obtiene y procesa los turnos y movimientos de caja desde cashModel.
   */
  async fetchCashData(): Promise<{ cashSessions: CashSession[]; cashMovements: CashMovement[] }> {
    const { sessions, movements } = await cashModel.findAllCashData();

    const mappedMovements: CashMovement[] = movements.map((m) => ({
      id: m.id,
      type: m.type as CashMovementType,
      amount: Number(m.amount),
      concept: m.concept || '',
      reference: m.reference || '',
      details: m.details ? (typeof m.details === 'object' ? m.details : JSON.parse(m.details)) : undefined,
      userId: m.user_id,
      userName: m.user_name,
      createdAt: m.created_at,
    }));

    const mappedSessions: CashSession[] = sessions.map((cs) => ({
      id: cs.id,
      openingAmount: Number(cs.opening_amount),
      closingAmount: cs.closing_amount !== null ? Number(cs.closing_amount) : null,
      status: cs.status,
      openedAt: cs.opened_at,
      closedAt: cs.closed_at,
      userId: cs.user_id,
      userName: cs.user_name,
      movements: mappedMovements.filter((m) => m.reference === cs.id || true),
    }));

    return { cashSessions: mappedSessions, cashMovements: mappedMovements };
  },

  /**
   * Abre un nuevo turno de caja e inserta su movimiento inicial vía cashModel.
   */
  async openSession(session: CashSession): Promise<void> {
    await cashModel.insertSession(session);

    const firstMov = session.movements[0];
    if (firstMov) {
      await cashModel.insertMovement(firstMov, session.id);
    }
  },

  /**
   * Cierra la sesión activa a través de cashModel.
   */
  async closeSession(sessionId: string, closingAmount: number, closedAt: string): Promise<void> {
    await cashModel.closeSession(sessionId, closingAmount, closedAt);
  },

  /**
   * Inserta un movimiento de caja vía cashModel o lo agrega a la cola offline.
   */
  async insertMovement(m: CashMovement, activeSessionId?: string | null): Promise<void> {
    if (!isSupabaseConfigured) {
      syncService.addToPendingQueue({ id: m.id, type: 'cash_movement', payload: { ...m, sessionId: activeSessionId } });
      return;
    }

    try {
      await cashModel.insertMovement(m, activeSessionId);
    } catch (err) {
      console.warn('Cash movement failed, enqueuing for offline sync:', err);
      syncService.addToPendingQueue({ id: m.id, type: 'cash_movement', payload: { ...m, sessionId: activeSessionId } });
    }
  },
};
