import { Request, Response } from 'express';
import Component from '../models/component';
import SessionBuild from '../models/sessionBuild';
import { AICompatibilityChecker } from '../utils/AICompatibilityChecker'; // NEW FILE
import { getRecommendedParts, getComponentDetails, getReplacementComponent } from '../services/chatgptService';
import { IComponent } from '../models/component';
import { v4 as uuidv4 } from 'uuid';

const MAX_RETRIES = 3;

export const generateAutomaticBuild = async (req: Request, res: Response): Promise<void> => {
    let { budget, preferences, sessionId } = req.body;

    try {
        if (!sessionId) {
            sessionId = uuidv4();
        }
        console.log("Session ID used:", sessionId);

        const recommendedParts = await getRecommendedParts(budget, preferences);
        let components: IComponent[] = [];

        for (const [type, modelName] of Object.entries(recommendedParts) as [string, string][]) {
            let component = await Component.findOne({ modelName: modelName.trim() }).lean() as IComponent | null;

            if (!component) {
                console.log(`Fetching details from ChatGPT for ${modelName}...`);
                const newComponentDetails = await getComponentDetails(type, modelName.trim());

                if (newComponentDetails?.modelName) {
                    const newComponent = new Component(newComponentDetails);
                    await newComponent.save();
                    component = newComponentDetails;
                } else {
                    throw new Error(`Failed to retrieve details for ${modelName}`);
                }
            }

            if (component) components.push(component);
        }

        const checker = new AICompatibilityChecker(components);
        const compatibilityIssues = checker.validate();

        if (compatibilityIssues.length > 0) {
            res.status(400).json({ message: "Compatibility issues found", issues: compatibilityIssues });
            return;
        }

        const totalPrice = components.reduce((sum, comp) => sum + (comp.price || 0), 0);

        const newBuild = {
            buildId: `build_${Date.now()}`,
            components: components.map(comp => ({ type: comp.type, modelName: comp.modelName, price: comp.price })),
            totalPrice,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            aiGenerated: true
        };

        const sessionBuild = await SessionBuild.findOneAndUpdate(
            { sessionId },
            { $setOnInsert: { sessionId, builds: [] } },
            { new: true, upsert: true }
        );

        sessionBuild.builds.push(newBuild);
        await sessionBuild.save();

        res.status(200).json({ message: "Automatic build created", build: newBuild, sessionId });

    } catch (error) {
        console.error("❌ Error generating automatic build:", error);
        res.status(500).json({ message: "Failed to generate automatic build", error });
    }
};
