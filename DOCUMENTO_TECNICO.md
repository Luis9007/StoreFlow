# 📘 Documento Técnico — StoreFlow v2.0
**Sistema de Punto de Venta, Inventario y Gestión Empresarial para Comercios Minoristas**

---

> **Versión:** 2.0 — Julio 2026
> **Repositorio:** https://github.com/Luis9007/StoreFlow
> **Stack:** React 18 + TypeScript + Vite + Supabase + Node.js + Express.js

---

## 1. Resumen Ejecutivo

**StoreFlow** es una plataforma web empresarial de código abierto diseñada para digitalizar y modernizar la gestión operativa de comercios minoristas (tiendas de abarrotes, minimarkets, boutiques, ferreterías). Opera bajo una **arquitectura desacoplada de 4 capas MVC + Service Layer** respaldada por un servidor **Backend Node.js / Express.js** y un **Motor Offline-First** que garantiza continuidad operativa sin conexión a internet.

La versión 2.0 incorpora mejoras críticas en la experiencia de usuario (UX), formato de moneda con puntuación de miles, flujos de trabajo de compras mejorados, gestión de marcas en tiempo real, escáner de código de barras con vista previa de producto y documentación completa.

---

## 2. Planteamiento del Problema

Los comercios minoristas de pequeño y mediano tamaño enfrentan retos críticos:

| Problema | Impacto |
|---|---|
| Dependencia de cuadernos y hojas de cálculo para el inventario | Errores frecuentes, pérdidas de mercancía no detectadas |
| Ausencia de sistema POS con lector de código de barras | Cobros lentos y propensos a errores de digitación |
| Imposibilidad de vender si cae el internet | Pérdida de ventas y desconfianza del cliente |
| Sin control de caja al inicio/cierre de turno | Descuadres de efectivo sin trazabilidad |
| Sin gestión de proveedores ni historial de compras | Costos de productos desactualizados |

**StoreFlow v2.0** resuelve estos problemas con una solución integral, moderna y de bajo costo de implementación.

---

## 3. Arquitectura del Sistema

### 3.1 Diagrama de Capas

```
+----------------------------------------------------------+
|              CLIENTE REACT (SPA — Vite)                   |
|  Views → Controllers → Services → Models (Supabase)       |
|  + Motor Offline-First (LocalStorage Queue)               |
+---------------------+------------------------------------+
                      | HTTP REST (fetch)
                      v
+----------------------------------------------------------+
|         BACKEND NODE.JS + EXPRESS.JS (:3001)              |
|  Routes → Controllers → Services → Models (SQL)           |
+---------------------+------------------------------------+
                      | SQL (Supabase Client)
                      v
+----------------------------------------------------------+
|              SUPABASE (PostgreSQL + Auth + RLS)            |
+----------------------------------------------------------+
```

### 3.2 Las 4 Capas del Backend (MVC + Service Layer)

| Capa | Archivo | Responsabilidad Exclusiva |
|---|---|---|
| **Routes** | `src/server/routes/*.ts` | Definir endpoints HTTP, mapear a controladores. Sin lógica. |
| **Controllers** | `src/server/controllers/*.ts` | Leer `req`, llamar al servicio, responder con `res.json()`. Sin lógica de negocio. |
| **Services** | `src/server/services/*.ts` | Toda la lógica de negocio, validaciones, cálculos, reglas del dominio. |
| **Models** | `src/server/models/*.ts` | **Única capa** con acceso a la base de datos Supabase/SQL. |

### 3.3 Estructura de Directorios

```
StoreFlow/
├── src/
│   ├── server/                   # Backend Node.js + Express.js
│   │   ├── routes/               # Enrutadores HTTP Express
│   │   ├── controllers/          # Controladores Express (req, res)
│   │   ├── services/             # Lógica de negocio pura
│   │   ├── models/               # Único acceso a la base de datos
│   │   ├── app.ts                # Express app con CORS + JSON middleware
│   │   └── index.ts              # Entry point servidor en :3001
│   │
│   ├── controllers/              # Cliente React — Estado de presentación
│   │   ├── StoreController.tsx   # Context API global (db, acciones CRUD)
│   │   ├── ProductController.ts
│   │   ├── PurchaseController.ts
│   │   ├── SalesController.ts
│   │   ├── CashController.ts
│   │   ├── CustomerController.ts
│   │   ├── AuthController.ts
│   │   ├── permissions.ts        # RBAC: canPerformAction(role, action)
│   │   └── types.ts
│   │
│   ├── services/                 # Cliente React — Adaptadores API + Supabase
│   ├── models/
│   │   ├── types.ts              # Interfaces TypeScript
│   │   ├── seed.ts               # Datos iniciales
│   │   └── supabaseClient.ts
│   │
│   ├── lib/
│   │   └── utils.ts              # formatCurrency, generateSequentialId, etc.
│   │
│   └── views/
│       ├── components/ui/
│       │   ├── Input.tsx         # Input, CurrencyInput, NumberInput, Select
│       │   ├── Button.tsx
│       │   ├── Dialog.tsx
│       │   └── DataTable.tsx
│       └── pages/
│           ├── POSPage.tsx       # Punto de Venta
│           ├── ProductsPage.tsx  # Catálogo + Inventario
│           ├── PurchasesPage.tsx # Compras a proveedores
│           ├── CashPage.tsx      # Control de caja
│           ├── SuppliersPage.tsx # Proveedores
│           ├── CustomersPage.tsx # Clientes y cartera
│           ├── ReportsPage.tsx   # Reportes
│           ├── DashboardPage.tsx # Panel principal
│           ├── SettingsPage.tsx  # Configuración + Auditoría
│           └── InventoryPage.tsx # Ajustes de inventario
│
├── supabase/                     # Migraciones SQL
├── ARCHITECTURE.md
├── README.md
├── DOCUMENTO_TECNICO.md
└── package.json
```

---

## 4. Módulos Funcionales

### 4.1 Módulo POS (Punto de Venta) — `POSPage.tsx`

El módulo POS es el núcleo operativo de StoreFlow. Gestiona el ciclo completo de una venta.

**Flujo operativo:**
1. El cajero abre la caja ingresando el monto base en efectivo (campo `CurrencyInput` con formato automático de miles y decimales).
2. Busca productos por nombre, SKU o código de barras (búsqueda en tiempo real con `useMemo`).
3. Alternativamente, escanea el código de barras con la cámara del dispositivo (`Html5Qrcode`). El escáner muestra una **vista previa del producto** en tiempo real (nombre, precio, stock) o un aviso de "no encontrado" si el código no está registrado.
4. Los productos se agregan al carrito con descuento opcional por ítem.
5. El cajero selecciona el método de pago: **Efectivo, Tarjeta, Transferencia o Crédito**.
6. En pagos en efectivo, ingresa el monto recibido en el campo `CurrencyInput` con puntuación de miles. El sistema calcula el cambio automáticamente.
7. Se emite el recibo térmico y se registra la venta en Supabase.

**Componentes técnicos clave:**
- `CurrencyInput`: campo con puntuación de miles, 2 decimales, y borrado de `0` al enfocar.
- `Html5Qrcode`: librería de escaneo por cámara con detección de 15 FPS y preview de producto.
- Motor Offline-First: cola de ventas pendientes en `localStorage` si Supabase no está disponible.
- Control RBAC: `canPerformAction(currentUser.role, 'pos.sell')`.

### 4.2 Módulo de Productos e Inventario — `ProductsPage.tsx`

**Funcionalidades:**
- **CRUD completo** de productos con generación automática de SKU (`generateSkuFromName`).
- **Barra de búsqueda** por nombre, SKU, código de barras, categoría y marca.
- **Campos de moneda** (`CurrencyInput`) para precio de venta y costo de compra.
- **Campos numéricos** (`NumberInput`) para stock y stock mínimo sin flechas de incremento.
- **Gestión de Marcas** inline: crear, editar y seleccionar marcas sin salir del formulario.
- **Gestión de Categorías** con selector de color.
- Alerta visual de productos con stock por debajo del mínimo configurado.
- Búsqueda en Open Food Facts API al escanear código de barras (auto-rellena datos del producto).

### 4.3 Módulo de Compras — `PurchasesPage.tsx`

**Flujo de trabajo:**
1. El usuario registra una nueva compra seleccionando o **creando un proveedor nuevo en el momento** (`+ Nuevo proveedor`).
2. Agrega productos al carrito de compra buscando por **nombre, SKU o código de barras**.
3. Si el producto **no existe en el catálogo**, el desplegable muestra: *"No se encontró ningún producto registrado con [X]"* + botón **`+ Registrar como producto nuevo`**.
4. Al crear un producto nuevo en la compra, puede también **crear una marca nueva** inline con `+ Nueva marca`.
5. El campo **Costo unitario** usa `CurrencyInput` con puntuación de miles y 2 decimales.
6. Al recibir la mercancía físicamente, se presiona **"Recibir compra"**: el stock de cada producto se actualiza automáticamente.

**Estado de compras:** `pendiente` → `recibida` → `cancelada`

### 4.4 Módulo de Caja — `CashPage.tsx`

- **Apertura de caja**: campo `CurrencyInput` para el monto base con accesos rápidos a montos predefinidos.
- **Cierre de caja**: arqueo final con diferencia calculada (esperado vs. real).
- **Movimientos de caja**: entradas y egresos adicionales con concepto y monto.
- **Historial de sesiones**: tabla con todas las sesiones y sus arqueos.

### 4.5 Módulo de Clientes y Cartera — `CustomersPage.tsx`

- CRUD de clientes con normalización de Cédula/NIT.
- Ventas a crédito: acumulación de saldo pendiente.
- Registro de abonos parciales con fecha y monto.

### 4.6 Módulo de Proveedores — `SuppliersPage.tsx`

- CRUD de proveedores con razón social, NIT, contacto, teléfono y correo.
- Creación rápida desde el formulario de compras.

### 4.7 Módulo de Reportes — `ReportsPage.tsx`

- Ventas por período, por producto, por cajero.
- Productos más vendidos y margen bruto por producto.

### 4.8 Auditoría y Permisos (RBAC)

- **RBAC** (`permissions.ts`): cada acción del sistema protegida por rol.
- Roles: **Supervisor** (acceso total) y **Cajero** (POS y caja).
- **Bitácora `LogsPage.tsx`**: registro de todos los eventos con usuario, acción y timestamp.

---

## 5. Componentes UI Reutilizables — `Input.tsx`

### 5.1 `CurrencyInput` — Entrada de Moneda

```typescript
<CurrencyInput
  label="Precio de venta"
  value={price}                      // number
  onChange={(val) => setPrice(val)}  // (number) => void
  currencySymbol="$"
  decimals={2}
/>
```

**Comportamiento:**
- Al enfocar: borra el `0` y selecciona el contenido para escritura inmediata.
- Aplica puntos (`.`) como separador de miles: `1.500.000`.
- Aplica coma (`,`) como separador decimal: `1.500.000,00`.
- Convierte la cadena formateada de vuelta a `number` al cambiar.
- Correctamente maneja valores como `10.000`, `15.500`, `100.000` sin convertir los puntos de miles en decimales.

### 5.2 `NumberInput` — Entrada Numérica Entera

```typescript
<NumberInput
  label="Stock"
  value={stock}
  onChange={(val) => setStock(val)}
/>
```

- Sin flechas de spin button (eliminadas globalmente en `index.css` vía `-webkit-appearance: none`).
- Borra el `0` al enfocar.
- Solo acepta enteros positivos.

---

## 6. Motor Offline-First y Resiliencia

1. **Detección de conexión**: `navigator.onLine` + Health Check periódico al backend.
2. **Cola de operaciones**: las ventas se almacenan en `localStorage` con estado `PENDING`.
3. **Sincronización automática**: al recuperar conexión, la cola se drena y sube a Supabase.
4. **Indicador visual**: banner en el POS que informa el estado de conexión al operador.

---

## 7. Esquema de Base de Datos (Supabase / PostgreSQL)

| Tabla | Descripción |
|---|---|
| `users` | Usuarios del sistema con rol y contraseña hasheada |
| `products` | Catálogo de productos (SKU, barcode, cost, price, stock) |
| `categories` | Categorías de productos con color |
| `brands` | Marcas de productos |
| `sales` | Cabecera de ventas (total, método de pago, cajero) |
| `sale_items` | Ítems de cada venta |
| `purchases` | Órdenes de compra a proveedores |
| `purchase_items` | Ítems de cada orden de compra |
| `suppliers` | Proveedores (NIT, contacto, balance) |
| `customers` | Clientes (cédula/NIT, balance de cartera) |
| `cash_sessions` | Sesiones de caja (apertura, cierre, arqueo) |
| `cash_movements` | Movimientos individuales de efectivo |
| `inventory_adjustments` | Ajustes manuales de inventario |
| `activity_logs` | Bitácora de auditoría |

---

## 8. Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| **React** | 18 | UI declarativa con hooks y Context API |
| **TypeScript** | 5+ | Tipado estático estricto |
| **Vite** | 5+ | Compilador y bundler con HMR |
| **Node.js** | 18+ | Runtime del servidor backend |
| **Express.js** | 4 | Framework HTTP para el API REST |
| **Supabase** | — | PostgreSQL + Auth + Row Level Security |
| **Framer Motion** | 11 | Animaciones de componentes y modales |
| **Lucide React** | — | Librería de íconos SVG |
| **Html5Qrcode** | — | Escaneo de códigos de barras por cámara |
| **Tailwind CSS** | 3 | Utilidades CSS complementarias |

---

## 9. Control de Acceso Basado en Roles (RBAC)

| Acción | Supervisor | Cajero |
|---|---|---|
| `pos.sell` | ✅ | ✅ |
| `product.create` | ✅ | ❌ |
| `product.edit` | ✅ | ❌ |
| `purchase.create` | ✅ | ❌ |
| `purchase.receive` | ✅ | ❌ |
| `cash.open` / `cash.close` | ✅ | ✅ |
| `cash.movement` | ✅ | ✅ |
| `settings.edit` | ✅ | ❌ |
| `reports.view` | ✅ | ❌ |
| `logs.view` | ✅ | ❌ |

---

## 10. Historial de Cambios — Versión 2.0

| Fecha | Cambio | Módulo |
|---|---|---|
| Jul 2026 | Campos numéricos sin spin buttons (CSS global) | Global |
| Jul 2026 | `CurrencyInput`: miles, 2 decimales, borrado de 0 | `Input.tsx` |
| Jul 2026 | `NumberInput`: enteros sin spin buttons | `Input.tsx` |
| Jul 2026 | Monto inicial en caja adaptado a `CurrencyInput` | `POSPage.tsx` |
| Jul 2026 | Campo Efectivo recibido adaptado a `CurrencyInput` | `POSPage.tsx` |
| Jul 2026 | Escáner con vista previa del producto detectado | `POSPage.tsx` |
| Jul 2026 | Compras: búsqueda por nombre, SKU y código de barras | `PurchasesPage.tsx` |
| Jul 2026 | Compras: costo unitario con `CurrencyInput` | `PurchasesPage.tsx` |
| Jul 2026 | Compras: "no encontrado" + botón registrar nuevo | `PurchasesPage.tsx` |
| Jul 2026 | Compras: creación rápida de proveedor en la compra | `PurchasesPage.tsx` |
| Jul 2026 | Compras: creación rápida de producto en la compra | `PurchasesPage.tsx` |
| Jul 2026 | Compras: creación rápida de marca en el producto | `PurchasesPage.tsx` |
| Jul 2026 | Gestión y edición de marcas desde catálogo | `ProductsPage.tsx` |
| Jul 2026 | Limpieza de datos de prueba (BD y semilla) | `seed.ts` + Supabase |

---

*StoreFlow v2.0 — Documento Técnico. Todos los derechos reservados.*
