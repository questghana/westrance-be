import { ActiveDeactiveemployee, companyRegisterController, deleteEmployee, editEmployee, getCompanyDetail, getCompanyEmployees, getCompanyEmployeesWithDependentsCount, getEmployeeWithDependents, getHospitalPharmacy, getInvoiceByCompany, updateCompanyDetail, } from "@/controllers/companyregister.controller";
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

export {companyregisterRoutes};