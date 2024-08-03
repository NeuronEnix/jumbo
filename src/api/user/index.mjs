import express from 'express';
import cookieParser from 'cookie-parser';

import register from './controller/register.mjs';

const router = express.Router();

router.post('/register', register.validate, register.execute);

export default router
