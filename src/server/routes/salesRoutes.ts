/**
 * @file salesRoutes.ts (Server Backend Express Router)
 * @description Mapeo de rutas HTTP para ventas y anulaciones.
 */

import { Router } from 'express';
import { salesController } from '../controllers/salesController';

const router = Router();

router.get('/', salesController.getSales);
router.post('/', salesController.processSale);
router.patch('/:id/void', salesController.voidSale);

export default router;
