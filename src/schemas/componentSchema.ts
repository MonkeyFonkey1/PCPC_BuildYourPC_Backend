import Joi from 'joi';

export const componentSchema = Joi.object({
    type: Joi.string().optional(),
    brand: Joi.string().optional(),
    modelName: Joi.string().optional(),
    price: Joi.number().positive().optional(),
    specs: Joi.object().optional(),
});

export const componentCreationSchema = componentSchema.fork(
    ['type', 'brand', 'modelName', 'price', 'specs'],
    (field) => field.required()
);
