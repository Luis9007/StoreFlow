# Documentación Arquitectónica: Patrón MVC + Service Layer en StoreFlow

Este documento describe de manera exhaustiva la arquitectura de software implementada en **StoreFlow**, detallando la estructura de carpetas, responsabilidades por capa, flujo de datos y confirmación del cumplimiento del patrón **MVC (Model-View-Controller)** con una capa intermedia de servicio (**Service Layer**) sobre el entorno **Node.js**.

---

## 1. 🎯 Confirmación de Patrón y Entorno

- **¿Sigue siendo un patrón MVC + Service Layer?**  
  **Sí, 100% confirmado.** La aplicación implementa rigurosamente el patrón **MVC (Modelo - Vista - Controlador)** potenciado por una **Capa de Servicios (Service Layer)**. Se ha logrado un desacoplamiento completo donde ninguna capa salta responsabilidades ni accede directamente a recursos que no le corresponden.

- **¿Se ejecuta sobre un entorno Node.js?**  
  **Sí, 100% confirmado.** Todo el ecosistema de compilación, empaquetado, herramientas de desarrollo, servidores de desarrollo y cliente API de backend se ejecutan sobre el runtime de **Node.js** (utilizando Node.js v18+, NPM, motor de módulos ECMAScript ESM, TypeScript y herramientas servidor/desarrollo como Vite).

---

## 2. 🏛️ Estructura General de Carpetas (`src/`)

```
src/
├── routes/         # Capa 1: Enrutamiento y Definición de Endpoints
├── controllers/    # Capa 2: Entrada/Salida HTTP, Manejo de Parámetros y Estado
├── services/       # Capa 3: Lógica de Negocio Pura, Transformaciones y Validaciones
├── models/         # Capa 4: Definición de Datos y Acceso Directo a la BD (Supabase/SQL)
└── views/          # Capa 5: Interfaz de Usuario, Páginas y Componentes Visuales
```

---

## 3. 🔍 Explicación Detallada Capa por Capa

### 🛣️ 1. Rutas (`src/routes/`)
* **Propósito**: Es el punto de entrada de cada petición o solicitud de navegación en la aplicación.
* **Responsabilidad**:
  - Escuchar los endpoints/rutas definidas (`/login`, `/app`, `/app/pos`, `/app/inventory`, `/app/customers`, etc.).
  - Aplicar los guardias de acceso global: **Autenticación** (`ProtectedRoute`) y **Permisos de Módulo/Rol** (`ModuleGuard`).
  - Mapear cada ruta con el controlador y vista correspondiente.
* **REGLA CLAVE**: La capa de rutas **solo conoce a las Vistas y Controladores**. No contiene lógica de negocio ni consultas a la base de datos.

### 🎮 2. Controladores (`src/controllers/`)
* **Propósito**: Gestionar la entrada y salida de datos (HTTP/Interacción UI), parámetros y estado de la aplicación.
* **Responsabilidad**:
  - Extraer los datos enviados por la ruta/vista (payloads, formularios, parámetros ID).
  - Validar presencia de sesión y permisos del usuario activo.
  - Invocar los métodos requeridos de la **Capa de Servicios**.
  - Retornar las respuestas organizadas o actualizar el estado de presentación.
* **REGLA CLAVE**: El Controlador **solo conoce a la Capa de Servicios**. **No contiene lógica de negocio compleja ni ejecuta consultas directas a la base de datos**.

### ⚙️ 3. Servicios (`src/services/`)
* **Propósito**: Encapsular la lógica de negocio pura, reglas del dominio y transformaciones de datos.
* **Responsabilidad**:
  - Procesar cálculos de impuestos, descuentos, totales, balances de crédito y ajustes de inventario.
  - Validar reglas complejas de negocio (ej. evitar ventas sin inventario, validar montos de apertura de caja).
  - Administrar la cola de sincronización offline (`syncService`).
  - Transformar los formatos de la base de datos SQL (`snake_case`) a estructuras de objetos de dominio (`camelCase`).
  - Solicitar o persisitir información **únicamente a través de los Modelos**.
* **REGLA CLAVE**: El Servicio **solo conoce a la Capa de Modelos**. No realiza consultas directas a Supabase/BD ni interactúa con la interfaz de usuario.

### 🗄️ 4. Modelos (`src/models/`)
* **Propósito**: Definir la estructura de los datos e interactuar directamente con la base de datos (PostgreSQL / Supabase SDK).
* **Responsabilidad**:
  - Definir las interfaces y tipos TypeScript (`types.ts`).
  - Ejecutar consultas SQL/Supabase nativas (`select`, `insert`, `upsert`, `update`, `delete`) sobre las tablas (`app_users`, `products`, `sales`, `customers`, `cash_sessions`, etc.).
  - Proveer métodos de persistencia atómicos para los servicios.
* **REGLA CLAVE**: El Modelo es el **único componente autorizado para interactuar con la Base de Datos**.

### 🎨 5. Vistas (`src/views/`)
* **Propósito**: Presentar la interfaz gráfica al usuario.
* **Responsabilidad**:
  - Renderizar componentes UI, tablas, gráficos, modales y formularios.
  - Recibir la interacción del usuario (clicks, submits) y delegar la acción al Controlador.

---

## 4. 🔄 Flujo de Datos y Diagrama Arquitectónico

```
Petición / Navegación (routes/) ──► Controlador (controllers/) ──► Servicio de Negocio (services/) ──► Modelo de Datos (models/) ──► Base de Datos (Supabase/SQL)
```

---

## 5. 🛡️ Garantía de Aislamiento y Cumplimiento Estricto

1. **Sin Salto de Capas**: Ningún componente de interfaz (Vista) consulta directamente la base de datos. Ningún Controlador realiza peticiones `supabase.from(...)`. Toda solicitud atraviesa secuencialmente `Routes -> Controller -> Service -> Model -> DB`.
2. **Modularidad y Mantenibilidad**: Si la base de datos cambia (ej. de Supabase a PostgreSQL directo o MongoDB), **solo se modifica la capa `models/`**; la lógica de negocio (`services/`) y los controladores (`controllers/`) permanecen 100% intactos.
3. **Ejecución sobre Node.js**: Todo el empaquetado, dependencias y runtime de servicios operan sobre Node.js utilizando TypeScript estricto.
