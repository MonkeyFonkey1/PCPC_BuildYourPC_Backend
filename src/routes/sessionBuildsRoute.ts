import express from 'express';
import {
    getAllBuildsInSession,
    getBuildById,
    createOrUpdateBuild,
    deleteBuildById,
    validateSessionBuild,
} from '../controllers/sessionBuildsController';

const router = express.Router();

router.get('/:sessionId/builds', getAllBuildsInSession); // Get all builds in a session
router.get('/:sessionId/builds/:buildId', getBuildById); // Get a specific build
router.post('/:sessionId/builds', createOrUpdateBuild); // Create or update a build
router.delete('/:sessionId/builds/:buildId', deleteBuildById); // Delete a build
router.post('/:sessionId/builds/validate', validateSessionBuild); // Validate compatibility

export default router;
