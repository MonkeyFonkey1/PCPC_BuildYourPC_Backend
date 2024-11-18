import { Request, Response, NextFunction } from 'express';

export const validateComponent = (req: Request, res: Response, next: NextFunction): void => {
    const { type, brand, model, price, specs } = req.body;

    if (!type || !brand || !model || !price || !specs) {
        return next(new Error('Missing required fields'));
    }

    if (typeof price !== 'number' || price <= 0) {
        return next(new Error('Invalid price value'));
    }

    // If validation passes, continue to the next middleware
    next();
};
