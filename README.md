# 🛒 StoreFlow - Sistema de Punto de Venta (POS), Inventarios & Auditoría en Tiempo Real

**StoreFlow** es una plataforma web moderna, modular y de alto rendimiento de Punto de Venta (POS), control de inventarios, gestión de caja y auditoría en tiempo real diseñada para comercios minoristas y de consumo masivo (minimarkets, tiendas de abarrotes, boutiques, ferreterías).

Ofrece una **arquitectura desacoplada en 3 capas (MVC + Service Layer)** y un **Motor de Sincronización Resiliente Offline-First con Health Check**, garantizando que el negocio siga vendiendo sin interrupción aunque se corte el internet o falle el servidor en la nube.

---

## 📄 Documentación Técnica y Ejecutiva
Para una revisión completa de la arquitectura, esquemas de base de datos PostgreSQL, planteamiento del problema y hoja de ruta de escalabilidad:
- 📘 **Documento Técnico en PDF**: [`Documento_Tecnico_StoreFlow.pdf`](Documento_Tecnico_StoreFlow.pdf)

---

## 🚀 Características Principales

### 🛒 1. Punto de Venta (POS) & Resiliencia
* **Cobro Dinámico Rápido**: Búsqueda instantánea de productos por nombre, código de barras o SKU.
* **Múltiples Métodos de Pago**: Efectivo (con calculadora automática de cambio), Tarjeta de débito/crédito, Transferencia bancaria y Crédito a clientes.
* **Control Estricto de Caja (Opción A)**: Bloqueo automático de cobro si la caja está cerrada, con modal de apertura rápida en 1 solo clic.
* **Operatividad Ininterrumpida Offline**: Si no hay internet o Supabase está en mantenimiento, las ventas se completan localmente y se encolan para su envío automático posterior.
* **Gestión de Ticket e Impuestos**: Desglose de subtotal, IVA, cambio e impresión de recibo térmico.

### 📦 2. Inventario & Catálogo Inteligente
* **Auto-Generación de SKU Cortos**: Algoritmo que abrevia palabras a 3 letras y conserva unidades/cantidades (ej. `COC-COL-600ML`).
* **Unidades de Medida Estándar**: Selector desplegable (`pza`, `kg`, `lt`, `g`, `ml`, `caja`, `bot`, `lata`, `m`, `par`, `doc`).
* **Creación Rápida de Categorías**: Permite añadir y personalizar nuevas categorías con selector de color directamente desde el formulario de productos.
* **Ajustes de Inventario & Alertas**: Historial de entradas/salidas manuales y alertas visuales de stock mínimo.

### 💰 3. Control de Caja y Cartera
* **Aperturas y Cierres de Caja**: Arqueo de efectivo al inicio y final del turno.
* **Movimientos de Efectivo**: Registro de entradas y egresos adicionales de dinero con conceptos explicativos.
* **Abonos a Cartera**: Gestión de cuentas por cobrar y abonos parciales de clientes.

### 👥 4. Clientes y Proveedores
* **Padrón de Clientes**: Registro con normalización de Cédula/NIT para prevenir duplicados.
* **Gestión de Proveedores & Compras**: Control de compras a proveedores e ingreso automático de stock a la bodega al recibir mercancía.

### 🛡️ 5. Auditoría y Permisos (RBAC)
* **Control de Accesos Basado en Roles**:
  * **Supervisor**: Acceso total a reportes, configuraciones de empresa, gestión de usuarios, auditoría e inventarios.
  * **Cajero**: Acceso enfocado a la interfaz del POS y operaciones de caja.
* **Bitácora de Auditoría en Tiempo Real**: Registro automático de eventos en Supabase (`activity_logs`) con pestaña dedicada en Configuración para el Supervisor con filtro de búsqueda por usuario, acción y fecha.

---

## 🛠️ Stack Tecnológico

* **Core Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Compilador & Bundler**: [Vite](https://vitejs.dev/)
* **Base de Datos & Backend**: [Supabase](https://supabase.com/) (PostgreSQL)
* **Resiliencia & Sync Engine**: LocalStorage Pending Queue + Health Check Heartbeat
* **Estilos & UI**: Vanilla CSS + [Tailwind CSS](https://tailwindcss.com/)
* **Animaciones**: [Framer Motion](https://www.framer.com/motion/)
* **Iconografía**: [Lucide React](https://lucide.dev/)

---

## 📂 Arquitectura del Código Fuente (MVC + Service Layer)

```text
StoreFlow/
├── supabase/
│   └── schema.sql               # Script DDL de tablas relacionales PostgreSQL
├── src/
│   ├── models/                  # MODEL — Tipado estricto y cliente Supabase
│   │   ├── types.ts             # Interfaces TypeScript de entidades
│   │   ├── seed.ts              # Semilla de datos de demostración
│   │   └── supabase.ts          # Cliente singleton de Supabase
│   ├── controllers/             # CONTROLLER — Estado y Reglas de Negocio
│   │   ├── AuthController.ts     # Sesiones y permisos RBAC
│   │   ├── CashController.ts     # Turnos y movimientos de caja
│   │   ├── CustomerController.ts # Clientes y cartera a crédito
│   │   ├── ProductController.ts  # Catálogo, categorías y stock
│   │   ├── PurchaseController.ts # Proveedores e ingreso de compras
│   │   ├── SalesController.ts    # Transacciones POS y anulaciones
│   │   ├── SettingsController.ts # Parámetros globales y temas UI
│   │   ├── StoreController.tsx  # Orquestador del StoreProvider y Auto-Sync Heartbeat
│   │   └── permissions.ts       # Matriz de permisos por rol
│   ├── services/                # SERVICE LAYER — Abstracción I/O y Resiliencia
│   │   ├── authService.ts        # I/O usuarios
│   │   ├── cashService.ts        # I/O caja
│   │   ├── customerService.ts    # I/O clientes
│   │   ├── productService.ts    # I/O productos y stock
│   │   ├── purchaseService.ts    # I/O compras
│   │   ├── salesService.ts       # I/O ventas
│   │   ├── settingsService.ts    # I/O configuraciones y logs
│   │   └── syncService.ts        # Motor de cola offline y Health Check
│   ├── views/                   # VIEW — Presentación pura (UI/UX)
│   │   ├── pages/               # POSPage, CashPage, ProductsPage, SettingsPage...
│   │   └── components/          # AppLayout, Topbar, Sidebar, UI Primitives
│   └── lib/
│       └── utils.ts             # Generador de SKU, IDs secuenciales, formateadores
├── Documento_Tecnico_StoreFlow.pdf # Documento técnico completo en PDF
├── package.json
└── vite.config.ts
```

---

## ⚙️ Instalación y Ejecución Local

### Prerrequisitos
* **Node.js**: v18+
* **npm**: v9+

### Pasos de Ejecución

1. **Clonar o navegar al proyecto**:
   ```bash
   cd StoreFlow
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno (Opcional si usas Supabase)**:
   Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
   Configura las credenciales de Supabase en `.env`:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

4. **Inicializar la Base de Datos en Supabase (Opcional)**:
   * En tu panel de Supabase, entra al **SQL Editor**.
   * Copia el contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo.

5. **Iniciar Servidor de Desarrollo**:
   ```bash
   npm run dev
   ```
   Abre en tu navegador `http://localhost:5173`.

---

## 🔑 Credenciales de Prueba (Demo)

| Rol | Email | Contraseña |
| :--- | :--- | :--- |
| **Supervisor** | `supervisor@storeflow.com` | `super123` |
| **Cajero** | `cajero@storeflow.com` | `cajero123` |

---

## 📜 Licencia

Desarrollado para la gestión eficiente, ágil y resiliente de comercios minoristas.
