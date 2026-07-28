/**
 * @file index.ts (src/server/routes)
 * @description Enrutador Principal de Express que agrupa todos los sub-routers de la API REST.
 * 
 * REGLA ESTRICTA DE ARQUITECTURA:
 * - Solo define los prefijos de las rutas (`/api/auth`, `/api/products`, `/api/sales`, etc.)
 *   y las mapea a sus routers correspondientes.
 */

import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import salesRoutes from './salesRoutes';
import cashRoutes from './cashRoutes';
import customerRoutes from './customerRoutes';
import purchaseRoutes from './purchaseRoutes';
import settingsRoutes from './settingsRoutes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/sales', salesRoutes);
apiRouter.use('/cash', cashRoutes);
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/purchases', purchaseRoutes);
apiRouter.use('/settings', settingsRoutes);

export default apiRouter;
