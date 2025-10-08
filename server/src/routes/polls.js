import express from 'express';
import { authenticateHost } from '../middleware/auth.js';
import * as pollCon from '../controllers/poll.Controller.js';

const router = express.Router();

router.use(authenticateHost);

router.post('/', pollCon.createPoll);
router.get('/session/:sessionId', pollCon.pollSession);
router.patch('/:pollId/status', pollCon.updatePoll);
router.get('/:pollId/results', pollCon.pollResult);

export default router;