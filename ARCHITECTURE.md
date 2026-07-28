# Documentación Arquitectónica: Servidor Backend Node.js Express + Cliente React (MVC + Service Layer)

Este documento describe la arquitectura completa de **StoreFlow**, que implementa un **Servidor Backend Node.js con Express.js** en `src/server/` y una aplicación **Frontend en React** en `src/`, cumpliendo **al 100% las 4 reglas arquitectónicas estrictas**.

---

## 1. 🎯 Confirmación de Cumplimiento de las 4 Reglas Estrictas

```
Client (React SPA) ──HTTP REST──► Routes (src/server/routes/) ──► Controllers (src/server/controllers/) ──► Services (src/server/services/) ──► Models (src/server/models/) ──► Database
```

| Capa | Regla Estricta | Implementación en `src/server/` |
| :--- | :--- | :--- |
| **Routes** | Solo definen las rutas de los endpoints y mapean hacia los métodos del controlador Express. | `src/server/routes/` (`authRoutes.ts`, `productRoutes.ts`, `salesRoutes.ts`, `cashRoutes.ts`, `customerRoutes.ts`, `purchaseRoutes.ts`, `settingsRoutes.ts`) utilizan exclusivamente `router.get`, `router.post`, `router.patch`, `router.delete` para enlazar endpoints HTTP con los controladores de Express. |
| **Controllers** | Solo leen `req`, extraen parámetros/body, llaman a la capa de servicios y responden con `res`. Cero lógica de negocio y cero consultas a BD. | `src/server/controllers/` (`authController.ts`, `productController.ts`, `salesController.ts`, `cashController.ts`, `customerController.ts`, `purchaseController.ts`, `settingsController.ts`) reciben firmas estrictas `(req: Request, res: Response)`, extraen `req.body` y `req.params`, llaman a la capa de servicios y responden con `res.status(...).json(...)`. **Cero lógica de negocio y cero consultas a la BD**. |
| **Services** | Contienen toda la lógica de negocio, validaciones del dominio y orquestación. Llaman a los modelos. | `src/server/services/` (`authService.ts`, `productService.ts`, `salesService.ts`, `cashService.ts`, `customerService.ts`, `purchaseService.ts`, `settingsService.ts`) procesan cálculos, validaciones, reglas de inventario, saldos de cartera y transformaciones. Consumen **exclusivamente a los modelos**. |
| **Models** | Única capa responsable del acceso a datos / base de datos. | `src/server/models/` (`authModel.ts`, `productModel.ts`, `salesModel.ts`, `cashModel.ts`, `customerModel.ts`, `purchaseModel.ts`, `settingsModel.ts`) encapsulan las consultas a la base de datos (Supabase / SQL). Son los **únicos** archivos autorizados para consultar o mutar datos en la BD. |

---

## 2. 🏛️ Estructura Completa del Proyecto

```
src/
├── server/                         # Servidor Backend Node.js + Express
│   ├── routes/                     # Enrutadores HTTP Express (/api/auth, /api/products, /api/sales, etc.)
│   ├── controllers/                # Controladores Express (req, res) => res.json()
│   ├── services/                   # Lógica de negocio pura y reglas de dominio
│   ├── models/                     # Único acceso a la base de datos (Supabase/SQL)
│   ├── app.ts                      # Instancia de aplicación Express (Middlewares CORS, JSON)
│   └── index.ts                    # Punto de inicio del servidor Node.js en puerto 3001
├── routes/                         # Cliente React: Definición de rutas UI (AppRoutes)
├── controllers/                    # Cliente React: Estado de presentación UI
├── services/                       # Cliente React: Adaptadores API REST
├── models/                         # Cliente React: Definición de interfaces TypeScript y cliente Supabase
└── views/                          # Cliente React: Páginas y componentes de interfaz gráfica
```

---

## 3. 🚀 Ejecución del Servidor Backend Node.js

Para arrancar el servidor backend Node.js:
```bash
npm run server
```
El servidor backend se iniciará en `http://localhost:3001` ofreciendo el enrutador REST completo en `/api/*`.
