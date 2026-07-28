/**
 * @file cashService.ts (Server Backend)
 * @description Capa de Servicio / Lógica de Negocio para Turnos y Movimientos de Caja.
 */

import type { CashSession, CashMovement, CashMovementType } from '../../models/types';
import { cashModel } from '../models/cashModel';

export const cashService = {
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

  async openSession(session: CashSession): Promise<void> {
    if (session.openingAmount < 0) throw new Error('El monto inicial no puede ser negativo');
    await cashModel.insertSession(session);

    const firstMov = session.movements[0];
    if (firstMov) {
      await cashModel.insertMovement(firstMov, session.id);
    }
  },

  async closeSession(sessionId: string, closingAmount: number, closedAt: string): Promise<void> {
    await cashModel.closeSession(sessionId, closingAmount, closedAt);
  },

  async insertMovement(m: CashMovement, activeSessionId?: string | null): Promise<void> {
    await cashModel.insertMovement(m, activeSessionId);
  },
};
