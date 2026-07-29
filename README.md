# 🛒 StoreFlow v2.0 — Sistema de Punto de Venta, Inventarios & Gestión Empresarial

**StoreFlow** es una plataforma web moderna, modular y de alto rendimiento de Punto de Venta (POS), control de inventarios, gestión de caja y auditoría en tiempo real diseñada para comercios minoristas y de consumo masivo (minimarkets, tiendas de abarrotes, boutiques, ferreterías).

Ofrece una **arquitectura desacoplada en 4 capas (MVC + Service Layer)** respaldada por un **Servidor Backend Node.js con Express.js** y un **Motor de Sincronización Resiliente Offline-First**, garantizando que el negocio siga vendiendo sin interrupción aunque se corte el internet.

---

## 📄 Documentación

| Documento | Descripción |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Arquitectura MVC + Service Layer completa |
| [`DOCUMENTO_TECNICO.md`](DOCUMENTO_TECNICO.md) | Documento técnico detallado v2.0 |

---

## 🚀 Características Principales

### 🛒 1. Punto de Venta (POS) & Resiliencia
- **Cobro Dinámico Rápido**: Búsqueda instantánea de productos por nombre, código de barras o SKU.
- **Escáner de Código de Barras por Cámara**: Detección en tiempo real con vista previa del producto (nombre, precio, stock). Si el código no existe, avisa y permite registrarlo en el momento.
- **Múltiples Métodos de Pago**: Efectivo (con calculadora automática de cambio), Tarjeta, Transferencia bancaria y Crédito a clientes.
- **Campos de Moneda con Formato Inteligente**: Todos los campos numéricos usan puntuación de miles (`.`) y dos cifras decimales (`,00`) con borrado automático del `0` al enfocar. Sin flechas de incremento.
- **Control Estricto de Caja**: Bloqueo automático si la caja está cerrada, con modal de apertura rápida con `CurrencyInput` y accesos a montos predefinidos.
- **Operatividad Ininterrumpida Offline**: Las ventas se encolan en `localStorage` y se sincronizan automáticamente al recuperar conexión.
- **Recibo Térmico**: Desglose de subtotal, IVA, cambio e impresión.

### 📦 2. Inventario & Catálogo Inteligente
- **Auto-Generación de SKU**: Algoritmo que abrevia palabras a 3 letras conservando unidades (ej. `COC-COL-600ML`).
- **Campos `CurrencyInput` y `NumberInput`**: Precio, costo, stock y stock mínimo con formato correcto.
- **Gestión de Marcas Inline**: Crear y editar marcas directamente desde el formulario de producto.
- **Categorías con Color**: Selector de color para categorías.
- **Open Food Facts API**: Al escanear un producto empacado, auto-rellena nombre, categoría y marca desde la API pública.
- **Alertas de Stock Mínimo**: Resaltado visual de productos por debajo del umbral configurado.

### 🚚 3. Compras a Proveedores — Flujo Completo Sin Interrupciones
- **Búsqueda Completa**: Por nombre, SKU y código de barras simultáneamente.
- **No Encontrado → Crear**: Si el código escaneado o el término buscado no existe, el menú muestra el aviso y el botón `+ Registrar como producto nuevo` directamente en el desplegable.
- **Creación Rápida de Proveedor**: `+ Nuevo proveedor` dentro del formulario de compra.
- **Creación Rápida de Producto**: `+ Registrar producto nuevo` sin salir de la compra.
- **Creación Rápida de Marca**: `+ Nueva marca` dentro del formulario de producto nuevo.
- **Costo Unitario con `CurrencyInput`**: Puntuación de miles y 2 decimales.
- **Recepción de Mercancía**: Al marcar "Recibir", el stock y el costo de cada producto se actualizan automáticamente.
- **Estados de Compra**: `pendiente` → `recibida` → `cancelada`.

### 💰 4. Control de Caja y Cartera
- **Apertura con `CurrencyInput`**: Monto base con puntuación de miles y accesos rápidos (`$20.000`, `$50.000`, `$100.000`).
- **Cierre y Arqueo**: Diferencia calculada entre efectivo esperado y real.
- **Movimientos de Efectivo**: Entradas y egresos adicionales con concepto.
- **Cartera de Clientes**: Ventas a crédito, abonos parciales e historial.

### 👥 5. Clientes y Proveedores
- **Padrón de Clientes**: Normalización de Cédula/NIT para prevenir duplicados.
- **Gestión de Proveedores**: Registro completo con NIT, contacto, teléfono, correo y balance.

### 🛡️ 6. Auditoría y Permisos (RBAC)
- **Roles**: Supervisor (acceso total) y Cajero (POS y caja).
- **`canPerformAction(role, action)`**: Función centralizada de control de permisos.
- **Bitácora en Tiempo Real**: Registro de todos los eventos con usuario, acción y timestamp en Supabase.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript |
| Compilador | Vite 5 |
| Backend | Node.js 18 + Express.js |
| Base de datos | Supabase (PostgreSQL + Auth + RLS) |
| Animaciones | Framer Motion |
| Íconos | Lucide React |
| Escaneo | Html5Qrcode |
| Estilos | Vanilla CSS + Tailwind CSS |

---

## 📂 Arquitectura del Código Fuente (MVC + Service Layer)

```text
StoreFlow/
├── src/
│   ├── server/                  # BACKEND NODE.JS (Express Server)
│   │   ├── routes/              # 1. Routes — Solo endpoints HTTP
│   │   ├── controllers/         # 2. Controllers — req/res, sin lógica
│   │   ├── services/            # 3. Services — Lógica de negocio
│   │   ├── models/              # 4. Models — Único acceso a BD
│   │   ├── app.ts               # Express app con CORS + JSON
│   │   └── index.ts             # Entry point puerto 3001
│   │
│   ├── controllers/             # Cliente React — StoreController (Context API)
│   ├── services/                # Cliente React — Adaptadores API REST
│   ├── models/                  # Cliente React — Interfaces TypeScript
│   ├── lib/utils.ts             # formatCurrency, generateSkuFromName, etc.
│   │
│   └── views/
│       ├── components/ui/
│       │   └── Input.tsx        # Input, CurrencyInput, NumberInput, Select
│       └── pages/
│           ├── POSPage.tsx      # Punto de Venta
│           ├── ProductsPage.tsx # Catálogo + Inventario
│           ├── PurchasesPage.tsx# Compras (flujo completo v2.0)
│           ├── CashPage.tsx     # Control de caja
│           ├── SuppliersPage.tsx# Proveedores
│           ├── CustomersPage.tsx# Clientes y cartera
│           ├── ReportsPage.tsx  # Reportes
│           └── DashboardPage.tsx# Panel principal
│
├── ARCHITECTURE.md
├── DOCUMENTO_TECNICO.md         # Documento técnico completo v2.0
├── README.md
└── package.json
```

---

## ⚙️ Instalación y Ejecución Local

### Prerrequisitos
- **Node.js** v18+
- **npm** v9+

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/Luis9007/StoreFlow.git
cd StoreFlow

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales de Supabase:
# VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
# VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui

# 4. Ejecutar (Frontend + Backend simultáneamente)
npm run dev
```

| Servicio | URL |
|---|---|
| Frontend React (Vite) | http://localhost:5173 |
| Backend Node.js (Express) | http://localhost:3001 |

---

## 🔑 Credenciales de Demo

| Rol | Email | Contraseña |
|---|---|---|
| **Supervisor** | `supervisor@storeflow.com` | `super123` |
| **Cajero** | `cajero@storeflow.com` | `cajero123` |

---

## 📋 Historial de Versiones

### v2.0 — Julio 2026
- `CurrencyInput` y `NumberInput` con formato de miles, decimales y borrado de cero
- Escáner POS con vista previa del producto detectado en tiempo real
- Campo Efectivo recibido y Monto inicial de caja con `CurrencyInput`
- Módulo de Compras: búsqueda por nombre/SKU/barcode, aviso "no encontrado", creación rápida de proveedor/producto/marca
- Gestión y edición de marcas desde el catálogo de productos
- Limpieza de datos de prueba conservando categorías y marcas

### v1.0 — Julio 2026
- POS con múltiples métodos de pago
- Inventario con generación de SKU y alertas de stock
- Control de caja con apertura/cierre y arqueo
- Gestión de clientes y cartera de crédito
- RBAC (Supervisor / Cajero)
- Motor Offline-First
- Auditoría y bitácora en tiempo real

---

## 📜 Licencia

Desarrollado para la gestión eficiente, ágil y resiliente de comercios minoristas.
