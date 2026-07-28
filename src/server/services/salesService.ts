/**
 * @file salesService.ts (Server Backend)
 * @description Capa de Servicio / Lógica de Negocio para Procesamiento de Ventas y Anulaciones.
 * 
 * REGLA ESTRICTA DE ARQUITECTURA:
 * - Procesa cálculos de totales, actualización de stock y saldos de crédito de clientes.
 * - Consume ÚNICAMENTE `salesModel`, `productModel` y `customerModel`.
 */

import type { Sale, Product, Customer } from '../../models/types';
import { salesModel } from '../models/salesModel';
import { productModel } from '../models/productModel';
import { customerModel } from '../models/customerModel';

export const salesService = {
  async fetchSalesData(): Promise<Sale[]> {
    const { sales, items } = await salesModel.findAllSalesWithItems();

    return sales.map((s) => ({
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
      items: items
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

  async processSale(sale: Sale, products: Product[], customer?: Customer): Promise<void> {
    if (!sale.items || sale.items.length === 0) {
      throw new Error('La venta debe contener al menos un producto');
    }

    // 1. Cabecera e Ítems vía salesModel
    await salesModel.insertSaleHeader(sale);

    const items = sale.items.map((item) => ({
      sale_id: sale.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount,
      subtotal: item.subtotal,
    }));
    await salesModel.insertSaleItems(items);

    // 2. Descontar inventario en productModel
    for (const item of sale.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        await productModel.updateStock(prod.id, Math.max(0, prod.stock - item.quantity));
      }
    }

    // 3. Crédito cliente en customerModel
    if (sale.paymentMethod === 'credito' && customer) {
      await customerModel.updateBalance(customer.id, (customer.balance || 0) + sale.total);
    }
  },

  async voidSale(id: string): Promise<void> {
    await salesModel.updateSaleStatus(id, 'anulada');
  },
};
