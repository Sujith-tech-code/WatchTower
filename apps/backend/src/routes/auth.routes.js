import { Router } from "express";
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  meController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

// ─── Auth Routes ──────────────────────────────────────────────────────────────
//
//  POST  /api/auth/register   — create a new account
//  POST  /api/auth/login      — log in, get tokens
//  POST  /api/auth/refresh    — get a new access token using a refresh token
//  POST  /api/auth/logout     — invalidate the refresh token
//  GET   /api/auth/me         — get current user info (protected)

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);

// The `/me` route uses `authenticate` middleware — it runs BEFORE meController.
// If the token is invalid, authenticate stops the request and returns 401.
// If valid, meController runs and returns the user's info.
router.get("/me", authenticate, meController);

export default router;
