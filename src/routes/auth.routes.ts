import { Router } from "express";
import { register, login, getCurrentUser, logout, refresh, googleAuthCallback } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.schema.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import passport from "passport";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/user", requireAuth, getCurrentUser);

router.post("/refresh", refresh);

router.post("/logout", requireAuth, logout);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { 
    session: false,
    failureRedirect: `${process.env.CLIENT_ORIGIN}/login?error=failed` 
  }),
  googleAuthCallback 
);

export default router;
