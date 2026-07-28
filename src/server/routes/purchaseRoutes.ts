/**
 * @file purchaseRoutes.ts (Server Backend Express Router)
 * @description Mapeo de rutas HTTP para proveedores y compras.
 */

import { Router } from 'express';
import { purchaseController } from '../controllers/purchaseController';

const router = Router();

router.get('/', purchaseController.getPurchasesData);
router.post('/supplier', purchaseController.upsertSupplier);
router.delete('/supplier/:id', purchaseController.deleteSupplier);
router.post('/', purchaseController.insertPurchase);
router.patch('/:id/receive', purchaseController.receivePurchase);

export default router;
