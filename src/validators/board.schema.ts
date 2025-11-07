import Joi from "joi";

export const createBoardSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
  type: Joi.string()
    .valid("Engineering", "Design", "Marketing", "PM", "Ops", "General")
    .required(),
  color: Joi.string().max(20).required(),
});

export const updateBoardSchema = Joi.object({
  name: Joi.string().min(2).max(60),
  type: Joi.string().valid(
    "Engineering",
    "Design",
    "Marketing",
    "PM",
    "Ops",
    "General"
  ),
  color: Joi.string().max(20),
}).min(1);
