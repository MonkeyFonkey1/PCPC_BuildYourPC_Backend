import { Request, Response } from 'express';
import Component, { IComponent } from '../models/component';
import mongoose from 'mongoose';
import CachedQuery from '../models/cachedQuery';
import { CompatibilityChecker } from "../utils/CompatibiltyChecker";
import SessionBuild from "../models/sessionBuild";


const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

async function getFullComponent(component: IComponent | any): Promise<IComponent | null> {
    if (component?.specs) return component;
    return await Component.findOne({ modelName: component?.modelName }).lean() as IComponent | null;
}


export const getComponentById = async (req: Request, res: Response) => {
    try {
        const component = await Component.findById(req.params.id);
        if (!component) {
            res.status(404).json({ message: 'Component not found' });
            return;
        }
        res.json(component);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching component', error });
    }
};

export const getAllComponents = async (req: Request, res: Response) => {
    try {
        const components = await Component.find();
        res.json(components);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching components', error });
    }
};


export const searchComponents = async (req: Request, res: Response): Promise<void> => {
    const { type, sessionId } = req.query;

    if (!type || !sessionId) {
        res.status(400).json({ message: "Missing required query parameters: type or sessionId" });
        return;
    }

    try {
        const query: any = { type };
        const sessionBuild = await SessionBuild.findOne({ sessionId });

        if (!sessionBuild) {
            res.status(404).json({ message: "Session not found" });
            return;
        }

        const build = sessionBuild.builds.at(-1);
        if (!build) {
             res.status(404).json({ message: "No build found in session" });
        }

        if (!build) {
            res.status(404).json({ message: "No build found in session" });
            return;
        }
        
        const motherboardFromBuild = build.components.find((c: any) => c.type === "Motherboard") as IComponent;
        const motherboard = await getFullComponent(motherboardFromBuild);

        if (!motherboard || !motherboard.specs) {
             res.status(400).json({ message: "No valid motherboard specs found in build" });
             return;
        }


        const cacheKey = {
            type,
            motherboardSocket: motherboard.specs.socket,
            memoryType: motherboard.specs.memoryType,
            sata: motherboard.specs.sataPorts || motherboard.specs.SATAIII,
            nvme: motherboard.specs.nvmeSlots || motherboard.specs["M.2Slots"]
        };

        const cached = await CachedQuery.findOne({
            query_type: "compatibility_search",
            query_params: cacheKey,
            timestamp: { $gte: new Date(Date.now() - CACHE_EXPIRY_MS) }
        }).lean();

        if (cached) {
            console.log("⚡ Cache hit (compatibility search)");
            res.json(cached.results);
            return;
        }

        let compatibleComponents = await Component.find(query).lean() as IComponent[];

        const checker = new CompatibilityChecker([]);

        switch (type) {
            case "RAM":
                compatibleComponents = checker.getCompatibleRAM(motherboard as IComponent, compatibleComponents);
                break;
                // case "Storage":
                //     if (!motherboard) {
                //         res.status(400).json({ message: "Motherboard is null" });
                //         return;
                //     }
                //     console.log("📦 Storage Filtering — Mobo Specs:", motherboard.specs);
                //     compatibleComponents = checker.getCompatibleStorage(motherboard as IComponent, compatibleComponents);
                //     console.log("📦 Compatible Storage Found:", compatibleComponents.length);
                //     break;
            case "CPU":
                compatibleComponents = checker.getCompatibleCPUs(motherboard as IComponent, compatibleComponents);
                break;
            case "Case":
                compatibleComponents = checker.getCompatibleCases(motherboard as IComponent, compatibleComponents);
                break;
            case "PC Case":
                compatibleComponents = checker.getCompatibleCases(motherboard as IComponent, compatibleComponents);
                break;
        }

        await CachedQuery.create({
            query_type: "compatibility_search",
            query_params: cacheKey,
            results: compatibleComponents
        });
        

        res.json(compatibleComponents);
    } catch (error) {
        console.error("❌ Error in searchComponents:", error);
        res.status(500).json({ message: "Error searching components", error });
    }
};

export const getCompatibleMotherboards = async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.query;

    if (!sessionId) {
        res.status(400).json({ message: "Missing sessionId" });
        return;
    }

    try {
        const sessionBuild = await SessionBuild.findOne({ sessionId });

        if (!sessionBuild) {
            res.status(404).json({ message: "Session not found" });
            return;
        }

        const build = sessionBuild.builds.at(-1);
        if (!build) {
            res.status(404).json({ message: "No build found in session" });
            return;
        }

        const cpuComponent = build.components.find(c => c.type === "CPU");
        const ramComponent = build.components.find(c => c.type === "RAM");

        if (!cpuComponent && !ramComponent) {
            res.status(400).json({ message: "No CPU or RAM found in build to determine compatibility" });
            return;
        }

        const fullCPU = cpuComponent ? await Component.findOne({ modelName: cpuComponent.modelName }).lean() : null;
        const fullRAM = ramComponent ? await Component.findOne({ modelName: ramComponent.modelName }).lean() : null;

        let motherboards = await Component.find({ type: "Motherboard" }).lean();

        
        if (fullCPU?.specs?.socket) {
            motherboards = motherboards.filter(mb => mb.specs?.socket === fullCPU.specs.socket);
        }

        
        if (fullRAM?.specs?.memoryType) {
             const ramType = fullRAM.specs.memoryType;
        motherboards = motherboards.filter(mb => {
        const mbMemoryType = mb.specs?.memoryType;
        return mbMemoryType && mbMemoryType.toUpperCase() === ramType.toUpperCase();
    });

        }

        res.status(200).json(motherboards);
    } catch (error) {
        console.error("❌ Error in getCompatibleMotherboards:", error);
        res.status(500).json({ message: "Error fetching compatible motherboards", error });
    }
};



export const searchComponentsWithoutCompatibilty = async (req: Request, res: Response): Promise<void> => {
    const { type, socket, memoryType, wattage, brand, minPrice, maxPrice } = req.query;
    const query: any = {};
    if (type) query.type = type;
    if (socket) query['specs.socket'] = socket;
    if (memoryType) query['specs.memoryType'] = memoryType;
    if (wattage) query['specs.wattage'] = { $gte: Number(wattage) };
    if (brand) query.brand = brand;
    if (minPrice && maxPrice) query.price = { $gte: Number(minPrice), $lte: Number(maxPrice) };

    try {
        const cachedQuery = await CachedQuery.findOne({
            query_type: 'component_search',
            query_params: query,
            timestamp: { $gte: new Date(Date.now() - CACHE_EXPIRY_MS) },
        }).lean();

        if (cachedQuery) {
            res.json(cachedQuery.results);
            return;
        }

        const components = await Component.find(query).lean();
        await CachedQuery.create({ query_type: 'component_search', query_params: query, results: components });

        res.json(components);
    } catch (error) {
        console.error('❌ Error in searchComponentsWithoutCompatibilty:', error);
        res.status(500).json({ message: 'Error searching components', error });
    }
};

export const addComponent = async (req: Request, res: Response) => {
    try {
        const newComponent = new Component(req.body);
        const savedComponent = await newComponent.save();
        res.status(201).json(savedComponent);
    } catch (error) {
        res.status(500).json({ message: 'Error adding component', error });
    }
};

export const updateComponent = async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        if (!mongoose.isValidObjectId(id)) {
            res.status(400).json({ message: 'Invalid ObjectId format' });
            return;
        }

        const updatedComponent = await Component.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedComponent) {
            res.status(404).json({ message: 'Component not found' });
            return;
        }

        res.json(updatedComponent);
    } catch (error) {
        res.status(500).json({ message: 'Error updating component', error });
    }
};

export const deleteComponent = async (req: Request, res: Response) => {
    try {
        const deletedComponent = await Component.findByIdAndDelete(req.params.id);
        if (!deletedComponent) {
            res.status(404).json({ message: 'Component not found' });
            return;
        }
        res.json({ message: 'Component deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting component', error });
    }
};
