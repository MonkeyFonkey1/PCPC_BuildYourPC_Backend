import Joi from 'joi';

export const sessionBuildSchema = Joi.object({
    buildId: Joi.string().required(),
    components: Joi.array()
        .items(
            Joi.object({
                type: Joi.string().required(),
                modelName: Joi.string().required(),
                price: Joi.number().positive().required(),
            })
        )
        .required(),
    totalPrice: Joi.number().positive().required(),
    createdAt: Joi.date().required(),
    expiresAt: Joi.date().required(),
    aiGenerated: Joi.boolean().required(),
});
