import { database } from "@/configs/connection.config";
import { addEmployeeInvoice, admins, companyregister } from "@/schema/schema";
import { eq, desc } from "drizzle-orm";
import { CookieOptions, Request, Response } from "express";
import bcrypt from "bcryptjs"
import { config } from "dotenv";
import { generateJwt } from "@/utils/common.util";
import { AuthenticatedRequestAdmin } from "@/middlewares/admin.middleware";


config();

export const adminlogincontroller = async (req: Request, res: Response) => {
    try {
        const {
            Email,
            password
        } = req.body

        const [admin] = await database
            .select()
            .from(admins)
            .where(eq(admins.email, Email))

        if (!admin) {
            return res.status(404).json({ error: "User Not Found" })
        }

        const isValidPassword = await bcrypt.compare(password, admin.password)


        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = generateJwt({ id: admin.id, role: admin.role, email: admin.email }, '1d');
        const cookieOptions: CookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production" ? true : false,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24, // 1 day    
        };
        res.cookie('token', token, cookieOptions);
        const { password: _password, ...adminWithoutPass } = admin;

        return res.status(200).json({
            message: "Admin Login Successfully",
            admin: adminWithoutPass
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Something went wrong during login" });
    }
}

export const adminlogoutcontroller = async (_req: Request, res: Response) => {
    try {
        res.clearCookie("token")
        return res.status(200).json({
            success: true,
            message: "Admin Logout Successfully"
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Something went wrong during logout" });
    }
}

export const MostRecentInvoiceByAdmin = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id
        if (!adminId) {
            return res.status(401).json({
                error: "Unauthorized"
            })
        }

        const latestInvoice = await database
            .select()
            .from(addEmployeeInvoice)
            .orderBy(desc(addEmployeeInvoice.SubmittedDate))

        if (!latestInvoice) {
            return res.status(404).json({
                message: "No invoice found"
            })
        }

        return res.status(200).json({
            latestInvoice
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}

export const MostRecentRegisterCompany = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id
        if (!adminId) {
            return res.status(401).json({
                error: "Unauthorized"
            })
        }

        const latestCompany = await database
            .select()
            .from(companyregister)
            .orderBy(desc(companyregister.createdAt))

        if (!latestCompany) {
            return res.status(404).json({
                message: "No Company found"
            })
        }

        return res.status(200).json({
            latestCompany
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}
