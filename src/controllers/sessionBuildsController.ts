import { Request, Response } from 'express';
import SessionBuild from '../models/sessionBuild';
import { sessionBuildSchema } from '../schemas/sesionBuildSchema';
import { v4 as uuidv4 } from 'uuid';
import Component from '../models/component';
import { CompatibilityChecker } from '../utils/CompatibiltyChecker';

// Retrieve all builds in a session
export const getAllBuildsInSession = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { sessionId } = req.params;
        const sessionBuild = await SessionBuild.findOne({ sessionId });

        if (!sessionBuild) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }

        res.json(sessionBuild.builds);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching builds', error });
    }
};

// Retrieve a specific build
export const getBuildById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { sessionId, buildId } = req.params;
        const sessionBuild = await SessionBuild.findOne({ sessionId });

        if (!sessionBuild) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }

        const build = sessionBuild.builds.find((b) => b.buildId === buildId);

        if (!build) {
            res.status(404).json({ message: 'Build not found' });
            return;
        }

        res.json(build);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching build', error });
    }
};

// Create or update a specific build
export const createOrUpdateBuild = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { sessionId } = req.params;
        const { buildId, components, totalPrice, aiGenerated } = req.body;

        // Generate createdAt and expiresAt if not provided
        const createdAt = req.body.createdAt || new Date();
        const expiresAt =
            req.body.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // One week from now

        // Validate the input using Joi
        const { error } = sessionBuildSchema.validate(
            { buildId, components, totalPrice, aiGenerated, createdAt, expiresAt },
            { abortEarly: false }
        );
        if (error) {
            res.status(400).json({
                message: 'Validation error',
                details: error.details,
            });
            return;
        }

        // Fetch or create the session build
        const sessionBuild = await SessionBuild.findOneAndUpdate(
            { sessionId },
            { $setOnInsert: { sessionId, builds: [] } }, // Create session if not exists
            { new: true, upsert: true }
        );

        const existingBuildIndex = sessionBuild.builds.findIndex(
            (b) => b.buildId === buildId
        );

        if (existingBuildIndex !== -1) {
            // Update existing build
            sessionBuild.builds[existingBuildIndex] = {
                buildId,
                components,
                totalPrice,
                createdAt,
                expiresAt,
                aiGenerated,
            };
        } else {
            // Add new build
            sessionBuild.builds.push({
                buildId: buildId || uuidv4(),
                components,
                totalPrice,
                createdAt,
                expiresAt,
                aiGenerated,
            });
        }

        await sessionBuild.save();
        res.status(200).json(sessionBuild);
    } catch (error) {
        res.status(500).json({
            message: 'Error creating or updating build',
            error,
        });
    }
};

// Delete a specific build
export const deleteBuildById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { sessionId, buildId } = req.params;
        const sessionBuild = await SessionBuild.findOne({ sessionId });

        if (!sessionBuild) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }

        sessionBuild.builds = sessionBuild.builds.filter(
            (b) => b.buildId !== buildId
        );
        await sessionBuild.save();

        res.json({ message: 'Build deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting build', error });
    }
};

// Validate compatibility of session build components
export const validateSessionBuild = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { sessionId } = req.body;

        const sessionBuild = await SessionBuild.findOne({ sessionId: sessionId.trim() });
        if (!sessionBuild) {
            res.status(404).json({ message: 'Session build not found' });
            return;
        }

        const components = sessionBuild.builds.flatMap((b) => b.components);

        const componentDetails = await Component.find({
            modelName: { $in: components.map((c) => c.modelName) },
        });

        const checker = new CompatibilityChecker(componentDetails);
        const compatibilityIssues = checker.validate();

        if (compatibilityIssues.length > 0) {
            res.status(400).json({
                message: 'Compatibility issues found',
                issues: compatibilityIssues,
            });
        } else {
            res.status(200).json({ message: 'Build is fully compatible!' });
        }
    } catch (error) {
        res.status(500).json({
            message: 'Error validating compatibility',
            error,
        });
    }
};
