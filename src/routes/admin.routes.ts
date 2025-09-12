import { ActiveDeactiveCompany, adminlogincontroller, adminlogoutcontroller, deleteCompany, deleteHospitalPharmacy, getAllInvoices, getCompany, getCompanyDetails, getEmployeeDetails, getHospitalEmployeeDetails, getHospitalPharmacy, getHospitalPharmacyDetails, MostRecentInvoiceByAdmin, MostRecentRegisterCompanyAdmin } from "@/controllers/admin.controller";
import { verifyTokenAdmin } from "@/middlewares/admin.middleware";
import { Router } from "express";



const adminRoute = Router()


adminRoute.post("/admin-login", adminlogincontroller)
adminRoute.get("/admin-logout", adminlogoutcontroller)
adminRoute.get("/admin-getInvoice", verifyTokenAdmin, MostRecentInvoiceByAdmin)
adminRoute.get("/admin-getCompany", verifyTokenAdmin, MostRecentRegisterCompanyAdmin)
adminRoute.patch("/Active-Deactive-Company/:companyId/status", verifyTokenAdmin, ActiveDeactiveCompany)
// company management routes
adminRoute.get("/company-management", verifyTokenAdmin, getCompany)
adminRoute.get("/company-detail/:companyId", verifyTokenAdmin, getCompanyDetails)
adminRoute.get("/employee-detail/:employeeId", verifyTokenAdmin, getEmployeeDetails)
adminRoute.delete("/deleteCompany/:companyId", verifyTokenAdmin, deleteCompany)
// Hospital Pharmacy routes
adminRoute.get("/hospital-pharmacy", verifyTokenAdmin, getHospitalPharmacy)
adminRoute.get("/HospitalPharmacy-detail/:companyId", verifyTokenAdmin, getHospitalPharmacyDetails)
adminRoute.get("/HospitalEmployee-detail/:employeeId", verifyTokenAdmin, getHospitalEmployeeDetails)
adminRoute.delete("/deleteHospitalPharmacy/:companyId", verifyTokenAdmin, deleteHospitalPharmacy)


adminRoute.get("/getAllInvoices", verifyTokenAdmin, getAllInvoices)

export { adminRoute }