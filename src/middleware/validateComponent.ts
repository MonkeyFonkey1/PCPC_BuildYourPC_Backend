import { Request, Response, NextFunction } from 'express';
import { componentSchema, componentCreationSchema } from '../schemas/componentSchema';

// Middleware for validating component updates (PUT)
export const validateComponent = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = componentSchema.validate(req.body, { abortEarly: false }); 
    if (error) {
        res.status(400).json({ message: 'Validation error', details: error.details });
        return;
    }
    next();
};

// Middleware for validating component creation (POST)
export const validateComponentForCreation = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = componentCreationSchema.validate(req.body, { abortEarly: false }); 
    if (error) {
        res.status(400).json({ message: 'Validation error', details: error.details });
        return;
    }
    next();
};
