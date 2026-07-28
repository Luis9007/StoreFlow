# 🛒 StoreFlow - Sistema de Punto de Venta & Gestión de Inventarios (POS)

**StoreFlow** es una plataforma moderna, intuitiva y completa de Punto de Venta (POS) y gestión comercial diseñada para pequeños y medianos comercios (abarrotes, minisuper, tiendas minoristas). Ofrece control total de inventarios, gestión de caja, ventas en tiempo real y reportes analíticos avanzados.

---

## 🚀 Características Principales

### 📦 1. Punto de Venta (POS)
* **Interfaz de Cobro Rápida**: Búsqueda instantánea de productos por nombre, código de barras o SKU.
* **Sección de Favoritos**: Accesos directos personalizables a los productos de mayor rotación.
* **Múltiples Métodos de Pago**: Pago en efectivo con calculadora automática de cambio, tarjeta de débito/crédito, transferencia bancaria y crédito a clientes.
* **Gestión de Ticket e Impuestos**: Desglose automático de subtotal, IVA y descuentos.

### 📊 2. Inventario y Productos
* **Catálogo Completo**: Organización por categorías y marcas.
* **Alertas de Stock Mínimo**: Notificaciones visuales para productos próximos a agotarse.
* **Ajustes de Inventario**: Registro detallado de entradas, salidas y correcciones manuales de stock con justificación.

### 💰 3. Control de Caja y Turnos
* **Aperturas y Cierres de Caja**: Arqueo de efectivo al inicio y final del turno.
* **Movimientos de Efectivo**: Registro de entradas y egresos adicionales de dinero con conceptos explicativos.

### 👥 4. Clientes y Proveedores
* **Padrón de Clientes**: Registro de datos de contacto, historial de compras y saldos de crédito.
* **Gestión de Proveedores & Compras**: Control de compras a proveedores con actualización automática de stock al recibir la mercancía.

### 📈 5. Reportes & Analíticas
* **Dashboard Interactivo**: Indicadores clave de desempeño (KPIs) como ventas totales, margen de ganancia, tickets promedio y productos estrella.
* **Gráficos Dinámicos**: Visualizaciones de ventas por período y categoría impulsadas por Recharts.

### 🔒 6. Seguridad y Permisos (RBAC)
* **Control de Accesos Basado en Roles**:
  * **Supervisor**: Acceso total a reportes, configuraciones de empresa, gestión de usuarios e inventarios.
  * **Cajero**: Acceso enfocado a la interfaz del POS y operaciones de caja.
* **Auditoría de Actividad**: Log completo de acciones realizadas en el sistema.

---

## 🛠️ Stack Tecnológico

* **Core**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Compilador**: [Vite](https://vitejs.dev/)
* **Base de Datos & Backend**: [Supabase](https://supabase.com/) (PostgreSQL)
* **Estilos & UI**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) (Animaciones)
* **Iconos & Gráficos**: [Lucide React](https://lucide.dev/) + [Recharts](https://recharts.org/)
* **Formularios & Validación**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

---

## ⚙️ Instalación y Configuración Local

### Prerrequisitos
* Node.js v18+ 
* npm v9+

### Pasos de ejecución

1. **Clonar o descargar el proyecto**:
   ```bash
   cd StoreFlow
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno**:
   Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
   Edita `.env` e introduce tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

4. **Inicializar la Base de Datos en Supabase**:
   * En tu panel de Supabase, navega al **SQL Editor**.
   * Copia el contenido del archivo [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo. Esto creará todas las tablas relacionales, índices y datos iniciales de demostración.

5. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   Abre tu navegador en `http://localhost:5173`.

---

## 🔑 Credenciales de Prueba (Demo)

Si estás utilizando la semilla inicial de datos, puedes iniciar sesión con las siguientes cuentas:

| Rol | Email | Contraseña |
| :--- | :--- | :--- |
| **Supervisor** | `supervisor@storeflow.com` | `super123` |
| **Cajero** | `cajero@storeflow.com` | `cajero123` |

---

## 📂 Estructura del Proyecto

```text
StoreFlow/
├── supabase/
│   └── schema.sql              # Script SQL completo de la BD PostgreSQL para Supabase
├── src/
│   ├── models/                 # MODEL — datos, tipos y acceso a datos
│   │   ├── types.ts            # Definición de interfaces TypeScript (entidades)
│   │   ├── seed.ts             # Datos semilla iniciales
│   │   └── supabase.ts         # Cliente oficial de Supabase (fuente de datos remota)
│   ├── controllers/            # CONTROLLER — estado, orquestación y reglas de negocio
│   │   ├── StoreController.tsx # StoreProvider/useStore: mediador entre Model y View
│   │   └── permissions.ts      # Control de acceso / permisos RBAC
│   ├── views/                  # VIEW — presentación (sin lógica de negocio)
│   │   ├── components/         # Componentes reutilizables de UI y Layout
│   │   │   ├── layout/         # Barra lateral, Header, Navegación
│   │   │   └── ui/             # Botones, Modales, Tablas, Toasts
│   │   └── pages/               # Módulos principales (POS, Productos, Caja, Reportes...)
│   ├── lib/                    # Utilidades genéricas y transversales
│   │   └── utils.ts            # Formateo de moneda, fechas e IDs
│   ├── App.tsx                 # Configuración de Rutas y Guards
│   └── main.tsx                # Punto de entrada de la aplicación
├── .env.example                # Plantilla de variables de entorno
└── package.json                # Dependencias y scripts del proyecto
```

**Mapeo de la arquitectura:**
- **Model** (`src/models`): define las entidades del dominio y el acceso a los datos (Supabase, semillas).
- **View** (`src/views`): páginas y componentes puramente de presentación; no contienen reglas de negocio, solo consumen el Controller vía `useStore()`.
- **Controller** (`src/controllers`): `StoreController.tsx` centraliza el estado de la aplicación, la persistencia (localStorage/Supabase) y las operaciones sobre el Model; `permissions.ts` controla qué puede ver/hacer cada rol.

---

## 📜 Licencia

Desarrollado para la gestión eficiente de negocios e inventarios.
