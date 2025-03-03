import { Request, Response } from 'express';
import Component from '../models/component';
import SessionBuild from '../models/sessionBuild';
import { AICompatibilityChecker } from '../utils/AICompatibilityChecker'; // NEW FILE
import { getRecommendedParts, getComponentDetails, getReplacementComponent } from '../services/chatgptService';
import { IComponent } from '../models/component';

const MAX_RETRIES = 3;

export const generateAutomaticBuild = async (req: Request, res: Response): Promise<void> => {
    const { budget, preferences, sessionId } = req.body;

    try {
        const recommendedParts = await getRecommendedParts(budget, preferences);

        let components: IComponent[] = [];

        for (const [type, modelName] of Object.entries(recommendedParts) as [string, string][]) {
            const normalizedModelName = modelName.trim();

            let component = await Component.findOne({ modelName: normalizedModelName }).lean() as IComponent | null;

            if (!component) {
                console.log(`Component ${normalizedModelName} not found in database. Fetching details from ChatGPT...`);

                const newComponentDetails = await getComponentDetails(type, normalizedModelName);

                if (newComponentDetails && newComponentDetails.modelName) {
                    newComponentDetails.modelName = newComponentDetails.modelName.trim();

                    const newComponent = new Component(newComponentDetails);
                    await newComponent.save();

                    component = newComponentDetails;

                    console.log(`✅ Saved new component from GPT: ${newComponentDetails.modelName}`);
                } else {
                    throw new Error(`Failed to retrieve details for ${normalizedModelName}`);
                }
            }

            if (component) {
                components.push(component);
            } else {
                throw new Error(`Component ${normalizedModelName} could not be found or created.`);
            }
        }

        // 🔄 Use AI-Specific Compatibility Checker
        const checker = new AICompatibilityChecker(components);
        const compatibilityIssues = checker.validate();

        if (compatibilityIssues.length > 0) {
            res.status(400).json({
                message: "Compatibility issues found in AI build",
                issues: compatibilityIssues
            });
            return;
        }

        const totalPrice = components.reduce((sum, comp) => sum + (comp.price || 0), 0);

        const newBuild = {
            buildId: `build_${Date.now()}`,
            components: components.map(comp => ({
                type: comp.type,
                modelName: comp.modelName,
                price: comp.price
            })),
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

        res.status(200).json({ message: "Automatic build created and saved", build: newBuild });

    } catch (error) {
        console.error("❌ Error generating automatic build:", error);
        res.status(500).json({ message: "Failed to generate automatic build", error });
    }
};
