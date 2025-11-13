import { Router } from "express";
import { register, login, getCurrentUser, logout, refreshAccessToken } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.schema.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/user", requireAuth, getCurrentUser);

router.post("/refresh", refreshAccessToken);

router.post("/logout", requireAuth, logout);

export default router;
