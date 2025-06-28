import express from 'express';
import {
    getAllBuildsInSession,
    getBuildById,
    createOrUpdateBuild,
    deleteBuildById,
    validateSessionBuild,
    validateComponentStepByStep,
    replaceComponentInBuild,
} from '../controllers/sessionBuildsController';

const router = express.Router();

router.get('/:sessionId/builds', getAllBuildsInSession);
router.get('/:sessionId/builds/:buildId', getBuildById);
router.post('/:sessionId/builds', createOrUpdateBuild);
router.delete('/:sessionId/builds/:buildId', deleteBuildById);


router.post('/:sessionId/builds/validate', validateSessionBuild); // Full build validation
router.post('/:sessionId/builds/step/validate', validateComponentStepByStep); // Step-by-step validation
router.post("/replace-component", replaceComponentInBuild); // Replace a component in a build

export default router;
