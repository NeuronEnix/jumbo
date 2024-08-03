import express from 'express';

import userRouter from './user/index.mjs';

const router = express.Router();

router.use('/user', userRouter);

export default router;
