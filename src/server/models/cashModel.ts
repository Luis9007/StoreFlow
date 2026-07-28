/**
 * @file cashModel.ts (Server Backend)
 * @description Capa de Modelo / Acceso directo a la base de datos para Turnos de Caja y Movimientos.
 * 
 * REGLA ESTRICTA DE ARQUITECTURA:
 * - ÚNICA capa autorizada para consultar `cash_sessions` y `cash_movements`.
 * - Invocada ÚNICAMENTE por `cashService.ts`.
 */

import { supabase, isSupabaseConfigured } from '../../models/supabase';
import type { CashSession, CashMovement } from '../../models/types';

export const cashModel = {
  async findAllCashData(): Promise<{ sessions: any[]; movements: any[] }> {
    if (!isSupabaseConfigured) return { sessions: [], movements: [] };

    const [{ data: sessions }, { data: movements }] = await Promise.all([
      supabase.from('cash_sessions').select('*'),
      supabase.from('cash_movements').select('*'),
    ]);

    return { sessions: sessions || [], movements: movements || [] };
  },

  async insertSession(session: CashSession): Promise<void> {
    if (!isSupabaseConfigured) return;

    await supabase.from('cash_sessions').insert({
      id: session.id,
      opening_amount: session.openingAmount,
      status: 'abierta',
      user_id: session.userId || null,
      user_name: session.userName,
    });
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
    if (!isSupabaseConfigured) return;
    await supabase.from('cash_movements').insert({
      id: m.id,
      session_id: activeSessionId || null,
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
