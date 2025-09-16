import { database } from "@/configs/connection.config";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { companyregister, createTicket } from "@/schema/schema";
import { desc, eq } from "drizzle-orm";
import { Response } from "express";




export const createTicketController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "unAuthorized" })
        }
        const {
            AdministrativeFullName,
            AdministrativeEmailAddress,
            Subject,
            Describeissue
        } = req.body


        const [company] = await database
            .select({ companyId: companyregister.companyId })
            .from(companyregister)
            .where(eq(companyregister.companyId, userId));

        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        if (!AdministrativeFullName || !AdministrativeEmailAddress || !Subject || !Describeissue) {
            return res.status(400).json({ error: "missing required fields" })
        }

        const [data] = await database.insert(createTicket).values({
            administrativeName: AdministrativeFullName,
            administrativeEmail: AdministrativeEmailAddress,
            subject: Subject,
            issue: Describeissue,
            companyId: company.companyId
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


export const getTicketController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId
        console.log(userId);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        const [company] = await database
            .select({ companyId: companyregister.companyId })
            .from(companyregister)
            .where(eq(companyregister.companyId, userId))

        if (!company) {
            return res.status(404).json({ error: "Company Not Found" })
        }
        const ticket = await database
            .select()
            .from(createTicket)
            .where(eq(createTicket.companyId, company.companyId))
            .orderBy(desc(createTicket.createdAt))
            .limit(5)

        return res.status(200).json({
            ticket
        })
        
    } catch (error) {
        console.error("Failed to fetch tickets", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}

