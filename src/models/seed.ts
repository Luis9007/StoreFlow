/**
 * @file seed.ts
 * @description Datos Semilla / Iniciales de Prueba para la Base de Datos Local.
 * 
 * RELACIÓN CON OTROS MÓDULOS:
 * - Utilizado por `StoreController.tsx` y `loadDbFromStorage` cuando no hay datos en la API de Supabase
 *   o cuando la aplicación se ejecuta en modo standalone (sin backend en la nube).
 * - Proveído por `SettingsController.resetData()` para restaurar el sistema a su estado inicial.
 */

import type { AppDatabase, Product, Sale, SaleItem, CashSession, Purchase } from './types';
import { generateId } from '../lib/utils';

const now = new Date();
const iso = (d: Date) => d.toISOString();

/**
 * Función auxiliar para generar fechas relativas hacia atrás en días.
 */
function daysBack(n: number, hour = 10, min = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, min, 0, 0);
  return iso(d);
}

/** Categorías iniciales de productos */
const categories = [
  { id: 'cat_bebidas', name: 'Bebidas', color: '#0ea5e9', icon: 'CupSoda' },
  { id: 'cat_lacteos', name: 'Lácteos', color: '#14b8a6', icon: 'Milk' },
  { id: 'cat_abarrotes', name: 'Abarrotes', color: '#f59e0b', icon: 'Wheat' },
  { id: 'cat_snacks', name: 'Snacks', color: '#ef4444', icon: 'Cookie' },
  { id: 'cat_limpieza', name: 'Limpieza', color: '#8b5cf6', icon: 'SprayCan' },
  { id: 'cat_cuidado', name: 'Cuidado Personal', color: '#ec4899', icon: 'HeartPulse' },
];

/** Marcas comerciales iniciales */
const brands = [
  { id: 'br_coca', name: 'Coca-Cola' },
  { id: 'br_pepsi', name: 'Pepsi' },
  { id: 'br_nestle', name: 'Nestlé' },
  { id: 'br_lala', name: 'Lala' },
  { id: 'br_gamesa', name: 'Gamesa' },
  { id: 'br_sabritas', name: 'Sabritas' },
  { id: 'br_p&g', name: 'Procter & Gamble' },
  { id: 'br_colgate', name: 'Colgate' },
  { id: 'br_unilever', name: 'Unilever' },
  { id: 'br_bimbo', name: 'Bimbo' },
];

type SeedProduct = Pick<
  Product,
  'sku' | 'barcode' | 'name' | 'description' | 'categoryId' | 'brandId' | 'cost' | 'price' | 'stock' | 'minStock' | 'unit' | 'favorite'
>;

/** Productos del catálogo inicial */
const productSeeds: SeedProduct[] = [
  { sku: 'COCA-600', barcode: '7501057530015', name: 'Coca-Cola 600ml', description: 'Refresco de cola 600ml', categoryId: 'cat_bebidas', brandId: 'br_coca', cost: 2800, price: 4500, stock: 120, minStock: 24, unit: 'pza', favorite: true },
  { sku: 'COCA-2L', barcode: '7501057530022', name: 'Coca-Cola 2L', description: 'Refresco de cola 2 litros', categoryId: 'cat_bebidas', brandId: 'br_coca', cost: 5800, price: 8500, stock: 60, minStock: 12, unit: 'pza', favorite: true },
  { sku: 'PEPSI-600', barcode: '7501057530039', name: 'Pepsi 600ml', description: 'Refresco de cola 600ml', categoryId: 'cat_bebidas', brandId: 'br_pepsi', cost: 2500, price: 4200, stock: 80, minStock: 24, unit: 'pza', favorite: false },
  { sku: 'SPRITE-600', barcode: '7501057530046', name: 'Sprite 600ml', description: 'Refresco de limón 600ml', categoryId: 'cat_bebidas', brandId: 'br_coca', cost: 2800, price: 4500, stock: 8, minStock: 24, unit: 'pza', favorite: false },
  { sku: 'AGUA-1L', barcode: '7501057530053', name: 'Agua Ciel 1L', description: 'Agua pura 1 litro', categoryId: 'cat_bebidas', brandId: 'br_coca', cost: 1500, price: 3000, stock: 90, minStock: 24, unit: 'pza', favorite: false },
  { sku: 'LECHE-1L', barcode: '7501057530060', name: 'Leche Colanta Entera 1L', description: 'Leche entera pasteurizada', categoryId: 'cat_lacteos', brandId: 'br_lala', cost: 3200, price: 4800, stock: 40, minStock: 12, unit: 'pza', favorite: true },
  { sku: 'YOGURT-1K', barcode: '7501057530077', name: 'Yogurt Nestlé 1kg', description: 'Yogurt de fresa', categoryId: 'cat_lacteos', brandId: 'br_nestle', cost: 8500, price: 13500, stock: 25, minStock: 6, unit: 'pza', favorite: false },
  { sku: 'QUESO-500', barcode: '7501057530084', name: 'Queso Alpina 500g', description: 'Queso sabana rebanado', categoryId: 'cat_lacteos', brandId: 'br_lala', cost: 12000, price: 18500, stock: 15, minStock: 6, unit: 'pza', favorite: false },
  { sku: 'ARROZ-1K', barcode: '7501057530091', name: 'Arroz Roa 1kg', description: 'Arroz blanco grano largo', categoryId: 'cat_abarrotes', brandId: 'br_nestle', cost: 3200, price: 4800, stock: 50, minStock: 12, unit: 'pza', favorite: false },
  { sku: 'FRIJOL-1K', barcode: '7501057530107', name: 'Frijol Cargamanto 1kg', description: 'Frijol seleccionado', categoryId: 'cat_abarrotes', brandId: 'br_nestle', cost: 4500, price: 7200, stock: 35, minStock: 12, unit: 'pza', favorite: false },
  { sku: 'ACEITE-1L', barcode: '7501057530114', name: 'Aceite Premier 1L', description: 'Aceite vegetal', categoryId: 'cat_abarrotes', brandId: 'br_unilever', cost: 7500, price: 11500, stock: 28, minStock: 10, unit: 'pza', favorite: true },
  { sku: 'AZUCAR-1K', barcode: '7501057530121', name: 'Azúcar Incauca 1kg', description: 'Azúcar refinada', categoryId: 'cat_abarrotes', brandId: 'br_nestle', cost: 3500, price: 5200, stock: 45, minStock: 12, unit: 'pza', favorite: false },
  { sku: 'PAPAS-SAB', barcode: '7501057530138', name: 'Papas Margarita 45g', description: 'Papas fritas clásicas', categoryId: 'cat_snacks', brandId: 'br_sabritas', cost: 2200, price: 3500, stock: 100, minStock: 24, unit: 'pza', favorite: true },
  { sku: 'DORITOS', barcode: '7501057530145', name: 'Doritos Nacho 65g', description: 'Totopos de nacho', categoryId: 'cat_snacks', brandId: 'br_sabritas', cost: 2800, price: 4500, stock: 70, minStock: 24, unit: 'pza', favorite: false },
  { sku: 'GALLETAS', barcode: '7501057530152', name: 'Galletas Festival', description: 'Galletas de chocolate', categoryId: 'cat_snacks', brandId: 'br_gamesa', cost: 1800, price: 3000, stock: 60, minStock: 24, unit: 'pza', favorite: false },
  { sku: 'TORTILLAS', barcode: '7501057530169', name: 'Tortillas Bimbo 1kg', description: 'Tortillas de maíz', categoryId: 'cat_abarrotes', brandId: 'br_bimbo', cost: 2500, price: 4000, stock: 5, minStock: 12, unit: 'pza', favorite: false },
  { sku: 'PAN-BIMBO', barcode: '7501057530176', name: 'Pan Bimbo Grande', description: 'Pan blanco rebanado', categoryId: 'cat_abarrotes', brandId: 'br_bimbo', cost: 5500, price: 8500, stock: 20, minStock: 8, unit: 'pza', favorite: false },
  { sku: 'JABON', barcode: '7501057530183', name: 'Jabón Rey 250g', description: 'Jabón de lavandería', categoryId: 'cat_limpieza', brandId: 'br_p&g', cost: 2800, price: 4500, stock: 55, minStock: 12, unit: 'pza', favorite: false },
  { sku: 'CLOROX-1L', barcode: '7501057530190', name: 'Clorox 1L', description: 'Cloro concentrado', categoryId: 'cat_limpieza', brandId: 'br_p&g', cost: 3200, price: 5000, stock: 30, minStock: 12, unit: 'pza', favorite: false },
  { sku: 'PASTA-DENT', barcode: '7501057530206', name: 'Pasta Dental Colgate', description: 'Pasta dental 100ml', categoryId: 'cat_cuidado', brandId: 'br_colgate', cost: 4500, price: 7500, stock: 40, minStock: 12, unit: 'pza', favorite: false },
  { sku: 'SHAMPOO', barcode: '7501057530213', name: 'Shampoo Savital 400ml', description: 'Shampoo hidratante', categoryId: 'cat_cuidado', brandId: 'br_unilever', cost: 8500, price: 14000, stock: 25, minStock: 8, unit: 'pza', favorite: false },
  { sku: 'JABON-TOALLA', barcode: '7501057530220', name: 'Jabón Palmolive', description: 'Jabón de tocador 150g', categoryId: 'cat_cuidado', brandId: 'br_colgate', cost: 2200, price: 3800, stock: 48, minStock: 12, unit: 'pza', favorite: false },
  { sku: 'PAPEL-HIG', barcode: '7501057530237', name: 'Papel Higiénico Familia', description: 'Paquete 4 rollos', categoryId: 'cat_limpieza', brandId: 'br_p&g', cost: 5500, price: 9200, stock: 32, minStock: 10, unit: 'pza', favorite: false },
];

/** Arreglo final de productos instanciados con ID */
const products: Product[] = productSeeds.map((p, i) => ({
  ...p,
  id: `prod_${String(i + 1).padStart(3, '0')}`,
  active: true,
  createdAt: daysBack(30 - i),
}));

/** Clientes iniciales */
const customers = [
  { id: 'cus_001', name: 'María González', document: 'GOAM850412', phone: '5512345678', email: 'maria.g@email.com', address: 'Calle Reforma 123, CDMX', balance: 0, notes: 'Cliente frecuente', createdAt: daysBack(20) },
  { id: 'cus_002', name: 'Juan Pérez', document: 'PEMJ900315', phone: '5598765432', email: 'juan.p@email.com', address: 'Av. Insurgentes 456, CDMX', balance: 120, notes: 'Crédito pendiente', createdAt: daysBack(15) },
  { id: 'cus_003', name: 'Ana Martínez', document: 'MAAN920628', phone: '5544556677', email: 'ana.m@email.com', address: 'Calle Juárez 789, CDMX', balance: 0, notes: '', createdAt: daysBack(10) },
  { id: 'cus_004', name: 'Carlos Ruiz', document: 'RUCM880102', phone: '5522334455', email: 'carlos.r@email.com', address: 'Col. Centro, CDMX', balance: 0, notes: 'Paga siempre en efectivo', createdAt: daysBack(5) },
  { id: 'cus_005', name: 'Laura Sánchez', document: 'SACL950714', phone: '5566778899', email: 'laura.s@email.com', address: 'Polanco, CDMX', balance: 0, notes: '', createdAt: daysBack(2) },
];

/** Proveedores iniciales */
const suppliers = [
  { id: 'sup_001', name: 'Distribuidora del Centro', contact: 'Roberto Díaz', phone: '5511223344', email: 'ventas@distcentro.com', address: 'Av. Industrial 100, CDMX', taxId: 'DC850101AB1', balance: 0, createdAt: daysBack(25) },
  { id: 'sup_002', name: 'Coca-Cola FEMSA', contact: 'Patricia Luna', phone: '5533445566', email: 'pedidos@cocafemsa.com', address: 'Av. Tláhuac 200, CDMX', taxId: 'CF900202XY2', balance: 0, createdAt: daysBack(25) },
  { id: 'sup_003', name: 'Grupo Bimbo', contact: 'Miguel Torres', phone: '5555667788', email: 'comercial@bimbo.com', address: 'Calz. Ticomán 500, CDMX', taxId: 'GB780303CD3', balance: 0, createdAt: daysBack(20) },
  { id: 'sup_004', name: 'Nestlé México', contact: 'Sofía Vega', phone: '5577889900', email: 'contacto@nestle.mx', address: 'Av. Cuauhtémoc 800, CDMX', taxId: 'NM900404EF4', balance: 0, createdAt: daysBack(18) },
];

/** Función constructora de ventas sintéticas para demostración */
function buildSale(daysBackN: number, hour: number, items: Array<{ product: Product; qty: number }>, paymentMethod: Sale['paymentMethod'], customerIdx: number | null, userId: string, userName: string, seq: number): Sale {
  const saleItems: SaleItem[] = items.map(({ product, qty }) => ({
    productId: product.id,
    productName: product.name,
    quantity: qty,
    price: product.price,
    discount: 0,
    subtotal: product.price * qty,
  }));
  const subtotal = saleItems.reduce((s, i) => s + i.subtotal, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;
  const cashReceived = paymentMethod === 'efectivo' ? Math.ceil(total / 50) * 50 : total;
  return {
    id: generateId('sale'),
    reference: `V-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`,
    customerId: customerIdx !== null ? customers[customerIdx].id : null,
    customerName: customerIdx !== null ? customers[customerIdx].name : 'Público general',
    items: saleItems,
    subtotal,
    discount: 0,
    tax,
    total,
    paymentMethod,
    cashReceived,
    change: cashReceived - total,
    userId,
    userName,
    status: 'completada',
    createdAt: daysBack(daysBackN, hour, Math.floor(Math.random() * 50)),
  };
}

let saleSeq = 1;
const sales: Sale[] = [
  buildSale(6, 9, [{ product: products[0], qty: 2 }, { product: products[12], qty: 1 }], 'efectivo', null, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(6, 11, [{ product: products[1], qty: 1 }, { product: products[8], qty: 1 }], 'tarjeta', 0, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(5, 10, [{ product: products[5], qty: 2 }, { product: products[4], qty: 3 }], 'efectivo', 1, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(5, 14, [{ product: products[13], qty: 2 }, { product: products[14], qty: 1 }], 'efectivo', null, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(4, 9, [{ product: products[0], qty: 5 }, { product: products[2], qty: 3 }], 'efectivo', null, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(4, 13, [{ product: products[10], qty: 1 }, { product: products[9], qty: 2 }], 'tarjeta', 2, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(3, 10, [{ product: products[16], qty: 2 }, { product: products[18], qty: 1 }], 'efectivo', 3, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(3, 16, [{ product: products[6], qty: 1 }, { product: products[7], qty: 1 }], 'credito', 1, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(2, 9, [{ product: products[0], qty: 3 }, { product: products[12], qty: 2 }, { product: products[13], qty: 1 }], 'efectivo', null, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(2, 12, [{ product: products[1], qty: 2 }, { product: products[15], qty: 1 }], 'efectivo', 4, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(1, 10, [{ product: products[5], qty: 1 }, { product: products[4], qty: 2 }], 'efectivo', null, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(1, 11, [{ product: products[19], qty: 1 }, { product: products[20], qty: 1 }], 'tarjeta', 0, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(1, 15, [{ product: products[0], qty: 4 }, { product: products[12], qty: 3 }], 'efectivo', null, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(0, 9, [{ product: products[1], qty: 1 }, { product: products[8], qty: 1 }], 'efectivo', null, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(0, 10, [{ product: products[0], qty: 2 }, { product: products[13], qty: 2 }], 'efectivo', 2, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(0, 11, [{ product: products[5], qty: 2 }, { product: products[6], qty: 1 }], 'tarjeta', 0, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(0, 13, [{ product: products[10], qty: 1 }, { product: products[9], qty: 1 }, { product: products[11], qty: 1 }], 'efectivo', null, 'user_cajero', 'Carlos Vendedor', saleSeq++),
];

/** Compras iniciales de prueba */
const purchases: Purchase[] = [
  {
    id: generateId('pur'),
    reference: 'C-2025-00001',
    supplierId: 'sup_002',
    supplierName: 'Coca-Cola FEMSA',
    invoiceNumber: 'FAC-001',
    items: [
      { productId: 'prod_001', productName: 'Coca-Cola 600ml', quantity: 120, cost: 8, subtotal: 960 },
      { productId: 'prod_002', productName: 'Coca-Cola 2L', quantity: 60, cost: 18, subtotal: 1080 },
      { productId: 'prod_004', productName: 'Sprite 600ml', quantity: 48, cost: 8, subtotal: 384 },
      { productId: 'prod_005', productName: 'Agua Ciel 1L', quantity: 90, cost: 5, subtotal: 450 },
    ],
    total: 2874,
    status: 'recibida',
    createdAt: daysBack(7),
  },
  {
    id: generateId('pur'),
    reference: 'C-2025-00002',
    supplierId: 'sup_003',
    supplierName: 'Grupo Bimbo',
    invoiceNumber: 'FAC-002',
    items: [
      { productId: 'prod_016', productName: 'Tortillas Bimbo 1kg', quantity: 48, cost: 12, subtotal: 576 },
      { productId: 'prod_017', productName: 'Pan Bimbo Grande', quantity: 20, cost: 25, subtotal: 500 },
    ],
    total: 1076,
    status: 'recibida',
    createdAt: daysBack(5),
  },
  {
    id: generateId('pur'),
    reference: 'C-2025-00003',
    supplierId: 'sup_004',
    supplierName: 'Nestlé México',
    invoiceNumber: 'FAC-003',
    items: [
      { productId: 'prod_007', productName: 'Yogurt Nestlé 1kg', quantity: 25, cost: 35, subtotal: 875 },
      { productId: 'prod_009', productName: 'Arroz Verde Valle 1kg', quantity: 50, cost: 22, subtotal: 1100 },
      { productId: 'prod_010', productName: 'Frijol Negro 1kg', quantity: 35, cost: 28, subtotal: 980 },
      { productId: 'prod_012', productName: 'Azúcar Zulka 1kg', quantity: 45, cost: 18, subtotal: 810 },
    ],
    total: 3765,
    status: 'pendiente',
    createdAt: daysBack(2),
  },
];

/** Sesiones de caja registradora iniciales */
const cashSessions: CashSession[] = [
  {
    id: generateId('cash'),
    openingAmount: 500,
    closingAmount: 3250,
    status: 'cerrada',
    openedAt: daysBack(1, 8, 0),
    closedAt: daysBack(0, 20, 30),
    userId: 'user_cajero',
    userName: 'Carlos Vendedor',
    movements: [
      { id: generateId('mov'), type: 'apertura', amount: 500, concept: 'Apertura de caja', reference: '', userId: 'user_cajero', userName: 'Carlos Vendedor', createdAt: daysBack(1, 8, 0) },
      { id: generateId('mov'), type: 'venta', amount: 1850, concept: 'Ventas del día', reference: '', userId: 'user_cajero', userName: 'Carlos Vendedor', createdAt: daysBack(0, 20, 0) },
      { id: generateId('mov'), type: 'egreso', amount: 100, concept: 'Compra de bolsas', reference: '', userId: 'user_cajero', userName: 'Carlos Vendedor', createdAt: daysBack(0, 15, 0) },
      { id: generateId('mov'), type: 'cierre', amount: 3250, concept: 'Cierre de caja', reference: '', userId: 'user_cajero', userName: 'Carlos Vendedor', createdAt: daysBack(0, 20, 30) },
    ],
  },
];

/** Configuración por defecto de la empresa */
const settings = {
  name: 'Supermercado StoreFlow',
  legalName: 'StoreFlow Colombia S.A.S.',
  taxId: '901.234.567-8',
  address: 'Calle 100 # 15-20, Bogotá, Colombia',
  phone: '+57 601 555 1234',
  email: 'contacto@storeflow.co',
  currency: 'COP',
  currencySymbol: '$',
  taxRate: 19,
  logoText: 'StoreFlow',
  theme: 'light' as const,
};

/** Usuarios de demostración */
const users = [
  { id: 'user_super', name: 'Sofía Supervisor', email: 'supervisor@storeflow.com', password: 'super123', role: 'supervisor' as const, active: true, createdAt: daysBack(28) },
  { id: 'user_cajero', name: 'Carlos Vendedor', email: 'cajero@storeflow.com', password: 'cajero123', role: 'cajero' as const, active: true, createdAt: daysBack(25) },
];

/** Exportación del objeto completo de la base de datos de semilla */
export const seedDatabase: AppDatabase = {
  users,
  categories,
  brands,
  products,
  customers,
  suppliers,
  purchases,
  sales,
  cashSessions,
  adjustments: [],
  settings,
  logs: [
    { id: generateId('log'), action: 'login', detail: 'Inicio de sesión', userId: 'user_super', userName: 'Sofía Supervisor', createdAt: daysBack(0, 8, 0) },
    { id: generateId('log'), action: 'sale', detail: 'Venta V-2025-00017 registrada', userId: 'user_cajero', userName: 'Carlos Vendedor', createdAt: daysBack(0, 13, 0) },
  ],
};
