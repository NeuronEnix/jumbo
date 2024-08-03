import express from 'express';

import userRouter from './user/index.mjs';
import gameRouter from './game/index.mjs';

const router = express.Router();

router.use('/user', userRouter);
router.use('/game', gameRouter);

export default router;
