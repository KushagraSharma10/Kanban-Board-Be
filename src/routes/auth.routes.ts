import { Router } from "express";
import { register, login, getMe, logout, refresh } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.schema.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", requireAuth, getMe);

router.post("/refresh", refresh);

router.post("/logout", requireAuth, logout);

export default router;
