import Joi from "joi";

export const createColumnSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
});

export const updateColumnSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
});

export const reorderSchema = Joi.object({
  updates: Joi.array()
    .items(
      Joi.object({
        columnId: Joi.string().length(24).hex().required(),
        position: Joi.number().integer().min(0).required(),
      })
    )
    .min(1)
    .required(),
});
