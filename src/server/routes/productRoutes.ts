/**
 * @file productRoutes.ts (Server Backend Express Router)
 * @description Mapeo de rutas HTTP para productos, categorías y ajustes.
 */

import { Router } from 'express';
import { productController } from '../controllers/productController';

const router = Router();

router.get('/', productController.getProductsData);
router.post('/category', productController.upsertCategory);
router.post('/', productController.upsertProduct);
router.delete('/:id', productController.deleteProduct);
router.patch('/:productId/stock', productController.updateStock);
router.post('/adjustment', productController.insertAdjustment);

export default router;
