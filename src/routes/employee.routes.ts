import { addDependentController, addEmployeeController, addWestranceDependentController, updateEmployeeController } from "@/controllers/addemployee.controller";
import { verifyToken } from "@/middlewares/auth.middleware";
import { Router } from "express";


const addEmployeeRoutes = Router();
addEmployeeRoutes.post("/create", verifyToken, addEmployeeController);
addEmployeeRoutes.put("/update", verifyToken, updateEmployeeController);
addEmployeeRoutes.post("/add-dependent", verifyToken, addDependentController);
addEmployeeRoutes.post("/add-Westrance-dependent", verifyToken, addWestranceDependentController)


export {addEmployeeRoutes};
