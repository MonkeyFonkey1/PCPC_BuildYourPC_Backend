import { Request, Response } from 'express';
import Component from '../models/component';
import mongoose from 'mongoose';

// Fetch all components
export const getAllComponents = async (req: Request, res: Response) => {
    try {
        const components = await Component.find();
        res.json(components);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching components', error });
    }
};

// Search components to support compatibility filtering, sorting, price range, and type filtering
export const searchComponents = async (req: Request, res: Response) => {
    const { type, socket, memoryType, wattage, priceMin, priceMax, sortBy, selectedMotherboard } = req.query;

    try {
        const query: any = {};

        if (type) query.type = type;
        if (socket) query['specs.socket'] = socket;
        if (memoryType) query['specs.memoryType'] = memoryType;
        if (wattage) query['specs.wattage'] = { $gte: Number(wattage) };

        if (priceMin && priceMax) {
            query.price = { $gte: Number(priceMin), $lte: Number(priceMax) };
        } else if (priceMin) {
            query.price = { $gte: Number(priceMin) };
        } else if (priceMax) {
            query.price = { $lte: Number(priceMax) };
        }

        // Real-time compatibility filtering if motherboard is selected
        if (selectedMotherboard) {
            const motherboard = await Component.findOne({ modelName: selectedMotherboard });

            if (motherboard) {
                if (type === 'CPU') {
                    query['specs.socket'] = motherboard.specs.socket;
                }
                if (type === 'RAM') {
                    query['specs.memoryType'] = motherboard.specs.memoryType;
                }
                if (type === 'Storage') {
                    query['$or'] = [
                        { 'specs.connectionType': 'SATA' },
                        { 'specs.connectionType': 'NVMe' }
                    ];
                }
            }
        }

        let sortQuery = {};
        if (sortBy === 'priceAsc') {
            sortQuery = { price: 1 };
        } else if (sortBy === 'priceDesc') {
            sortQuery = { price: -1 };
        } else if (sortBy === 'brand') {
            sortQuery = { brand: 1 };
        }

        const components = await Component.find(query).sort(sortQuery);
        res.json(components);
    } catch (error) {
        res.status(500).json({ message: 'Error searching components', error });
    }
};

// Add a new component
export const addComponent = async (req: Request, res: Response) => {
    try {
        const newComponent = new Component(req.body);
        const savedComponent = await newComponent.save();
        res.status(201).json(savedComponent);
    } catch (error) {
        res.status(500).json({ message: 'Error adding component', error });
    }
};

// Update component
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

// Delete a component
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
