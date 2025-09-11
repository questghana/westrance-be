import { ActiveDeactiveCompany, adminlogincontroller, adminlogoutcontroller, deleteCompany, getCompany, getCompanyDetails, getEmployeeDetails, getHospitalPharmacy, MostRecentInvoiceByAdmin, MostRecentRegisterCompanyAdmin } from "@/controllers/admin.controller";
import { verifyTokenAdmin } from "@/middlewares/admin.middleware";
import { Router } from "express";



const adminRoute = Router()


adminRoute.post("/admin-login", adminlogincontroller)
adminRoute.get("/admin-logout", adminlogoutcontroller)
adminRoute.get("/admin-getInvoice", verifyTokenAdmin, MostRecentInvoiceByAdmin)
adminRoute.get("/admin-getCompany", verifyTokenAdmin, MostRecentRegisterCompanyAdmin)
adminRoute.get("/company-management", verifyTokenAdmin, getCompany)
adminRoute.get("/hospital-pharmacy", verifyTokenAdmin, getHospitalPharmacy)
adminRoute.get("/company-detail/:companyId", verifyTokenAdmin, getCompanyDetails)
adminRoute.get("/employee-detail/:employeeId", verifyTokenAdmin, getEmployeeDetails)
adminRoute.delete("/deleteCompany/:companyId", verifyTokenAdmin, deleteCompany)
adminRoute.patch("/Active-Deactive-Company/:companyId/status", verifyTokenAdmin, ActiveDeactiveCompany)



export { adminRoute }