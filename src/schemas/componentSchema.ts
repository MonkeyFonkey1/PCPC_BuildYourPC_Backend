import Joi from 'joi';

// Joi schema for validating component data
export const componentSchema = Joi.object({
    type: Joi.string().optional(), 
    brand: Joi.string().optional(),
    modelName: Joi.string().optional(),
    price: Joi.number().positive().optional(),
    specs: Joi.object().optional(),
});

export const componentCreationSchema = componentSchema.fork(
    ['type', 'brand', 'modelName', 'price', 'specs'], 
    (field) => field.required() // Make these fields required
);
