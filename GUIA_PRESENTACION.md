# 🎤 Guía de Presentación — StoreFlow v2.0
## Sistema de Punto de Venta, Inventario y Gestión Empresarial

> **Para:** Presentación en clase — Ingeniería de Software / Desarrollo Web  
> **Duración estimada:** 20–30 minutos  
> **Modalidad:** Demo en vivo + explicación técnica

---

## ❶ APERTURA — El Problema Real (3 min)

### Cómo empezar
Iniciar con una pregunta directa al auditorio:

> *"¿Cuántos de ustedes han comprado en una tienda de barrio, supermercado o minimarket donde el dueño lleva las cuentas en un cuaderno o en una hoja de cálculo de Excel?"*

Esperar respuesta. Luego continuar:

> *"Ese es exactamente el problema que StoreFlow resuelve."*

---

### El Diagnóstico del Problema

Presentar este cuadro de problemas reales:

| # | Problema en el Comercio | Consecuencia Real |
|---|---|---|
| 1 | El inventario se lleva en cuadernos o Excel | No saben cuándo un producto se agota hasta que ya no hay nada en la bodega |
| 2 | No tienen sistema de código de barras | Cada cobro es manual, lento y con riesgo de equivocarse en el precio |
| 3 | Si se va el internet, no pueden vender | Pierden ventas, el cliente se va molesto |
| 4 | No hay control de caja al abrir o cerrar | Al final del día no saben si falta o sobra dinero y no saben por qué |
| 5 | No registran a qué precio compraron cada producto | No pueden saber con exactitud cuánto están ganando |
| 6 | Llevan la cartera de clientes (crédito) en papeles | Pierden cobros, no tienen histórico |

> *"StoreFlow es la respuesta técnica a estos 6 problemas. Es una plataforma web completa, moderna, que funciona con o sin internet."*

---

## ❷ QUÉ ES STOREFLOW (2 min)

### Definición clara

**StoreFlow** es una aplicación web empresarial de Punto de Venta (POS) y gestión de inventario, diseñada para comercios minoristas como tiendas de abarrotes, minimarkets, boutiques y ferreterías.

### Características Clave (resumen de alto nivel)

- 🛒 **POS completo** con escáner de código de barras por cámara
- 📦 **Inventario inteligente** con alertas de stock mínimo
- 💰 **Control de caja** con apertura, cierre y arqueo
- 🚚 **Gestión de compras** a proveedores con actualización automática de stock
- 👥 **Clientes y Proveedores** con cartera de crédito
- 📊 **Reportes y Auditoría** en tiempo real
- 📡 **Funciona sin internet** (modo Offline-First)

---

## ❸ ARQUITECTURA TÉCNICA (5 min)

### ¿Por qué la arquitectura importa?

> *"Antes de mostrar la aplicación, voy a explicar cómo está construida por dentro. Esto es lo que diferencia un proyecto académico de un sistema de producción real."*

---

### Arquitectura de 4 Capas — MVC + Service Layer

```
CLIENTE (React) ──HTTP REST──► BACKEND (Node.js + Express)
                                        |
                              ┌─────────▼──────────┐
                              │   Routes            │  Solo rutas HTTP
                              ├────────────────────┤
                              │   Controllers       │  Solo req/res
                              ├────────────────────┤
                              │   Services          │  Toda la lógica
                              ├────────────────────┤
                              │   Models            │  Solo acceso a BD
                              └─────────┬──────────┘
                                        │
                              ┌─────────▼──────────┐
                              │   SUPABASE          │  PostgreSQL + Auth
                              │   (Base de Datos)   │
                              └────────────────────┘
```

### Explicar cada capa con un ejemplo concreto

**Ejemplo: "El cajero cobra una venta en efectivo"**

| Capa | ¿Qué hace en este ejemplo? |
|---|---|
| **View (React)** | El cajero hace clic en "Cobrar". La página `POSPage.tsx` envía los datos al controlador React. |
| **Controller (React)** | `StoreController` recibe la acción `addSale`, actualiza el estado global y llama al service. |
| **Service (Cliente)** | `salesService.ts` envía la venta al Backend vía `fetch('/api/sales', { method: 'POST', body: ... })`. |
| **Route (Backend)** | `POST /api/sales` en `salesRoutes.ts` recibe la petición y la delega al controlador Express. |
| **Controller (Backend)** | `salesController.ts` extrae `req.body` y llama a `salesService.create(data)`. Sin lógica propia. |
| **Service (Backend)** | `salesService.ts` valida el stock, calcula el total final, aplica descuentos y llama al modelo. |
| **Model (Backend)** | `salesModel.ts` ejecuta `supabase.from('sales').insert(...)`. Es el **único** que toca la BD. |

> *"Esta separación no es solo estética. Si mañana cambiamos Supabase por MySQL, solo tocamos los Models. Si cambiamos Express por Fastify, solo tocamos Routes y Controllers. El negocio (Services) no se toca."*

---

### Sistema de Roles y Permisos (RBAC)

> *"Hay dos tipos de usuarios en StoreFlow: el Supervisor y el Cajero. El sistema decide qué puede hacer cada uno con una sola función:"*

```typescript
// src/controllers/permissions.ts
canPerformAction(role, 'product.create')  // true para Supervisor, false para Cajero
canPerformAction(role, 'pos.sell')        // true para ambos
canPerformAction(role, 'reports.view')    // true solo Supervisor
```

| Función | Supervisor | Cajero |
|---|---|---|
| Vender en POS | ✅ | ✅ |
| Abrir/Cerrar caja | ✅ | ✅ |
| Crear/Editar productos | ✅ | ❌ |
| Registrar compras | ✅ | ❌ |
| Ver reportes | ✅ | ❌ |
| Ver bitácora de auditoría | ✅ | ❌ |

---

### Motor Offline-First

> *"Una de las características más avanzadas de StoreFlow: funciona sin internet."*

**¿Cómo?**
1. Cuando el dispositivo pierde conexión, las ventas se guardan en `localStorage` del navegador con estado `PENDING`.
2. Un proceso en segundo plano revisa la conexión periódicamente (Health Check).
3. Cuando vuelve el internet, la cola se drena automáticamente y las ventas se sincronizan con Supabase.
4. El cajero ve un banner de advertencia en el POS pero **puede seguir vendiendo sin interrupción**.

---

## ❹ ESTRUCTURA MVC — Carpetas, Archivos e Interacción Detallada (8 min)

> *"Ahora voy a mostrar el proyecto por dentro: carpeta por carpeta, archivo por archivo. Esta es la parte más importante desde el punto de vista arquitectónico porque demuestra cómo se aplica el patrón MVC + Service Layer en un proyecto real."*

---

### 📁 Visión General del Árbol de Directorios

```
src/
├── server/           ← BACKEND Node.js + Express (las 4 capas MVC)
│   ├── routes/       ← CAPA 1: Routes
│   ├── controllers/  ← CAPA 2: Controllers
│   ├── services/     ← CAPA 3: Services (lógica de negocio)
│   ├── models/       ← CAPA 4: Models (único acceso a BD)
│   ├── app.ts        ← Configuración de Express
│   └── index.ts      ← Punto de entrada del servidor
│
├── controllers/      ← CLIENTE React: Estado global y controladores de dominio
├── services/         ← CLIENTE React: Adaptadores API REST
├── models/           ← CLIENTE React: Interfaces TypeScript y cliente Supabase
├── lib/              ← Utilidades puras (formateo, generación de IDs)
└── views/            ← VISTA: Páginas y componentes de interfaz gráfica
    ├── pages/        ← Páginas principales (POSPage, ProductsPage, etc.)
    └── components/   ← Componentes reutilizables (Input, Button, Dialog, etc.)
```

> *"El proyecto tiene dos contextos: el Backend en `src/server/` que sigue MVC estricto, y el Cliente React en `src/` que también aplica la misma separación de capas pero adaptada al frontend."*

---

### 🔴 CAPA 1 — ROUTES (`src/server/routes/`)

**¿Qué son las Routes?**
Las Routes son la **puerta de entrada** del sistema. Su único trabajo es escuchar peticiones HTTP (GET, POST, PATCH, DELETE) y redirigirlas al Controlador correspondiente. **No contienen ninguna lógica de negocio.**

**Archivos:**

| Archivo | Endpoints que expone |
|---|---|
| `authRoutes.ts` | `POST /api/auth/login`, `POST /api/auth/logout` |
| `productRoutes.ts` | `GET /api/products`, `POST /api/products`, `DELETE /api/products/:id`, `PATCH /api/products/:id/stock` |
| `salesRoutes.ts` | `GET /api/sales`, `POST /api/sales`, `PATCH /api/sales/:id/void` |
| `cashRoutes.ts` | `GET /api/cash`, `POST /api/cash/open`, `PATCH /api/cash/:id/close` |
| `customerRoutes.ts` | `GET /api/customers`, `POST /api/customers`, `PUT /api/customers/:id` |
| `purchaseRoutes.ts` | `GET /api/purchases`, `POST /api/purchases`, `PATCH /api/purchases/:id/receive` |
| `settingsRoutes.ts` | `GET /api/settings`, `PUT /api/settings` |
| `index.ts` | Monta todas las rutas bajo el prefijo `/api` |

**Ejemplo real del código — `productRoutes.ts`:**
```typescript
import { Router } from 'express';
import { productController } from '../controllers/productController';

const router = Router();

router.get('/',              productController.getProductsData);  // listar productos
router.post('/category',     productController.upsertCategory);   // crear/editar categoría
router.post('/',             productController.upsertProduct);    // crear/editar producto
router.delete('/:id',        productController.deleteProduct);    // eliminar producto
router.patch('/:id/stock',   productController.updateStock);      // ajustar stock
router.post('/adjustment',   productController.insertAdjustment); // ajuste manual
```

> *"¿Ven que cada línea solo hace una cosa? Escuchar una ruta y llamar al controlador. Nada más. Esa es la regla estricta."*

**`app.ts` — Configuración de Express:**
```typescript
import express from 'express';
import cors from 'cors';
import apiRouter from './routes';

const app = express();
app.use(cors());           // permite peticiones desde el frontend React
app.use(express.json());   // parsea el body de las peticiones como JSON
app.use('/api', apiRouter); // monta TODAS las rutas bajo /api
app.get('/health', (req, res) => res.json({ status: 'ok' })); // Health Check
```

**`index.ts` — Punto de entrada del servidor:**
```typescript
import app from './app';
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en :${PORT}`));
```

---

### 🟠 CAPA 2 — CONTROLLERS (`src/server/controllers/`)

**¿Qué hacen los Controllers?**
Los Controllers son el **intermediario** entre las Routes y los Services. Su trabajo es:
1. Recibir la petición HTTP (`req`).
2. Extraer los datos del cuerpo (`req.body`) o de los parámetros de URL (`req.params`).
3. Llamar al Service correspondiente con esos datos.
4. Devolver la respuesta (`res.json()`).

**Regla crítica: El Controller NO contiene lógica de negocio. NO calcula. NO valida reglas del dominio. NO accede a la base de datos.**

**Archivos:**

| Archivo | ¿Qué coordina? |
|---|---|
| `authController.ts` | Login / logout de usuarios |
| `productController.ts` | Productos, categorías, marcas, ajustes de inventario |
| `salesController.ts` | Registro de ventas y anulaciones |
| `cashController.ts` | Apertura/cierre de caja, movimientos |
| `customerController.ts` | CRUD de clientes, abonos |
| `purchaseController.ts` | Órdenes de compra, recepción de mercancía |
| `settingsController.ts` | Configuración de empresa y logs |
| `index.ts` | Re-exporta todos los controladores |

**Ejemplo real del código — `productController.ts`:**
```typescript
import type { Request, Response } from 'express';
import { productService } from '../services/productService';

export const productController = {

  // GET /api/products → llama al service, responde con JSON
  async getProductsData(req: Request, res: Response) {
    try {
      const data = await productService.fetchProductsData(); // solo llama al service
      return res.status(200).json({ success: true, data });  // solo responde
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  // POST /api/products → extrae body, llama al service, responde
  async upsertProduct(req: Request, res: Response) {
    try {
      const product = req.body;                              // extrae datos
      await productService.upsertProduct(product);           // delega al service
      return res.status(200).json({ success: true, message: 'Producto guardado' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  // PATCH /api/products/:id/stock → extrae parámetros, llama al service
  async updateStock(req: Request, res: Response) {
    try {
      const productId = String(req.params.productId);        // extrae de URL
      const { newStock } = req.body;                         // extrae del body
      await productService.updateStock(productId, Number(newStock));
      return res.status(200).json({ success: true, message: 'Stock actualizado' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },
};
```

> *"Cada método tiene exactamente 3 líneas de lógica: extraer datos del request, llamar al service, responder. Cero validaciones de negocio aquí."*

---

### 🟡 CAPA 3 — SERVICES (`src/server/services/`)

**¿Qué hacen los Services?**
Los Services contienen **toda la lógica de negocio y las reglas del dominio**. Son el cerebro del sistema. Aquí viven:
- Validaciones de negocio ("el stock no puede ser negativo", "la venta debe tener al menos un producto").
- Cálculos ("total = subtotal + IVA - descuento").
- Transformaciones de datos (convertir el formato de la BD al formato de la aplicación).
- Orquestación entre múltiples modelos.

**Archivos:**

| Archivo | Lógica de negocio que contiene |
|---|---|
| `authService.ts` | Verificar credenciales, generar token de sesión |
| `productService.ts` | Validar nombre/precio, mapear columnas BD ↔ objetos TypeScript, calcular stock mínimo |
| `salesService.ts` | Calcular totales, descontar inventario por cada ítem vendido, actualizar saldo de cliente en crédito |
| `cashService.ts` | Calcular diferencia de arqueo, validar que no haya caja ya abierta |
| `customerService.ts` | Normalizar NIT/cédula, prevenir duplicados, calcular saldo de cartera |
| `purchaseService.ts` | Actualizar costo del producto al recibirlo, incrementar stock por ítem |
| `settingsService.ts` | Aplicar cambios de configuración, registrar logs de auditoría |
| `index.ts` | Re-exporta todos los servicios |

**Ejemplo real del código — `salesService.ts`:**
```typescript
async processSale(sale: Sale, products: Product[], customer?: Customer) {
  // REGLA DE NEGOCIO 1: la venta debe tener productos
  if (!sale.items || sale.items.length === 0) {
    throw new Error('La venta debe contener al menos un producto');
  }

  // PASO 1: guardar cabecera e ítems de venta
  await salesModel.insertSaleHeader(sale);
  await salesModel.insertSaleItems(items);

  // PASO 2: descontar inventario por cada producto vendido
  for (const item of sale.items) {
    const prod = products.find(p => p.id === item.productId);
    if (prod) {
      const nuevoStock = Math.max(0, prod.stock - item.quantity); // nunca negativo
      await productModel.updateStock(prod.id, nuevoStock);
    }
  }

  // PASO 3: si es venta a crédito, incrementar saldo del cliente
  if (sale.paymentMethod === 'credito' && customer) {
    await customerModel.updateBalance(customer.id, customer.balance + sale.total);
  }
}
```

> *"¿Ven cómo el Service coordina tres Modelos diferentes (salesModel, productModel, customerModel) para completar una sola venta? Esa orquestación es exactamente el trabajo del Service."*

**Ejemplo — `productService.ts` (validación + mapeo de datos):**
```typescript
async upsertProduct(p: Product): Promise<void> {
  // Validación de negocio: nombre requerido, precio no puede ser negativo
  if (!p.name || p.price < 0) {
    throw new Error('Nombre válido y precio >= 0 son obligatorios');
  }
  await productModel.upsertProduct(p); // delega al modelo
}

async updateStock(productId: string, newStock: number): Promise<void> {
  // Regla de negocio: el stock no puede ser negativo
  if (newStock < 0) throw new Error('El stock no puede ser negativo');
  await productModel.updateStock(productId, newStock);
}
```

---

### 🟢 CAPA 4 — MODELS (`src/server/models/`)

**¿Qué hacen los Models?**
Los Models son la **única puerta de acceso a la base de datos**. Ninguna otra capa puede hablar con Supabase directamente. Su trabajo es ejecutar consultas SQL y devolver los datos crudos (raw).

**Regla absoluta: Si alguna otra capa (Route, Controller o Service) contiene una consulta `supabase.from(...)`, la arquitectura está rota.**

**Archivos:**

| Archivo | Tablas de BD que administra |
|---|---|
| `authModel.ts` | `users` |
| `productModel.ts` | `products`, `categories`, `brands`, `inventory_adjustments` |
| `salesModel.ts` | `sales`, `sale_items` |
| `cashModel.ts` | `cash_sessions`, `cash_movements` |
| `customerModel.ts` | `customers` |
| `purchaseModel.ts` | `purchases`, `purchase_items` |
| `settingsModel.ts` | `settings`, `activity_logs` |
| `index.ts` | Re-exporta todos los modelos |

**Ejemplo real del código — `productModel.ts`:**
```typescript
import { supabase, isSupabaseConfigured } from '../../models/supabase';

export const productModel = {

  // Consulta múltiple en paralelo con Promise.all
  async findAllData() {
    if (!isSupabaseConfigured) return { categories: [], brands: [], products: [], adjustments: [] };

    const [
      { data: categories },
      { data: brands },
      { data: products },
      { data: adjustments },
    ] = await Promise.all([
      supabase.from('categories').select('*'),
      supabase.from('brands').select('*'),
      supabase.from('products').select('*'),
      supabase.from('inventory_adjustments').select('*'),
    ]);

    return { categories: categories || [], brands: brands || [],
             products: products || [], adjustments: adjustments || [] };
  },

  // INSERT / UPDATE de un producto
  async upsertProduct(p: Product): Promise<void> {
    await supabase.from('products').upsert({
      id: p.id,
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      category_id: p.categoryId || null,  // mapeo camelCase → snake_case
      brand_id: p.brandId || null,
      cost: p.cost,
      price: p.price,
      stock: p.stock,
      min_stock: p.minStock,
    });
  },

  // DELETE de un producto
  async deleteProduct(id: string): Promise<void> {
    await supabase.from('products').delete().eq('id', id);
  },

  // UPDATE solo del campo stock
  async updateStock(productId: string, newStock: number): Promise<void> {
    await supabase.from('products').update({ stock: newStock }).eq('id', productId);
  },
};
```

> *"¿Ven que en el Model no hay ninguna validación, ningún cálculo, ninguna decisión de negocio? Solo habla con la base de datos. Toda la inteligencia está en el Service."*

---

### 🔵 VISTA — VIEWS (`src/views/`)

**¿Qué son las Views en StoreFlow?**
Las Views son los componentes React que el usuario ve e interactúa. Se dividen en dos grupos:

**`src/views/pages/` — Páginas principales:**

| Archivo | Descripción |
|---|---|
| `POSPage.tsx` | Punto de Venta: carrito, búsqueda de productos, escáner, cobro, recibo |
| `ProductsPage.tsx` | Catálogo de productos: crear, editar, buscar, gestionar marcas |
| `PurchasesPage.tsx` | Compras: registrar órdenes, recibir mercancía, crear proveedores/productos en el momento |
| `CashPage.tsx` | Control de caja: apertura, cierre, arqueo, historial de sesiones |
| `SuppliersPage.tsx` | CRUD de proveedores |
| `CustomersPage.tsx` | Clientes, cartera de crédito y abonos |
| `ReportsPage.tsx` | Reportes de ventas, productos más vendidos, márgenes |
| `DashboardPage.tsx` | Panel de control con KPIs en tiempo real |
| `SettingsPage.tsx` | Configuración de empresa, impuestos, usuarios |
| `InventoryPage.tsx` | Ajustes manuales de inventario |
| `LogsPage.tsx` | Bitácora de auditoría con filtros |
| `LoginPage.tsx` | Pantalla de inicio de sesión |

**`src/views/components/ui/` — Componentes reutilizables:**

| Archivo | Componentes que exporta |
|---|---|
| `Input.tsx` | `Input` (texto), `CurrencyInput` (moneda con miles y decimales), `NumberInput` (enteros), `Select`, `Textarea` |
| `Button.tsx` | Botones con variantes: `primary`, `outline`, `ghost`, `danger` |
| `Card.tsx` | `Card`, `CardContent`, `Badge` (etiquetas de estado), `EmptyState` |
| `Dialog.tsx` | Modal reutilizable con soporte de `size`, `title`, `description` y `footer` |
| `DataTable.tsx` | Tabla genérica `DataTable<T>` con columnas tipadas y soporte de click por fila |
| `Toast.tsx` | Notificaciones emergentes: `success`, `error`, `warning`, `info` |
| `Breadcrumb.tsx` | Navegación de migas de pan |
| `PageHeader.tsx` | Encabezado estándar de página con título, descripción, ícono y acciones |

> *"Las Views nunca acceden a Supabase directamente. Llaman a funciones del Controlador React (`StoreController`), que a su vez llaman a los Services del cliente, que se comunican con el Backend."*

---

### 🟣 CONTROLADORES REACT (`src/controllers/`)

**¿Cómo funciona el lado del cliente?**
El cliente React también aplica separación de capas. El corazón es el `StoreController.tsx`:

**`StoreController.tsx` — El Controlador Principal:**
Es un **Context API de React** que:
1. Al iniciar, llama en paralelo a todos los servicios para cargar los datos (`fetchProductsData()`, `fetchSalesData()`, etc.).
2. Expone todas las acciones del sistema (`addSale`, `upsertProduct`, `openCash`, etc.) a todos los componentes de la app.
3. Mantiene el estado global de la aplicación en memoria (`db`).
4. Ejecuta el motor de sincronización Offline-First cada 15 segundos.

```typescript
// StoreController.tsx — simplificado
const StoreProvider = ({ children }) => {
  const [db, setDb] = useState(seedDatabase()); // estado inicial desde la semilla

  useEffect(() => {
    // Al iniciar: cargar datos desde Supabase vía los servicios del cliente
    Promise.all([
      productService.fetchProductsData(),
      salesService.fetchSalesData(),
      cashService.fetchCashData(),
      // ...más servicios
    ]).then(([products, sales, cash, ...]) => {
      setDb(prev => ({ ...prev, products, sales, cash }));
    });
  }, []);

  // Exponer acciones a toda la app vía Context
  return (
    <StoreContext.Provider value={{ db, addSale, upsertProduct, openCash, ... }}>
      {children}
    </StoreContext.Provider>
  );
};
```

**Controladores de dominio especializados:**

| Archivo | Responsabilidad |
|---|---|
| `AuthController.ts` | Login, logout, manejo de sesión y usuario actual |
| `ProductController.ts` | `upsertProduct`, `upsertBrand`, `upsertCategory`, `deleteProduct` |
| `SalesController.ts` | `addSale`, cálculo del carrito |
| `CashController.ts` | `openCash`, `closeCash`, `addMovement` |
| `CustomerController.ts` | `upsertCustomer`, `addPayment` (abonos) |
| `PurchaseController.ts` | `addPurchase`, `receivePurchase`, `upsertSupplier` |
| `SettingsController.ts` | `updateSettings`, logs de auditoría |
| `permissions.ts` | `canPerformAction(role, action)` — control RBAC centralizado |
| `types.ts` | Tipos TypeScript de todas las acciones del store |

---

### 🔶 SERVICIOS DEL CLIENTE (`src/services/`)

Los servicios del cliente son los **adaptadores** entre el Controlador React y el Backend Node.js. Cada servicio sabe cómo hacer peticiones HTTP al backend y cómo manejar errores de conexión.

| Archivo | Backend endpoint que consume |
|---|---|
| `authService.ts` | `POST /api/auth/login`, `POST /api/auth/logout` |
| `productService.ts` | `GET /api/products`, `POST /api/products`, etc. |
| `salesService.ts` | `GET /api/sales`, `POST /api/sales` |
| `cashService.ts` | `GET /api/cash`, `POST /api/cash/open`, etc. |
| `purchaseService.ts` | `GET /api/purchases`, `POST /api/purchases` |
| `syncService.ts` | Motor Offline-First: procesa la cola de ventas pendientes |

---

### 🔷 MODELOS DEL CLIENTE (`src/models/`)

| Archivo | ¿Qué contiene? |
|---|---|
| `types.ts` | **Todas las interfaces TypeScript** del sistema: `Product`, `Sale`, `Purchase`, `Supplier`, `Customer`, `Brand`, `Category`, etc. Son el contrato de datos que usan todas las capas. |
| `supabaseClient.ts` | Instancia del cliente Supabase (`createClient(URL, KEY)`). Es importado **solo por los Models del backend**. |
| `seed.ts` | Datos iniciales: categorías y marcas predeterminadas. Se usan cuando no hay conexión a Supabase. |

---

### 🔁 Diagrama Completo de Interacción — Flujo de una Venta

```
USUARIO hace clic en "Cobrar"
         │
         ▼
[VIEW] POSPage.tsx
  → llama a addSale() del contexto
         │
         ▼
[CONTROLLER] StoreController.tsx / SalesController.ts
  → actualiza el estado local (carrito → vacío)
  → llama a salesService.processSale(sale, products)
         │
         ▼
[SERVICE cliente] src/services/salesService.ts
  → fetch('POST /api/sales', { body: JSON.stringify(sale) })
         │
         ▼ HTTP REST
[ROUTE backend] src/server/routes/salesRoutes.ts
  → router.post('/') → salesController.processSale
         │
         ▼
[CONTROLLER backend] src/server/controllers/salesController.ts
  → extrae req.body
  → llama salesService.processSale(sale, products, customer)
         │
         ▼
[SERVICE backend] src/server/services/salesService.ts
  → Valida que la venta tenga ítems
  → llama salesModel.insertSaleHeader(sale)
  → llama salesModel.insertSaleItems(items)
  → Por cada ítem: llama productModel.updateStock(id, stock - qty)
  → Si crédito: llama customerModel.updateBalance(id, balance + total)
         │
         ▼
[MODEL backend] src/server/models/salesModel.ts / productModel.ts
  → supabase.from('sales').insert(...)
  → supabase.from('sale_items').insert(...)
  → supabase.from('products').update({ stock })
         │
         ▼
[BASE DE DATOS] Supabase (PostgreSQL)
  → Datos persistidos en la nube
         │
         ▼
[RESPUESTA] res.status(200).json({ success: true })
  → StoreController actualiza el estado global
  → La interfaz muestra el recibo de venta
```

> *"Este flujo completo, desde que el usuario hace clic hasta que el dato queda guardado en PostgreSQL, pasa por exactamente 4 capas en el backend (Route → Controller → Service → Model). Cada capa hace solo lo que le corresponde. Eso es MVC + Service Layer en acción."*

---

## ❺ DEMO EN VIVO — Recorrido por Módulos (12 min)

> *"Ahora vamos a ver el sistema funcionando. Ingresamos con el rol Supervisor."*

**Credenciales demo:**
- Email: `supervisor@storeflow.com`
- Contraseña: `super123`

---

### 🖥️ DEMO 1 — Panel de Control (Dashboard)

**Qué mostrar:**
- Tarjetas de resumen: ventas del día, ingresos, productos con stock bajo, clientes activos.
- Gráfico de ventas recientes.
- Accesos directos a los módulos más usados.

**Qué decir:**
> *"Este es el panel de control. De un vistazo el dueño del negocio puede ver cuánto vendió hoy, cuántos productos están por agotarse y cuántos clientes tiene activos. La información está en tiempo real, sincronizada con la base de datos en Supabase."*

---

### 🛒 DEMO 2 — Punto de Venta (POS)

**Preparación previa:** Asegurarse de que la caja esté cerrada para demostrar el flujo completo.

**Paso 1 — Abrir caja:**
- Ir a POS. El sistema muestra el modal de apertura de caja.
- Mostrar el campo **"Monto inicial en caja"** con el nuevo `CurrencyInput`.
- Escribir `50000` → observar cómo se formatea automáticamente: `50.000,00`.
- Destacar los botones de acceso rápido: `$20.000`, `$50.000`, `$100.000`.
- Confirmar apertura.

> *"Noten que el campo de monto tiene formato automático de moneda: puntos de miles y dos cifras decimales. Esto evita errores de digitación y hace la lectura más clara. Este componente, llamado `CurrencyInput`, está implementado en toda la aplicación."*

**Paso 2 — Agregar productos:**
- Escribir el nombre de un producto en la barra de búsqueda.
- Mostrar la búsqueda en tiempo real con `useMemo` (instantánea, sin peticiones al servidor).
- Agregar 2 o 3 productos al carrito.

**Paso 3 — Escáner de código de barras:**
- Hacer clic en el ícono de cámara.
- Mostrar el modal del escáner con el visor de cámara.
- Escanear un producto.
- Mostrar la **tarjeta verde de vista previa** que aparece en tiempo real con el nombre, precio y stock del producto detectado.
- Mencionar que si el código no existe en el catálogo, aparece una tarjeta **roja** con el mensaje "Producto no encontrado".

> *"Esta es una de las mejoras más importantes de la versión 2.0. Antes el escáner solo mostraba el código crudo. Ahora muestra toda la información del producto al instante, para que el cajero confirme visualmente que está cobrando el producto correcto."*

**Paso 4 — Procesar pago en efectivo:**
- Seleccionar método de pago: **Efectivo**.
- Mostrar el campo **"Efectivo recibido"** con `CurrencyInput`.
- Ingresar un monto con redondeo, por ejemplo `60.000`.
- Mostrar el cálculo automático del **cambio a devolver**.
- Mostrar los botones de acceso rápido (monto exacto, redondeo ×5k, ×10k).
- Confirmar el pago.

> *"El sistema calcula el cambio automáticamente. Estos botones de acceso rápido son una idea tomada de las cajas registradoras físicas modernas: ayudan al cajero a seleccionar el billete que recibió sin tener que escribir el monto."*

**Paso 5 — Recibo:**
- Mostrar el modal de recibo con el desglose: subtotal, IVA, total, efectivo recibido, cambio.
- Mostrar el botón de impresión.

---

### 📦 DEMO 3 — Catálogo de Productos

**Paso 1 — Crear un producto:**
- Clic en "Nuevo producto".
- Mostrar los campos con `CurrencyInput` para **Precio de venta** y **Costo de compra**.
- Mostrar los campos con `NumberInput` para **Stock** y **Stock mínimo** (sin flechas de incremento).
- Escribir el nombre y mostrar cómo se auto-genera el SKU.
- Seleccionar categoría y marca.
- Mostrar la opción **`+ Nueva marca`** para crear una marca que no existe.

> *"Los campos de precio y costo usan el componente `CurrencyInput`. Los de stock y stock mínimo usan `NumberInput`, que no tiene las flechas de incremento del navegador que a veces confunden al usuario. Ambos componentes borran el cero automáticamente al hacer clic, para que puedas escribir el valor de inmediato."*

**Paso 2 — Gestión de marcas:**
- Mostrar el botón **"Gestor de Marcas"**.
- Editar el nombre de una marca existente.

> *"Antes no se podía editar el nombre de las marcas. Ahora se puede desde el catálogo de productos."*

**Paso 3 — Escanear código de barras para buscar en Open Food Facts:**
- Hacer clic en el ícono de escaneo dentro del formulario de producto.
- Escanear un producto empacado (ej. una botella de refresco).
- Mostrar cómo el sistema busca automáticamente en la API de Open Food Facts y auto-rellena nombre, categoría y marca.

---

### 🚚 DEMO 4 — Compras a Proveedores

Este módulo tiene las mejoras más significativas de la versión 2.0.

**Paso 1 — Registrar una compra:**
- Clic en "Registrar compra".
- Mostrar el selector de proveedor.
- Hacer clic en **`+ Nuevo proveedor`**.
- Llenar el formulario rápido: razón social, NIT, teléfono.
- Guardar. El proveedor queda seleccionado automáticamente.

> *"En la versión anterior, si llegaba un proveedor nuevo con una factura, el usuario tenía que salir del módulo de compras, ir a Proveedores, crear el registro, y volver. Ahora puede crear el proveedor directamente desde la compra, sin perder el contexto."*

**Paso 2 — Agregar productos a la compra:**
- Escribir el nombre de un producto existente en la barra de búsqueda.
- Mostrar que busca por **nombre, SKU y código de barras** simultáneamente.

> *"Antes solo buscaba por nombre. Ahora busca también por SKU y por código de barras, lo que es fundamental si tienes un lector USB o estás usando la cámara."*

**Paso 3 — Producto no encontrado:**
- Escribir un nombre o código de barras que no exista en el catálogo.
- Mostrar el menú desplegable con el mensaje: *"No se encontró ningún producto registrado con '...' "*.
- Mostrar el botón **`+ Registrar '...' como producto nuevo`** dentro del mismo desplegable.
- Hacer clic en él.

> *"Esta es una de las mejoras de UX más importantes. Cuando el sistema no encuentra el producto, no te deja con las manos vacías. Te dice exactamente qué pasó y te da la opción de crear el producto en ese mismo instante."*

**Paso 4 — Crear producto nuevo dentro de la compra:**
- Mostrar el modal de creación rápida con el código de barras ya pre-llenado.
- Llenar nombre, categoría.
- En el campo **Marca**, hacer clic en **`+ Nueva marca`**.
- Escribir el nombre de la marca, presionar Guardar (o Enter).
- La marca queda registrada y seleccionada inmediatamente.
- Ingresar costo y precio de venta con `CurrencyInput`.
- Crear y agregar.

> *"Sin salir del módulo de compras, creamos el proveedor, creamos el producto y creamos la marca. Todo el flujo en un solo lugar. Esto es lo que diferencia un sistema bien diseñado de uno que te hace perder tiempo."*

**Paso 5 — Recibir la compra:**
- Regresar a la lista de compras.
- Mostrar la compra en estado "Pendiente".
- Hacer clic en "Recibir".
- Confirmar la recepción.
- Ir al catálogo de productos y mostrar cómo el stock se actualizó automáticamente.

---

### 💰 DEMO 5 — Control de Caja

**Qué mostrar:**
- Sesión actual con monto de apertura y ventas del turno.
- Botón de cerrar caja: muestra el arqueo (esperado vs. real).
- Historial de sesiones anteriores.
- Movimientos de caja: ejemplo de un egreso (pago de servicios).

> *"El arqueo de caja le dice al supervisor cuánto dinero debería haber en la caja según las ventas registradas, comparado con cuánto hay físicamente. Si hay diferencia, se detecta inmediatamente y queda registrada."*

---

### 📊 DEMO 6 — Reportes y Auditoría

**Qué mostrar:**
- Ventas del período con filtros de fecha.
- Producto más vendido.
- Bitácora de auditoría: quién hizo qué y cuándo.

> *"Toda acción en el sistema queda registrada: quién abrió la caja, quién hizo un descuento, quién modificó el precio de un producto. Esto es fundamental para el control interno del negocio."*

---

## ❻ ASPECTOS TÉCNICOS DESTACADOS (3 min)

### Componente `CurrencyInput` — Detalle Técnico

> *"Uno de los componentes que más trabajo costó pero que más impacto tiene en la UX es `CurrencyInput`."*

**El problema que resuelve:**
Los campos `<input type="number">` del HTML nativo tienen varios problemas:
1. Muestran flechas de incremento/decremento que no sirven para montos grandes.
2. No formatean el número (el usuario tiene que contar ceros).
3. No borran el `0` inicial al hacer clic.
4. No muestran separadores de miles.

**Cómo se implementó:**

```typescript
// src/views/components/ui/Input.tsx
export function CurrencyInput({ value, onChange, currencySymbol, decimals = 2 }) {
  // 1. Al enfocar: convertir número a cadena editable sin formato
  const handleFocus = () => {
    setDisplayValue(value === 0 ? '' : value.toString().replace('.', ','));
  };

  // 2. Al cambiar: permitir solo dígitos y coma decimal
  const handleChange = (e) => {
    const raw = e.target.value.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(raw) || 0;
    onChange(num);  // siempre emite un número
  };

  // 3. Al desenfocar: aplicar formato completo con puntos de miles
  const handleBlur = () => {
    setDisplayValue(formatWithThousands(value, decimals));
  };
}
```

> *"La clave es que internamente el campo siempre trabaja con un `number`. El formato visual (puntos y comas) es solo para el usuario. Esto evita errores en los cálculos."*

---

### Escáner de Código de Barras

```typescript
// Usa Html5Qrcode para acceder a la cámara del dispositivo
const html5Qrcode = new Html5Qrcode('scanner-view');
await html5Qrcode.start(
  { facingMode: 'environment' },  // cámara trasera
  { fps: 15, qrbox: { width: 250, height: 180 } },
  (decodedText) => {
    // Se detectó un código de barras
    const product = db.products.find(p => p.barcode === decodedText);
    setScannedProduct(product ?? null);  // muestra tarjeta verde o roja
    onScan(decodedText);
  }
);
```

> *"Con 15 frames por segundo de análisis, la detección es prácticamente instantánea. Funciona en celulares, tablets y laptops con cámara."*

---

## ❼ TECNOLOGÍAS UTILIZADAS (1 min)

| Capa | Tecnología | Por qué se escogió |
|---|---|---|
| Frontend | **React 18 + TypeScript** | Ecosistema maduro, tipado estático evita bugs en producción |
| Compilador | **Vite** | 10x más rápido que Create React App |
| Backend | **Node.js + Express.js** | Liviano, ampliamente conocido, perfecto para API REST |
| Base de datos | **Supabase (PostgreSQL)** | Gratuito hasta cierto límite, Auth integrado, Row Level Security |
| Animaciones | **Framer Motion** | Animaciones declarativas con física real |
| Íconos | **Lucide React** | Consistentes, livianos, más de 1000 íconos |
| Escaneo | **Html5Qrcode** | Soporte de más de 15 formatos de código de barras y QR |

---

## ❽ DECISIONES DE DISEÑO — UX (2 min)

> *"Voy a explicar algunas decisiones de diseño que pueden parecer pequeñas pero que hacen una gran diferencia para el usuario final."*

### Decisión 1: Eliminar las flechas de los campos numéricos

Los campos `<input type="number">` nativos tienen flechas de incremento. Para una tienda, nadie va a usar esas flechas para llegar a `$45.000`. Se eliminaron globalmente:

```css
/* src/index.css */
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
}
```

### Decisión 2: El `0` desaparece al hacer clic

Cuando un campo tiene `0` por defecto y el usuario hace clic, el `0` se borra automáticamente. Así no tiene que borrar manualmente el cero antes de escribir el valor real.

### Decisión 3: Flujo sin interrupciones en Compras

Antes de v2.0, registrar una compra con un producto nuevo requería:
1. Ir a Proveedores → crear proveedor → copiar el ID → volver a Compras.
2. Ir a Productos → crear producto → copiar el ID → volver a Compras.

Ahora todo ocurre en un solo modal, sin perder el contexto de la compra.

### Decisión 4: Modo oscuro y diseño premium

El sistema usa un sistema de tokens CSS (variables) que soporta modo claro y oscuro. La paleta fue elegida para ser profesional y agradable visualmente, usando glassmorphism, sombras suaves y gradientes.

---

## ❾ CONCLUSIONES (1 min)

**Lo que StoreFlow demuestra:**

1. **Arquitectura**: Una separación de capas estricta hace el código mantenible y escalable.
2. **UX**: Los detalles de interfaz (formato de números, flujos sin interrupciones) son tan importantes como la funcionalidad.
3. **Resiliencia**: Un sistema de producción real debe funcionar aunque falle la infraestructura.
4. **RBAC**: La seguridad no es un añadido, es parte del diseño desde el principio.
5. **Iteración**: Las mejoras de v2.0 nacieron de necesidades reales: un usuario real probó el sistema y reportó lo que no funcionaba bien.

> *"StoreFlow no es un proyecto académico terminado. Es una aplicación funcional que podría desplegarse en una tienda real hoy mismo. De hecho, está en GitHub y cualquiera puede clonarla y ejecutarla en 5 minutos."*

---

## ❿ PREGUNTAS FRECUENTES (Para anticipar preguntas del evaluador)

**P: ¿Por qué usaron Supabase y no una base de datos local?**
> R: Supabase ofrece PostgreSQL completamente gestionado en la nube, con autenticación, Row Level Security y una API REST automática. Para un proyecto de este alcance, el tiempo que ahorras en infraestructura lo puedes invertir en lógica de negocio.

**P: ¿Cómo garantizan que el sistema no se rompa si cae Supabase?**
> R: Motor Offline-First. Las ventas se encolan en localStorage y se sincronizan cuando vuelve la conexión.

**P: ¿El escáner de código de barras funciona en todos los navegadores?**
> R: Html5Qrcode usa la API `getUserMedia` del navegador, que está disponible en Chrome, Firefox, Edge y Safari modernos. Requiere HTTPS o localhost.

**P: ¿Por qué separaron el Backend de Node.js del cliente React?**
> R: Para cumplir la arquitectura MVC completa. El backend es el contrato: si el frontend cambia (por ejemplo, a una app móvil), el backend no cambia.

**P: ¿Qué tan seguro es el sistema?**
> R: Los passwords se hashean (Supabase Auth), las acciones están protegidas por RBAC, y Supabase usa Row Level Security para que cada usuario solo vea sus propios datos.

---

## ⓫ RECURSOS Y REFERENCIAS

- **Repositorio GitHub:** https://github.com/Luis9007/StoreFlow
- **Demo en vivo:** http://localhost:5173 (ejecutar `npm run dev`)
- **Documento Técnico:** `DOCUMENTO_TECNICO.md` en el repositorio
- **Arquitectura:** `ARCHITECTURE.md` en el repositorio
- **Open Food Facts API:** https://world.openfoodfacts.org/
- **Supabase:** https://supabase.com/
- **Html5Qrcode:** https://github.com/mebjas/html5-qrcode

---

*StoreFlow v2.0 — Guía de Presentación. Preparada para presentación académica universitaria.*
