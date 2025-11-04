import Joi from "joi";

export const createBoardSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
  type: Joi.string().valid("personal", "team", "other").required(),
  color: Joi.string().max(20).required(),  
});

export const updateBoardSchema = Joi.object({
  name: Joi.string().min(2).max(60),
  type: Joi.string().valid("personal", "team", "other"),
  color: Joi.string().max(20),
}).min(1);
