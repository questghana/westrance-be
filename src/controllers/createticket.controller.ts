import { database } from "@/configs/connection.config";
import { createTicket } from "@/schema/schema";
import { Request, Response } from "express";




export const createTicketController = async (req:Request, res:Response)=>{
try {
    const {
        AdministrativeFullName,
        AdministrativeEmailAddress,        
        Subject,
        Describeissue
    } = req.body
    if(!AdministrativeFullName || !AdministrativeEmailAddress || !Subject || !Describeissue){
        return res.status(400).json({error: "missing required fields"})
    }

   const [data] =  await database.insert(createTicket).values({
        administrativeName: AdministrativeFullName,
        administrativeEmail: AdministrativeEmailAddress,
        subject: Subject,
        issue: Describeissue
    }).returning()

    return res.status(200).json({
     data,
     message: "Ticket Create Successfully"
    })
    
} catch (error) {
    console.error("Ticket error", error);
    return res.status(500).json({ error: "Something went wrong" });
}
}