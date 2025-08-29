import { addDependentController, addEmployeeController, updateEmployeeController } from "@/controllers/addemployee.controller";
import { verifyToken } from "@/middlewares/auth.middleware";
import { Router } from "express";


const addEmployeeRoutes = Router();
addEmployeeRoutes.post("/create", verifyToken, addEmployeeController);
addEmployeeRoutes.put("/update", verifyToken, updateEmployeeController);
addEmployeeRoutes.post("/adddependents", addDependentController);


export {addEmployeeRoutes};
