/**
 * @file syncService.ts
 * @description Capa de Servicio para Cola de Sincronización Offline y Diagnóstico de Red.
 * 
 * REGLA DE ARQUITECTURA:
 * - `syncService` maneja la cola de almacenamiento local (`localStorage`) y la resincronización.
 * - En lugar de invocar a Supabase directamente, delega los upserts pendientes en los modelos correspondientes
 *   (`customerModel`, `productModel`, `cashModel`, `salesModel`, `settingsModel`).
 */

import { customerModel } from '../models/customerModel';
import { productModel } from '../models/productModel';
import { cashModel } from '../models/cashModel';
import { salesModel } from '../models/salesModel';
import { settingsModel } from '../models/settingsModel';
import { isSupabaseConfigured } from '../models/supabase';

export interface PendingQueueItem {
  id: string;
  type: 'sale' | 'customer' | 'cash_movement' | 'product' | 'inventory_adjustment';
  payload: any;
  createdAt: string;
}

const QUEUE_STORAGE_KEY = 'storeflow_offline_queue_v1';

export const syncService = {
  getPendingQueue(): PendingQueueItem[] {
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PendingQueueItem[]) : [];
    } catch {
      return [];
    }
  },

  savePendingQueue(queue: PendingQueueItem[]): void {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Error saving pending queue to storage:', e);
    }
  },

  addToPendingQueue(item: Omit<PendingQueueItem, 'createdAt'>): void {
    const queue = this.getPendingQueue();
    if (queue.some((q) => q.id === item.id)) return;
    queue.push({ ...item, createdAt: new Date().toISOString() });
    this.savePendingQueue(queue);
  },

  removeFromPendingQueue(id: string): void {
    const queue = this.getPendingQueue().filter((q) => q.id !== id);
    this.savePendingQueue(queue);
  },

  async checkSupabaseHealth(): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const isHealthy = await settingsModel.pingHealth(controller.signal);
      clearTimeout(timeoutId);
      return isHealthy;
    } catch {
      return false;
    }
  },

  async processPendingQueue(
    onProgress?: (processed: number, total: number) => void
  ): Promise<{ success: number; failed: number }> {
    if (!isSupabaseConfigured) return { success: 0, failed: 0 };

    const isHealthy = await this.checkSupabaseHealth();
    if (!isHealthy) return { success: 0, failed: 0 };

    const queue = this.getPendingQueue();
    if (queue.length === 0) return { success: 0, failed: 0 };

    let success = 0;
    let failed = 0;

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      try {
        if (item.type === 'customer') {
          await customerModel.upsertRawCustomer(item.payload);
        } else if (item.type === 'product') {
          await productModel.upsertRawProduct(item.payload);
        } else if (item.type === 'cash_movement') {
          await cashModel.upsertRawMovement(item.payload);
        } else if (item.type === 'sale') {
          await salesModel.upsertRawSale(item.payload);
        } else if (item.type === 'inventory_adjustment') {
          await productModel.upsertRawAdjustment(item.payload);
        }

        this.removeFromPendingQueue(item.id);
        success++;
        if (onProgress) onProgress(i + 1, queue.length);
      } catch (err) {
        console.error(`Failed to sync item ${item.id} of type ${item.type}:`, err);
        failed++;
      }
    }

    return { success, failed };
  },
};
