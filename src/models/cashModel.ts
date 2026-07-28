/**
 * @file cashModel.ts
 * @description Capa de Modelo / Acceso directo a la base de datos para Sesiones de Caja y Movimientos.
 * 
 * REGLA DE ARQUITECTURA:
 * - Este modelo interactúa directamente con Supabase (`cash_sessions`, `cash_movements`).
 * - Es invocado ÚNICAMENTE por `cashService.ts` y `syncService.ts`.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { CashSession, CashMovement } from './types';

export const cashModel = {
  /**
   * Consulta las sesiones de caja y sus movimientos desde Supabase.
   */
  async findAllCashData(): Promise<{ sessions: any[]; movements: any[] }> {
    if (!isSupabaseConfigured) return { sessions: [], movements: [] };

    const [{ data: sessions }, { data: movements }] = await Promise.all([
      supabase.from('cash_sessions').select('*'),
      supabase.from('cash_movements').select('*'),
    ]);

    return { sessions: sessions || [], movements: movements || [] };
  },

  /**
   * Inserta una nueva sesión de caja.
   */
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

  /**
   * Actualiza el estado de la sesión de caja a 'cerrada'.
   */
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

  /**
   * Inserta un movimiento de caja.
   */
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

  /**
   * Upsert generico para sincronización offline de movimientos de caja.
   */
  async upsertRawMovement(payload: any): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('cash_movements').upsert({
      id: payload.id,
      session_id: payload.sessionId || null,
      type: payload.type,
      amount: payload.amount,
      concept: payload.concept,
      reference: payload.reference || null,
      details: payload.details || null,
      user_id: payload.userId || null,
      user_name: payload.userName || 'Sistema',
      created_at: payload.createdAt,
    });
  },
};
