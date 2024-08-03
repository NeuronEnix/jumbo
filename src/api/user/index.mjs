import express from 'express';
import cookieParser from 'cookie-parser';

import register from './controller/register.mjs';
import login from './controller/login.mjs';

const router = express.Router();

router.post('/register', register.validate, register.execute);
router.post('/login', login.validate, login.execute);


export default router
