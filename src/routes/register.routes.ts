import { ActiveDeactiveemployee, companyRegisterController, deleteEmployee, editEmployee, getCompanyAnalytics, getCompanyDashboardStats, getCompanyDetail, getCompanyEmployees, getCompanyEmployeesWithDependentsCount, getEmployeeWithDependents, getHospitalPharmacy, getInvoiceByCompany, updateCompanyDetail, getcompanyReportAnalyticsStats, getCompanyNotifications, updateCompanyNotificationStatus, markAllCompanyNotificationsAsRead, deleteCompanyNotification } from "@/controllers/companyregister.controller";
import { verifyToken } from "@/middlewares/auth.middleware";
import { Router } from "express";


const companyregisterRoutes = Router();

companyregisterRoutes.post("/register", companyRegisterController);
companyregisterRoutes.put("/companydetail/update", verifyToken, updateCompanyDetail);
companyregisterRoutes.get("/companydetails", verifyToken, getCompanyDetail);
companyregisterRoutes.get("/employees", verifyToken, getCompanyEmployees)
companyregisterRoutes.get("/companydetail", verifyToken, getHospitalPharmacy)
companyregisterRoutes.get("/employee/details/:id", verifyToken, getEmployeeWithDependents)
companyregisterRoutes.delete("/employee/:id", verifyToken, deleteEmployee)
companyregisterRoutes.post("/employee/status", verifyToken, ActiveDeactiveemployee)
companyregisterRoutes.put("/edit/employee", verifyToken, editEmployee)
companyregisterRoutes.get("/employee/dependents", verifyToken, getCompanyEmployeesWithDependentsCount)
companyregisterRoutes.get("/getinvoice", verifyToken, getInvoiceByCompany)
companyregisterRoutes.get("/analytics", verifyToken, getCompanyAnalytics)
companyregisterRoutes.get("/dashboard-stats", verifyToken, getCompanyDashboardStats)
companyregisterRoutes.get("/reports-analytics-stats", verifyToken, getcompanyReportAnalyticsStats)
// Company notifications
companyregisterRoutes.get("/notifications", verifyToken, getCompanyNotifications)
companyregisterRoutes.patch("/notifications/:notificationId", verifyToken, updateCompanyNotificationStatus)
companyregisterRoutes.post("/notifications/mark-all-read", verifyToken, markAllCompanyNotificationsAsRead)
companyregisterRoutes.delete("/notifications/:notificationId", verifyToken, deleteCompanyNotification)
export {companyregisterRoutes};