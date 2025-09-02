import { createTicketController, getTicketController } from "@/controllers/createticket.controller";
import { verifyToken } from "@/middlewares/auth.middleware";
import { Router } from "express";


const ticketRoutes = Router();

ticketRoutes.post("/create", verifyToken, createTicketController);
ticketRoutes.get("/getTicket", verifyToken, getTicketController);

export {ticketRoutes};