import express from 'express';
import { authenticateHost } from '../middleware/auth.js';
import * as sesCon from '../controllers/session.Controller.js';


const router = express.Router();


router.post('/', authenticateHost, sesCon.createSession);
router.get('/', authenticateHost, sesCon.getSession );
router.get('/:sessionId', authenticateHost, sesCon.sessionDetails );
router.post('/:code/join',  sesCon.sessionParticipant);
router.get('/:sessionId/published-polls', sesCon.published_polls )

export default router;