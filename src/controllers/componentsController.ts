import { Request, Response } from 'express';
import Component from '../models/component';
import mongoose from 'mongoose';
import CachedQuery from '../models/cachedQuery';


const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour


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

export const searchComponents = async (req: Request, res: Response) => {
    const { type, socket, memoryType, wattage, brand, minPrice, maxPrice } = req.query;

    // Build the search query object
    const query: any = {};
    if (type) query.type = type;
    if (socket) query['specs.socket'] = socket;
    if (memoryType) query['specs.memoryType'] = memoryType;
    if (wattage) query['specs.wattage'] = { $gte: Number(wattage) };
    if (brand) query.brand = brand;
    if (minPrice && maxPrice) query.price = { $gte: Number(minPrice), $lte: Number(maxPrice) };

    try {
        // 1️⃣ Check Cache First
        const cachedQuery = await CachedQuery.findOne({
            query_type: 'component_search',
            query_params: query,
            timestamp: { $gte: new Date(Date.now() - CACHE_EXPIRY_MS) },
        }).lean();

        if (cachedQuery) {
            console.log('✅ Cache hit: Returning cached results.');
            return res.json(cachedQuery.results);
        }

        // 2️⃣ No Cache — Perform Real Query
        const components = await Component.find(query).lean();

        // 3️⃣ Save Results to Cache
        await CachedQuery.create({
            query_type: 'component_search',
            query_params: query,
            results: components,
        });

        console.log('✅ Cache miss: Fetched fresh data and saved to cache.');
        res.json(components);

    } catch (error) {
        console.error('❌ Error in searchComponents:', error);
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
