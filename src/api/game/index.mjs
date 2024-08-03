import express from 'express';

import start from './controller/start.mjs';
import { verifyAccessTokenExpress } from '../../lib/auth.mjs';
const router = express.Router();

router.post('/start', verifyAccessTokenExpress, start.validate, start.execute);

export default router
