import { ActiveDeactiveCompany, addWestranceEmployeeController, adminlogincontroller, adminlogoutcontroller, deleteCompany, deleteHospitalPharmacy, getAllInvoices, getAllTicket, getCompany, getCompanyDetails, getEmployeeDetails, getHospitalEmployeeDetails, getHospitalPharmacy, getHospitalPharmacyDetails, getTicketById, getWestranceEmployees, MostRecentInvoiceByAdmin, MostRecentRegisterCompanyAdmin, RemoveTicketRequest, ReportsAnalytics, updateTicketStatus } from "@/controllers/admin.controller";
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
// Employee Management routes
adminRoute.post("/add-Employee", verifyTokenAdmin, addWestranceEmployeeController)
adminRoute.get("/get-Employees", verifyTokenAdmin, getWestranceEmployees)

adminRoute.get("/getAllInvoices", verifyTokenAdmin, getAllInvoices)
adminRoute.get("/report-analytics", verifyTokenAdmin, ReportsAnalytics)
// ticket routes
adminRoute.get("/getAllTickets", verifyTokenAdmin, getAllTicket)
adminRoute.get("/getTicket/:companyId", verifyTokenAdmin, getTicketById)
adminRoute.patch("/updateTicketStatus/:ticketId", verifyTokenAdmin, updateTicketStatus)
adminRoute.delete("/deleteTicket/:ticketId", verifyTokenAdmin, RemoveTicketRequest)

export { adminRoute }