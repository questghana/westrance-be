import { createTicketController } from "@/controllers/createticket.controller";
import { Router } from "express";


const ticketRoutes = Router();

ticketRoutes.post("/ticket", createTicketController);

export {ticketRoutes};