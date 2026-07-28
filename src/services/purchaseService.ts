/**
 * @file purchaseService.ts
 * @description Capa de Servicio / Acceso a Datos para Proveedores, Compras e Ingreso de Inventario.
 * 
 * RELACIÓN CON EL CONTROLADOR (`src/controllers/PurchaseController.ts`):
 * - `purchaseService` interactúa vía HTTP REST con las tablas `suppliers`, `purchases` y `purchase_items` de Supabase.
 * - `PurchaseController.ts` llama a estas funciones para guardar compras y proveedores:
 *    • `PurchaseController.upsertSupplier()` ➔ llama a `purchaseService.upsertSupplier(s)`
 *    • `PurchaseController.deleteSupplier()` ➔ llama a `purchaseService.deleteSupplier(id)`
 *    • `PurchaseController.addPurchase()` ➔ llama a `purchaseService.insertPurchase(purchase)`
 *    • `PurchaseController.receivePurchase()` ➔ llama a `purchaseService.receivePurchase(id)`
 * - `StoreController.tsx` llama a `purchaseService.fetchPurchasesData()` al inicio para cargar compras y proveedores.
 */

import type { Supplier, Purchase } from '../models/types';
import { supabase, isSupabaseConfigured } from '../models/supabase';

export const purchaseService = {
  /**
   * Consulta proveedores, compras y sus artículos detallados mediante HTTP GET.
   * Invocado por: `StoreController.tsx` durante la carga inicial.
   */
  async fetchPurchasesData(): Promise<{ suppliers: Supplier[]; purchases: Purchase[] }> {
    if (!isSupabaseConfigured) return { suppliers: [], purchases: [] };

    // Ejecuta 3 peticiones GET en paralelo a las tablas de compras y proveedores
    const [{ data: suppliers }, { data: purchases }, { data: purchaseItems }] = await Promise.all([
      supabase.from('suppliers').select('*'),
      supabase.from('purchases').select('*'),
      supabase.from('purchase_items').select('*'),
    ]);

    // Mapeo de Proveedores de snake_case a la interfaz Supplier
    const mappedSuppliers: Supplier[] = (suppliers || []).map((s) => ({
      id: s.id,
      name: s.name,
      contact: s.contact || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      taxId: s.tax_id || '',
      balance: Number(s.balance) || 0,
      createdAt: s.created_at,
    }));

    // Mapeo de Compras y asociación de ítems por `purchase_id`
    const mappedPurchases: Purchase[] = (purchases || []).map((p) => ({
      id: p.id,
      reference: p.reference,
      supplierId: p.supplier_id || '',
      supplierName: p.supplier_name || '',
      invoiceNumber: p.invoice_number || '',
      total: Number(p.total) || 0,
      status: p.status,
      createdAt: p.created_at,
      items: (purchaseItems || [])
        .filter((pi) => pi.purchase_id === p.id)
        .map((pi) => ({
          productId: pi.product_id,
          productName: pi.product_name,
          quantity: Number(pi.quantity),
          cost: Number(pi.cost),
          subtotal: Number(pi.subtotal),
        })),
    }));

    return { suppliers: mappedSuppliers, purchases: mappedPurchases };
  },

  /**
   * Registra o actualiza la información de un proveedor vía HTTP POST/UPSERT.
   * Invocado por: `PurchaseController.upsertSupplier()`
   */
  async upsertSupplier(s: Supplier): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('suppliers').upsert({
      id: s.id,
      name: s.name,
      contact: s.contact,
      phone: s.phone,
      email: s.email,
      address: s.address,
      tax_id: s.taxId,
      balance: s.balance,
    });
  },

  /**
   * Elimina un proveedor por su ID vía HTTP DELETE.
   * Invocado por: `PurchaseController.deleteSupplier()`
   */
  async deleteSupplier(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('suppliers').delete().eq('id', id);
  },

  /**
   * Registra una nueva orden de compra y sus artículos detallados en la base de datos vía HTTP POST.
   * Invocado por: `PurchaseController.addPurchase()`
   */
  async insertPurchase(p: Purchase): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('purchases').insert({
      id: p.id,
      reference: p.reference,
      supplier_id: p.supplierId || null,
      supplier_name: p.supplierName,
      invoice_number: p.invoiceNumber,
      total: p.total,
      status: p.status,
    });

    const items = p.items.map((item) => ({
      purchase_id: p.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      cost: item.cost,
      subtotal: item.subtotal,
    }));
    await supabase.from('purchase_items').insert(items);
  },

  /**
   * Cambia el estado de una orden de compra a 'recibida' mediante una solicitud HTTP PATCH.
   * Invocado por: `PurchaseController.receivePurchase()`
   */
  async receivePurchase(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('purchases').update({ status: 'recibida' }).eq('id', id);
  },
};
