import { Request, Response } from 'express';
import SessionBuild from '../models/sessionBuild';
import { sessionBuildSchema } from '../schemas/sesionBuildSchema';
import { v4 as uuidv4 } from 'uuid';
import Component, { IComponent } from '../models/component';
import { CompatibilityChecker } from '../utils/CompatibiltyChecker';

export const getAllBuildsInSession = async (req: Request, res: Response): Promise<void> => {
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

export const getBuildById = async (req: Request, res: Response): Promise<void> => {
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

export const createOrUpdateBuild = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sessionId } = req.params;
        const { buildId, components, totalPrice, aiGenerated } = req.body;

        const createdAt = req.body.createdAt || new Date();
        const expiresAt = req.body.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000);  // 24 hours from now 

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

        const sessionBuild = await SessionBuild.findOneAndUpdate(
            { sessionId },
            { $setOnInsert: { sessionId, builds: [] } },
            { new: true, upsert: true }
        );

        const existingBuildIndex = sessionBuild.builds.findIndex((b) => b.buildId === buildId);

        if (existingBuildIndex !== -1) {
            sessionBuild.builds[existingBuildIndex] = {
                buildId,
                components,
                totalPrice,
                createdAt,
                expiresAt,
                aiGenerated,
            };
        } else {
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

export const deleteBuildById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sessionId, buildId } = req.params;
        const sessionBuild = await SessionBuild.findOne({ sessionId });

        if (!sessionBuild) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }

        sessionBuild.builds = sessionBuild.builds.filter((b) => b.buildId !== buildId);
        await sessionBuild.save();

        res.json({ message: 'Build deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting build', error });
    }
};

export const validateSessionBuild = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sessionId } = req.body;

        const sessionBuild = await SessionBuild.findOne({ sessionId });
        if (!sessionBuild) {
            res.status(404).json({ message: "Session build not found" });
            return;
        }

        const components = sessionBuild.builds.flatMap((b) => b.components);
        const uniqueComponents = components.filter((component, index, self) => {
            if (!component || Object.keys(component).length === 0) return false;
            return (
                self.findIndex(
                    (c) => c?.type === component?.type && c?.modelName === component?.modelName
                ) === index
            );
        });

        
        const normalizedModelNames = uniqueComponents.map((c) =>
            c.modelName.trim().toLowerCase()
        );
        

        const fetchedComponents = await Component.find({
            modelName: { $in: normalizedModelNames.map(name => new RegExp(`^${name}$`, 'i')) },
        }).lean();


        //Compare fetched components with required components
        const missingComponents = normalizedModelNames.filter(
            (name) =>
                !fetchedComponents.some((c) => c.modelName.trim().toLowerCase() === name)
        );

        if (missingComponents.length > 0) {
            console.log("Missing Components Debugging:", missingComponents);
            res.status(404).json({
                message: "Some components are missing from the database.",
                missingComponents,
            });
            return;
        }

        //Compatibility check
        const checker = new CompatibilityChecker(fetchedComponents as IComponent[]);
        const compatibilityIssues = checker.validate();

        if (compatibilityIssues.length > 0) {
            res.status(400).json({
                message: "Compatibility issues found",
                issues: compatibilityIssues,
            });
        } else {
            res.status(200).json({ message: "Build is fully compatible!" });
        }
    } catch (error) {
        console.error("Error in validateSessionBuild:", error);
        res.status(500).json({
            message: "Error validating compatibility",
            error,
        });
    }
};

export const validateComponentStepByStep = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sessionId } = req.params;
        const { type, modelName } = req.body;

        const sessionBuild = await SessionBuild.findOne({ sessionId });
        if (!sessionBuild) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }

        const newComponent = await Component.findOne({ modelName }).lean();
        if (!newComponent) {
            res.status(404).json({ message: `Component ${modelName} not found` });
            return;
        }

        const currentComponents = sessionBuild.builds[0]?.components || [];
        const existingComponents = await Component.find({
            modelName: { $in: currentComponents.map((c) => c.modelName) },
        }).lean();

        const checker = new CompatibilityChecker([...existingComponents, newComponent] as IComponent[]);
        const compatibilityIssues = checker.validate();

        if (compatibilityIssues.length > 0) {
            res.status(400).json({
                message: 'Compatibility issues found',
                issues: compatibilityIssues,
            });
        } else {
            res.status(200).json({
                message: `Component ${type} (${modelName}) is compatible.`,
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error validating component', error });
    }
};
