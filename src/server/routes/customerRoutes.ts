/**
 * @file customerRoutes.ts (Server Backend Express Router)
 * @description Mapeo de rutas HTTP para clientes y saldos.
 */

import { Router } from 'express';
import { customerController } from '../controllers/customerController';

const router = Router();

router.get('/', customerController.getCustomers);
router.post('/', customerController.upsertCustomer);
router.delete('/:id', customerController.deleteCustomer);
router.patch('/:id/balance', customerController.updateBalance);

export default router;
