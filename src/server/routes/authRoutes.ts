/**
 * @file authRoutes.ts (Server Backend Express Router)
 * @description Mapeo de rutas HTTP para usuarios y autenticación.
 * 
 * REGLA ESTRICTA DE ARQUITECTURA:
 * - Solo define las rutas de los endpoints y las mapea hacia los métodos de `authController`.
 */

import { Router } from 'express';
import { authController } from '../controllers/authController';

const router = Router();

router.get('/', authController.getUsers);
router.post('/upsert', authController.upsertUser);
router.delete('/:id', authController.deleteUser);

export default router;
