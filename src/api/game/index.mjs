import express from 'express';

import start from './controller/start.mjs';
import getSession from './controller/getSession.mjs';
import { verifyAccessTokenExpress } from '../../lib/auth.mjs';
const router = express.Router();

router.post('/start', verifyAccessTokenExpress, start.validate, start.execute);
router.get('/get-session', verifyAccessTokenExpress, getSession.validate, getSession.execute);

export default router
