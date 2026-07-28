# 🛒 StoreFlow - Sistema de Punto de Venta (POS), Inventarios & Auditoría en Tiempo Real

**StoreFlow** es una plataforma web moderna, modular y de alto rendimiento de Punto de Venta (POS), control de inventarios, gestión de caja y auditoría en tiempo real diseñada para comercios minoristas y de consumo masivo (minimarkets, tiendas de abarrotes, boutiques, ferreterías).

Ofrece una **arquitectura desacoplada en 4 capas (MVC + Service Layer)** respaldada por un **Servidor Backend Node.js con Express.js** y un **Motor de Sincronización Resiliente Offline-First con Health Check**, garantizando que el negocio siga vendiendo sin interrupción aunque se corte el internet o falle el servidor en la nube.

---

## 📄 Documentación Técnica y Ejecutiva
Para una revisión completa de la arquitectura, esquemas de base de datos PostgreSQL, planteamiento del problema y hoja de ruta de escalabilidad:
- 📘 **Documentación de Arquitectura MVC + Service Layer**: [`ARCHITECTURE.md`](ARCHITECTURE.md)
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

* **Backend Node.js Server**: [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/) (`src/server/`)
* **Core Frontend**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (`src/`)
* **Compilador & Bundler**: [Vite](https://vitejs.dev/) + [tsx](https://github.com/privatenumber/tsx)
* **Base de Datos & Backend**: [Supabase](https://supabase.com/) (PostgreSQL)
* **Resiliencia & Sync Engine**: LocalStorage Pending Queue + Health Check Heartbeat
* **Estilos & UI**: Vanilla CSS + [Tailwind CSS](https://tailwindcss.com/)
* **Animaciones**: [Framer Motion](https://www.framer.com/motion/)
* **Iconografía**: [Lucide React](https://lucide.dev/)

---

## 📂 Arquitectura del Código Fuente (MVC + Service Layer)

```text
StoreFlow/
├── src/
│   ├── server/                  # BACKEND NODE.JS (Express Server)
│   │   ├── routes/              # 1. Routes (Express HTTP Routers)
│   │   ├── controllers/         # 2. Controllers (req: Request, res: Response) => res.json()
│   │   ├── services/            # 3. Services (Lógica de Negocio y Reglas del Dominio)
│   │   ├── models/              # 4. Models (Acceso exclusivo a Base de Datos / Supabase SQL)
│   │   ├── app.ts               # Instancia Express con CORS y JSON
│   │   └── index.ts             # Punto de entrada servidor Node.js (Puerto 3001)
│   ├── routes/                  # CLIENTE REACT — Definición de Rutas UI (AppRoutes)
│   ├── controllers/             # CLIENTE REACT — Estado de presentación UI
│   ├── services/                # CLIENTE REACT — Adaptadores API REST
│   ├── models/                  # CLIENTE REACT — Interfaces y Cliente Supabase
│   └── views/                   # CLIENTE REACT — Componentes y Páginas (POSPage, CashPage...)
├── ARCHITECTURE.md              # Documentación técnica detallada de la arquitectura por capas
├── Documento_Tecnico_StoreFlow.pdf
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

4. **Ejecutar Backend Node.js y Frontend React al mismo tiempo (1 Solo Comando)**:
   ```bash
   npm run dev
   ```
   Este comando arrancará en paralelo:
   - 🚀 **Backend Node.js Express**: `http://localhost:3001`
   - 💻 **Frontend React (Vite)**: `http://localhost:5173`

---

## 🔑 Credenciales de Prueba (Demo)

| Rol | Email | Contraseña |
| :--- | :--- | :--- |
| **Supervisor** | `supervisor@storeflow.com` | `super123` |
| **Cajero** | `cajero@storeflow.com` | `cajero123` |

---

## 📜 Licencia

Desarrollado para la gestión eficiente, ágil y resiliente de comercios minoristas.
