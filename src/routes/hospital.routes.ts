import { ActiveDeactiveHospitalEmployee, SearchPatientById, addHospitalDependentController, addHospitalEmployeeController, addHospitalEmployeeRoleManagement, addInvoice, deleteHospitalEmployee, deleteInvoice, editHospitalEmployee, getHospitalDepartment, getHospitalEmployees, getHospitalEmployeesWithDependents, getInvoice, getPatientByNameAndId } from "@/controllers/hospital.controller";
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
HospitalRoutes.get("/getinvoice", verifyToken, getInvoice)
HospitalRoutes.delete("/deleteinvoice/:id", verifyToken, deleteInvoice)


export { HospitalRoutes };