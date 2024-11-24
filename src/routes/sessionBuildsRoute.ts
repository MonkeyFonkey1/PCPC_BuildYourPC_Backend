import express from 'express';
import {
    getAllBuildsInSession,
    getBuildById,
    createOrUpdateBuild,
    deleteBuildById,
    validateSessionBuild,
    validateComponentStepByStep,
} from '../controllers/sessionBuildsController';

const router = express.Router();

router.get('/:sessionId/builds', getAllBuildsInSession);
router.get('/:sessionId/builds/:buildId', getBuildById);
router.post('/:sessionId/builds', createOrUpdateBuild);
router.delete('/:sessionId/builds/:buildId', deleteBuildById);

// Validation Routes
router.post('/:sessionId/builds/validate', validateSessionBuild); // Full build validation
router.post('/:sessionId/builds/step/validate', validateComponentStepByStep); // Step-by-step validation

export default router;
