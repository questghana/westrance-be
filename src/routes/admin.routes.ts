import { ActiveDeactiveCompany, ActiveDeactiveWestranceEmployee, addWestranceEmployeeController, addWestranceEmployeeRoleManagement, adminlogincontroller, adminlogoutcontroller, deleteCompany, deleteHospitalPharmacy, deleteWestranceEmployee, editWestranceEmployee, getAdminDetail, getAllInvoices, getAllTicket, getCompany, getCompanyDetails, getEmployeeDetails, getHospitalEmployeeDetails, getHospitalPharmacy, getHospitalPharmacyDetails, getTicketById, getWestranceEmployees, getWestranceEmployeesWithDependents, MostRecentInvoiceByAdmin, MostRecentRegisterCompanyAdmin, RemoveTicketRequest, ReportsAnalytics, updateAdminDetail, updateTicketStatus, getAdminNotifications, updateNotificationStatus, markAllNotificationsAsRead, deleteNotification, adminDashboardStats, monthlyWestranceUsageAnalytics, getReportsAnalyticsStatistics, getWestranceDepartment } from "@/controllers/admin.controller";
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
adminRoute.get("/get-Employees-dependents/:id", verifyTokenAdmin, getWestranceEmployeesWithDependents)
adminRoute.put("/edit-Employee", verifyTokenAdmin, editWestranceEmployee)
adminRoute.delete("/delete-Employee/:id", verifyTokenAdmin, deleteWestranceEmployee)
adminRoute.post("/ActiveDeactive-Employee/Status", verifyTokenAdmin, ActiveDeactiveWestranceEmployee)
adminRoute.get("/getAllInvoices", verifyTokenAdmin, getAllInvoices)
adminRoute.get("/report-analytics", verifyTokenAdmin, ReportsAnalytics)
adminRoute.post("/add-EmployeeRoles", verifyTokenAdmin, addWestranceEmployeeRoleManagement)
adminRoute.get("/get-adminDetail", verifyTokenAdmin, getAdminDetail)
adminRoute.put("/update-adminDetail", verifyTokenAdmin, updateAdminDetail)

// department routes
adminRoute.get("/department", verifyTokenAdmin, getWestranceDepartment)


// ticket routes
adminRoute.get("/getAllTickets", verifyTokenAdmin, getAllTicket)
adminRoute.get("/getTicket/:companyId", verifyTokenAdmin, getTicketById)
adminRoute.patch("/updateTicketStatus/:ticketId", verifyTokenAdmin, updateTicketStatus)
adminRoute.delete("/deleteTicket/:ticketId", verifyTokenAdmin, RemoveTicketRequest)

// Notification routes
adminRoute.get("/notifications", verifyTokenAdmin, getAdminNotifications);
adminRoute.patch("/notifications/:notificationId", verifyTokenAdmin, updateNotificationStatus);
adminRoute.post("/notifications/mark-all-read", verifyTokenAdmin, markAllNotificationsAsRead);
adminRoute.delete("/notifications/:notificationId", verifyTokenAdmin, deleteNotification);

// admin dashboardStats routes
adminRoute.get("/stats", verifyTokenAdmin, adminDashboardStats)
adminRoute.get("/monthly-westrance-usage-analytics", verifyTokenAdmin, monthlyWestranceUsageAnalytics)
adminRoute.get("/reports-analytics-statistics", verifyTokenAdmin, getReportsAnalyticsStatistics)
export { adminRoute }