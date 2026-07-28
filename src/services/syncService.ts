import { supabase, isSupabaseConfigured } from '../models/supabase';

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

      const { error } = await supabase
        .from('company_settings')
        .select('id')
        .limit(1)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);
      if (error) return false;
      return true;
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
          await supabase.from('customers').upsert({
            id: item.payload.id,
            name: item.payload.name,
            document: item.payload.document || null,
            phone: item.payload.phone || null,
            email: item.payload.email || null,
            address: item.payload.address || null,
            balance: item.payload.balance || 0,
            notes: item.payload.notes || null,
          });
        } else if (item.type === 'product') {
          await supabase.from('products').upsert({
            id: item.payload.id,
            sku: item.payload.sku,
            barcode: item.payload.barcode,
            name: item.payload.name,
            description: item.payload.description,
            category_id: item.payload.categoryId || null,
            brand_id: item.payload.brandId || null,
            cost: item.payload.cost,
            price: item.payload.price,
            stock: item.payload.stock,
            min_stock: item.payload.minStock,
            unit: item.payload.unit,
            active: item.payload.active,
            favorite: item.payload.favorite,
          });
        } else if (item.type === 'cash_movement') {
          await supabase.from('cash_movements').upsert({
            id: item.payload.id,
            session_id: item.payload.sessionId || null,
            type: item.payload.type,
            amount: item.payload.amount,
            concept: item.payload.concept,
            reference: item.payload.reference || null,
            details: item.payload.details || null,
            user_id: item.payload.userId || null,
            user_name: item.payload.userName || 'Sistema',
            created_at: item.payload.createdAt,
          });
        } else if (item.type === 'sale') {
          await supabase.from('sales').upsert({
            id: item.payload.id,
            reference: item.payload.reference,
            customer_id: item.payload.customerId || null,
            customer_name: item.payload.customerName,
            subtotal: item.payload.subtotal,
            discount: item.payload.discount || 0,
            tax: item.payload.tax || 0,
            total: item.payload.total,
            payment_method: item.payload.paymentMethod,
            cash_received: item.payload.cashReceived,
            change: item.payload.change,
            status: item.payload.status || 'completada',
            user_id: item.payload.userId || null,
            user_name: item.payload.userName || 'Sistema',
            created_at: item.payload.createdAt,
          });

          if (item.payload.items && item.payload.items.length > 0) {
            const saleItems = item.payload.items.map((it: any) => ({
              sale_id: item.payload.id,
              product_id: it.productId,
              product_name: it.productName,
              quantity: it.quantity,
              price: it.price,
              discount: it.discount || 0,
              subtotal: it.subtotal,
            }));
            await supabase.from('sale_items').upsert(saleItems);
          }
        } else if (item.type === 'inventory_adjustment') {
          await supabase.from('inventory_adjustments').upsert({
            id: item.payload.id,
            product_id: item.payload.productId,
            previous_stock: item.payload.previousStock,
            new_stock: item.payload.newStock,
            reason: item.payload.reason,
            type: item.payload.type,
            user_id: item.payload.userId || null,
            user_name: item.payload.userName || 'Sistema',
            created_at: item.payload.createdAt,
          });
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
