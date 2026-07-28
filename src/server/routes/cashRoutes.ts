/**
 * @file cashRoutes.ts (Server Backend Express Router)
 * @description Mapeo de rutas HTTP para turnos y movimientos de caja.
 */

import { Router } from 'express';
import { cashController } from '../controllers/cashController';

const router = Router();

router.get('/', cashController.getCashData);
router.post('/session', cashController.openSession);
router.patch('/session/:sessionId/close', cashController.closeSession);
router.post('/movement', cashController.insertMovement);

export default router;
