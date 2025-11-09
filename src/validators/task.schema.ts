import Joi from "joi";

export const createTaskBodySchema = Joi.object({
  title: Joi.string().min(2).max(120).required(),
  description: Joi.string().max(2000).allow("", null),
  priority: Joi.string().valid("none", "low", "moderate", "high" , "urgent"),
  dueDate: Joi.date().iso().allow(null),
  assigneeEmail: Joi.string().email().allow(null, ""),
});

export const updateTaskBodySchema = Joi.object({
  title: Joi.string().min(2).max(120),
  description: Joi.string().max(2000).allow("", null),
  priority: Joi.string().valid("none", "low", "moderate", "high" , "urgent"),
  dueDate: Joi.date().iso().allow(null),
  assigneeEmail: Joi.string().email().allow(null, ""),
});