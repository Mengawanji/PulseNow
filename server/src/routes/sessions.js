import express from 'express';
import { authenticateHost } from '../middleware/auth.js';
import * as sesCon from '../controllers/session.Controller.js';


const router = express.Router();

// router.use(authenticateHost);

router.post('/', sesCon.createSession);
router.get('/', sesCon.getSession);
router.get('/:sessionId', sesCon.sessionDetails );
router.post('/:code/join', sesCon.sessionParticipant);

export default router;