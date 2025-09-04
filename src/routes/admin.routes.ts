import { adminlogincontroller, adminlogoutcontroller, MostRecentInvoiceByAdmin, MostRecentRegisterCompany } from "@/controllers/admin.controller";
import { verifyTokenAdmin } from "@/middlewares/admin.middleware";
import { Router } from "express";



const adminRoute = Router()


adminRoute.post("/admin-login", adminlogincontroller)
adminRoute.get("/admin-logout", verifyTokenAdmin, adminlogoutcontroller)
adminRoute.get("/admin-getInvoice", verifyTokenAdmin, MostRecentInvoiceByAdmin)
adminRoute.get("/admin-getCompany", verifyTokenAdmin, MostRecentRegisterCompany)



export { adminRoute }