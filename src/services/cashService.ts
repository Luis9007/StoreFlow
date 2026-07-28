import type { CashSession, CashMovement, CashMovementType } from '../models/types';
import { supabase, isSupabaseConfigured } from '../models/supabase';

export const cashService = {
  async fetchCashData(): Promise<{ cashSessions: CashSession[]; cashMovements: CashMovement[] }> {
    if (!isSupabaseConfigured) return { cashSessions: [], cashMovements: [] };

    const [{ data: cashSessions }, { data: cashMovements }] = await Promise.all([
      supabase.from('cash_sessions').select('*'),
      supabase.from('cash_movements').select('*'),
    ]);

    const mappedMovements: CashMovement[] = (cashMovements || []).map((m) => ({
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

    const mappedSessions: CashSession[] = (cashSessions || []).map((cs) => ({
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
    if (!isSupabaseConfigured) return;

    await supabase.from('cash_sessions').insert({
      id: session.id,
      opening_amount: session.openingAmount,
      status: 'abierta',
      user_id: session.userId || null,
      user_name: session.userName,
    });

    const firstMov = session.movements[0];
    if (firstMov) {
      await supabase.from('cash_movements').insert({
        id: firstMov.id,
        session_id: session.id,
        type: firstMov.type,
        amount: firstMov.amount,
        concept: firstMov.concept,
        user_id: session.userId || null,
        user_name: session.userName,
      });
    }
  },

  async closeSession(sessionId: string, closingAmount: number, closedAt: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase
      .from('cash_sessions')
      .update({
        status: 'cerrada',
        closing_amount: closingAmount,
        closed_at: closedAt,
      })
      .eq('id', sessionId);
  },

  async insertMovement(m: CashMovement, activeSessionId?: string | null): Promise<void> {
    if (!isSupabaseConfigured || !activeSessionId) return;

    await supabase.from('cash_movements').insert({
      id: m.id,
      session_id: activeSessionId,
      type: m.type,
      amount: m.amount,
      concept: m.concept,
      reference: m.reference,
      details: m.details ? JSON.stringify(m.details) : null,
      user_id: m.userId || null,
      user_name: m.userName,
    });
  },
};
