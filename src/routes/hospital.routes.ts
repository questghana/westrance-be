import { ActiveDeactiveHospitalEmployee, SearchPatientById, addHospitalDependentController, addHospitalEmployeeController, addHospitalEmployeeRoleManagement, addInvoice, deleteHospitalEmployee, deleteInvoice, downloadInvoice, editHospitalEmployee, getHospitalDepartment, getHospitalEmployees, getHospitalEmployeesWithDependents, getInvoiceByHospital, getPatientByNameAndId, getMonthlyPatientVisits, getHospitalDashboardStats } from "@/controllers/hospital.controller";
import { verifyToken } from "@/middlewares/auth.middleware";
import { Router } from "express";


const HospitalRoutes = Router();


HospitalRoutes.get("/patient/search", SearchPatientById);
HospitalRoutes.post("/create", verifyToken, addHospitalEmployeeController)
HospitalRoutes.get("/employees", verifyToken, getHospitalEmployees)
HospitalRoutes.get("/employeedetails/:id", verifyToken, getHospitalEmployeesWithDependents)
HospitalRoutes.put("/edit/employee", verifyToken, editHospitalEmployee)
HospitalRoutes.delete("/employee/:id", verifyToken, deleteHospitalEmployee)
HospitalRoutes.post("/employee/status", verifyToken, ActiveDeactiveHospitalEmployee)
HospitalRoutes.post("/addHospitalDependents", addHospitalDependentController)
HospitalRoutes.post("/addEmployeeRoles", verifyToken, addHospitalEmployeeRoleManagement)
HospitalRoutes.get("/department", verifyToken, getHospitalDepartment)
HospitalRoutes.get("/patientByNameAndId/search", verifyToken, getPatientByNameAndId)
HospitalRoutes.post("/addinvoice", verifyToken, addInvoice)
HospitalRoutes.get("/getinvoice", verifyToken, getInvoiceByHospital)
HospitalRoutes.delete("/deleteinvoice/:id", verifyToken, deleteInvoice)
HospitalRoutes.get("/invoice/download/:id", verifyToken, downloadInvoice)
HospitalRoutes.get("/patient-visits/monthly", verifyToken, getMonthlyPatientVisits)
HospitalRoutes.get("/dashboard-stats", verifyToken, getHospitalDashboardStats);

export { HospitalRoutes };