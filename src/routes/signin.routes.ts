import { forgotPassword, resetPassword, unifiedSignInController } from "@/controllers/singin.controller";
import { Router } from "express";


const signInRoutes = Router();

signInRoutes.post("/signin", unifiedSignInController);
signInRoutes.post("/forgotpassword", forgotPassword);
signInRoutes.put("/resetpassword", resetPassword);

export {signInRoutes};