import { adminlogincontroller, adminlogoutcontroller } from "@/controllers/admin.controller";
import { Router } from "express";



const adminRoute = Router()


adminRoute.post("/admin-login", adminlogincontroller)
adminRoute.post("/admin-logout", adminlogoutcontroller)



export {adminRoute}