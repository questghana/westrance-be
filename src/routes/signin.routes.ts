import {  authme, forgotPassword, logout, resetPassword, unifiedSignInController } from "@/controllers/singin.controller";
import { Router } from "express";


const signInRoutes = Router();

signInRoutes.post("/signin", unifiedSignInController);
signInRoutes.post("/forgotpassword", forgotPassword);
signInRoutes.put("/resetpassword", resetPassword);
signInRoutes.get("/logout",  logout);
signInRoutes.get("/me", authme);

export {signInRoutes};