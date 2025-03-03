import express from 'express';
import { generateAutomaticBuild } from '../controllers/autoBuildController';

const router = express.Router();

router.post('/automatic-build', generateAutomaticBuild);

export default router;
