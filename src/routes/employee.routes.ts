import { addDependentController, addEmployeeController, addWestranceDependentController, getEmployeeDashboardStats, getEmployeeInvoice, updateEmployeeController } from "@/controllers/addemployee.controller";
import { verifyToken } from "@/middlewares/auth.middleware";
import { Router } from "express";


const addEmployeeRoutes = Router();
addEmployeeRoutes.post("/create", verifyToken, addEmployeeController);
addEmployeeRoutes.put("/update", verifyToken, updateEmployeeController);
addEmployeeRoutes.post("/add-dependent", verifyToken, addDependentController);
addEmployeeRoutes.post("/add-Westrance-dependent", verifyToken, addWestranceDependentController)
addEmployeeRoutes.get("/dashboard-stats", verifyToken, getEmployeeDashboardStats);
addEmployeeRoutes.get("/invoice", verifyToken, getEmployeeInvoice);


export {addEmployeeRoutes};
