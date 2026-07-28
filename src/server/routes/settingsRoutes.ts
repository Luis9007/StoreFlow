/**
 * @file settingsRoutes.ts (Server Backend Express Router)
 * @description Mapeo de rutas HTTP para configuración y auditoría.
 */

import { Router } from 'express';
import { settingsController } from '../controllers/settingsController';

const router = Router();

router.get('/', settingsController.getSettingsAndLogs);
router.post('/', settingsController.upsertSettings);
router.patch('/theme', settingsController.updateTheme);
router.post('/log', settingsController.insertLog);

export default router;
