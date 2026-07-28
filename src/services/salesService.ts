/**
 * @file salesService.ts
 * @description Capa de Servicio / Acceso a Datos para Ventas, Ítems de Venta y Anulaciones.
 * 
 * RELACIÓN CON EL CONTROLADOR (`src/controllers/SalesController.ts`):
 * - `salesService` gestiona las llamadas HTTP REST a las tablas `sales` y `sale_items` de Supabase.
 * - `SalesController.ts` invoca estas funciones para persistir las operaciones realizadas en el Punto de Venta (POS):
 *    • `SalesController.addSale()` ➔ procesa el carrito y llama a `salesService.insertSale(...)`
 *    • `SalesController.voidSale()` ➔ anula una venta en React y llama a `salesService.voidSale(id)`
 * - Si falla la conexión a internet o Supabase no responde, `insertSale` guarda automáticamente la venta
 *   en la cola offline a través de `syncService.addToPendingQueue`.
 */

import type { Sale, Product, Customer } from '../models/types';
import { supabase, isSupabaseConfigured } from '../models/supabase';
import { syncService } from './syncService';

export const salesService = {
  /**
   * Obtiene el listado completo de ventas registradas junto con sus ítems detallados via HTTP GET REST.
   * Mapea los registros relational de `sales` y `sale_items` a la estructura `Sale[]`.
   * Invocado por: `StoreController.tsx` al iniciar la aplicación.
   */
  async fetchSalesData(): Promise<Sale[]> {
    if (!isSupabaseConfigured) return [];

    // Consulta las ventas ordenadas descendentemente por fecha
    const { data: salesData, error: salesErr } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (salesErr || !salesData) return [];

    // Consulta todos los detalles/artículos de ventas
    const { data: itemsData } = await supabase.from('sale_items').select('*');

    // Mapea las ventas y vincula cada venta con sus ítems correspondientes por `sale_id`
    return salesData.map((s) => ({
      id: s.id,
      reference: s.reference,
      customerId: s.customer_id,
      customerName: s.customer_name,
      subtotal: Number(s.subtotal),
      discount: Number(s.discount),
      tax: Number(s.tax),
      total: Number(s.total),
      paymentMethod: s.payment_method,
      cashReceived: Number(s.cash_received),
      change: Number(s.change),
      status: s.status,
      userId: s.user_id,
      userName: s.user_name,
      createdAt: s.created_at,
      items: (itemsData || [])
        .filter((si) => si.sale_id === s.id)
        .map((si) => ({
          productId: si.product_id,
          productName: si.product_name,
          quantity: Number(si.quantity),
          price: Number(si.price),
          discount: Number(si.discount),
          subtotal: Number(si.subtotal),
        })),
    }));
  },

  /**
   * Inserta una nueva venta en la tabla `sales`, sus detalle de productos en `sale_items`,
   * descuenta el stock de los productos involucrados e incrementa el saldo a crédito del cliente si aplica.
   * 
   * Invocado por: `SalesController.addSale()`
   */
  async insertSale(sale: Sale, products: Product[], customer?: Customer): Promise<void> {
    // Si Supabase no está configurado, encola la venta localmente para sincronización futura
    if (!isSupabaseConfigured) {
      syncService.addToPendingQueue({ id: sale.id, type: 'sale', payload: sale });
      return;
    }

    try {
      // 1. Petición POST HTTP para insertar la cabecera de la venta en `sales`
      const { error: saleErr } = await supabase.from('sales').insert({
        id: sale.id,
        reference: sale.reference,
        customer_id: sale.customerId || null,
        customer_name: sale.customerName,
        subtotal: sale.subtotal,
        discount: sale.discount,
        tax: sale.tax,
        total: sale.total,
        payment_method: sale.paymentMethod,
        cash_received: sale.cashReceived,
        change: sale.change,
        user_id: sale.userId || null,
        user_name: sale.userName,
        status: sale.status,
      });
      if (saleErr) throw saleErr;

      // 2. Petición POST HTTP masiva para insertar los detalles en `sale_items`
      const items = sale.items.map((item) => ({
        sale_id: sale.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        subtotal: item.subtotal,
      }));
      const { error: itemsErr } = await supabase.from('sale_items').insert(items);
      if (itemsErr) throw itemsErr;

      // 3. Petición PATCH HTTP para actualizar el stock descontado de cada producto
      for (const item of sale.items) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          await supabase
            .from('products')
            .update({ stock: Math.max(0, prod.stock - item.quantity) })
            .eq('id', prod.id);
        }
      }

      // 4. Si la venta fue a crédito, actualiza el saldo deudor del cliente vía PATCH HTTP
      if (sale.paymentMethod === 'credito' && customer) {
        await supabase
          .from('customers')
          .update({ balance: (customer.balance || 0) + sale.total })
          .eq('id', customer.id);
      }
    } catch (err) {
      console.warn('Supabase sale insert failed, enqueuing for offline sync:', err);
      // En caso de fallo de red, se almacena en la cola pendiente de syncService
      syncService.addToPendingQueue({ id: sale.id, type: 'sale', payload: sale });
    }
  },

  /**
   * Anula una venta registrada cambiando su estado a 'anulada' mediante petición HTTP PATCH.
   * Invocado por: `SalesController.voidSale()`
   */
  async voidSale(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('sales').update({ status: 'anulada' }).eq('id', id);
    } catch (err) {
      console.error('Error voiding sale in Supabase:', err);
    }
  },
};
