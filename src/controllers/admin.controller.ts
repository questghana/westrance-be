import { database } from "@/configs/connection.config";
import { account, addDependents, addEmployee, addEmployeeInvoice, addHospitalDependents, addHospitalEmployee, admins, companyregister, createTicket, users, WestranceEmployee } from "@/schema/schema";
import { eq, desc, and, ne, or, sql } from "drizzle-orm";
import { CookieOptions, Request, Response } from "express";
import bcrypt from "bcryptjs"
import { config } from "dotenv";
import { generateJwt } from "@/utils/common.util";
import { AuthenticatedRequestAdmin } from "@/middlewares/admin.middleware";
import cloudinary from "@/configs/cloudniary.config";
import { createId } from "@paralleldrive/cuid2";
import { generateBetterAuthPasswordHash } from "@/utils/password-hash.util";
import generateEmployeeId from "@/utils/generate.employeeid";


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

export const MostRecentRegisterCompanyAdmin = async (req: AuthenticatedRequestAdmin, res: Response) => {
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

export const ActiveDeactiveCompany = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id
        if (!adminId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { companyId } = req.params
        const { status } = req.body

        if (!status || !['Active', 'Deactive'].includes(status)) {
            return res.status(400).json({ error: "Invalid status value" })
        }
        const isActive = status === "Active";

        const updated = await database
            .update(companyregister)
            .set({ isActive })
            .where(eq(companyregister.companyId, companyId))
            .returning()

        if (!updated.length) {
            return res.status(404).json({ error: "Company not found" });
        }

        return res.status(200).json({
            message: `Company ${isActive ? "Activated" : "Deactivated"} successfully`,
            company: updated[0],
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}

// company management controller by admin
export const getCompany = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id;
        if (!adminId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const [company, total] = await Promise.all([
            database
                .select()
                .from(companyregister)
                .where(
                    and(
                        ne(companyregister.companyType, "Hospital"),
                        ne(companyregister.companyType, "Pharmacy")
                    )
                )
                .limit(limit)
                .offset(offset),

            database
                .select({ count: sql<number>`count(*)`.as("count") })
                .from(companyregister)
                .where(
                    and(
                        ne(companyregister.companyType, "Hospital"),
                        ne(companyregister.companyType, "Pharmacy")
                    )
                )
        ]);

        return res.status(200).json({
            company,
            pagination: {
                total: total[0].count,
                page,
                limit,
                totalPages: Math.ceil(total[0].count / limit),
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const getCompanyDetails = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const { companyId } = req.params;

        const company = await database
            .select()
            .from(companyregister)
            .where(eq(companyregister.companyId, companyId));

        // Pagination only for employees
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const [employees, total] = await Promise.all([
            database
                .select()
                .from(addEmployee)
                .where(eq(addEmployee.companyUserId, companyId))
                .limit(limit)
                .offset(offset),

            database
                .select({ count: sql<number>`count(*)`.as("count") })
                .from(addEmployee)
                .where(eq(addEmployee.companyUserId, companyId)),
        ]);

        return res.status(200).json({
            company: company[0],
            employees,
            pagination: {
                total: total[0].count,
                page,
                limit,
                totalPages: Math.ceil(total[0].count / limit),
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const getEmployeeDetails = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const { employeeId } = req.params

        const employee = await database
            .select()
            .from(addEmployee)
            .where(eq(addEmployee.employeeId, employeeId))

        const dependents = await database
            .select()
            .from(addDependents)
            .where(eq(addDependents.employeeId, employeeId))

        return res.status(200).json({
            employee: employee[0],
            dependents
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}

export const deleteCompany = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id;
        if (!adminId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { companyId } = req.params;

        // 1. Get company details (for account & user deletion later)
        const [company] = await database
            .select()
            .from(companyregister)
            .where(eq(companyregister.companyId, companyId));

        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        // 2. Get all employees of this company
        const employees = await database
            .select()
            .from(addEmployee)
            .where(eq(addEmployee.companyUserId, companyId));

        for (const emp of employees) {
            // 2.1 Delete dependents
            await database
                .delete(addDependents)
                .where(eq(addDependents.employeeId, emp.employeeId));

            // 2.2 Delete employee's account
            await database
                .delete(account)
                .where(eq(account.accountId, emp.emailAddress)); // ya accountId mapping

            // 2.3 Delete employee's user record
            await database
                .delete(users)
                .where(eq(users.email, emp.emailAddress));
        }

        // 3. Delete employees
        await database
            .delete(addEmployee)
            .where(eq(addEmployee.companyUserId, companyId));

        // 4. Delete company record
        await database
            .delete(companyregister)
            .where(eq(companyregister.companyId, companyId));

        // 5. Delete company's account
        await database
            .delete(account)
            .where(eq(account.accountId, company.administrativeEmail)); // ya company ke liye unique id

        // 6. Delete company's user record
        await database
            .delete(users)
            .where(eq(users.email, company.administrativeEmail));

        return res.status(200).json({ message: "Company and all related records deleted successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

// Hospital & Pharmacy Controller by admin
export const getHospitalPharmacy = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id;
        if (!adminId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const [HospitalPharmacy, total] = await Promise.all([
            database
                .select()
                .from(companyregister)
                .where(
                    or(
                        eq(companyregister.companyType, "Hospital"),
                        eq(companyregister.companyType, "Pharmacy")
                    )
                )
                .limit(limit)
                .offset(offset),

            database
                .select({ count: sql<number>`count(*)`.as("count") })
                .from(companyregister)
                .where(
                    or(
                        eq(companyregister.companyType, "Hospital"),
                        eq(companyregister.companyType, "Pharmacy")
                    )
                )
        ]);

        return res.status(200).json({
            HospitalPharmacy,
            pagination: {
                total: total[0].count,
                page,
                limit,
                totalPages: Math.ceil(total[0].count / limit),
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const getHospitalPharmacyDetails = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const { companyId } = req.params;

        const company = await database
            .select()
            .from(companyregister)
            .where(eq(companyregister.companyId, companyId));

        // Pagination only for employees
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const [employees, total] = await Promise.all([
            database
                .select()
                .from(addHospitalEmployee)
                .where(eq(addHospitalEmployee.companyUserId, companyId))
                .limit(limit)
                .offset(offset),

            database
                .select({ count: sql<number>`count(*)`.as("count") })
                .from(addHospitalEmployee)
                .where(eq(addHospitalEmployee.companyUserId, companyId)),
        ]);

        return res.status(200).json({
            company: company[0],
            employees,
            pagination: {
                total: total[0].count,
                page,
                limit,
                totalPages: Math.ceil(total[0].count / limit),
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const getHospitalEmployeeDetails = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const { employeeId } = req.params

        const employee = await database
            .select()
            .from(addHospitalEmployee)
            .where(eq(addHospitalEmployee.employeeId, employeeId))

        const dependents = await database
            .select()
            .from(addHospitalDependents)
            .where(eq(addHospitalDependents.employeeId, employeeId))

        return res.status(200).json({
            employee: employee[0],
            dependents
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}

export const deleteHospitalPharmacy = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id;
        if (!adminId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { companyId } = req.params;

        // 1. Get company details (for account & user deletion later)
        const [company] = await database
            .select()
            .from(companyregister)
            .where(eq(companyregister.companyId, companyId));

        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        // 2. Get all employees of this company
        const employees = await database
            .select()
            .from(addHospitalEmployee)
            .where(eq(addHospitalEmployee.companyUserId, companyId));

        for (const emp of employees) {
            // 2.1 Delete dependents
            await database
                .delete(addHospitalDependents)
                .where(eq(addHospitalDependents.employeeId, emp.employeeId));

            // 2.2 Delete employee's account
            await database
                .delete(account)
                .where(eq(account.accountId, emp.emailAddress)); // ya accountId mapping

            // 2.3 Delete employee's user record
            await database
                .delete(users)
                .where(eq(users.email, emp.emailAddress));
        }

        // 3. Delete employees
        await database
            .delete(addHospitalEmployee)
            .where(eq(addHospitalEmployee.companyUserId, companyId));

        // 4. Delete company record
        await database
            .delete(companyregister)
            .where(eq(companyregister.companyId, companyId));

        // 5. Delete company's account
        await database
            .delete(account)
            .where(eq(account.accountId, company.administrativeEmail)); // ya company ke liye unique id

        // 6. Delete company's user record
        await database
            .delete(users)
            .where(eq(users.email, company.administrativeEmail));

        return res.status(200).json({ message: `${company.companyType} and all related records deleted successfully` });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

// Employee Management By Admin
export const addWestranceEmployeeController = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id;
        if (!adminId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const {
            firstName,
            middleName,
            lastName,
            email,
            companyContact,
            startingDate,
            duration,
            amount,
            benefits,
            password,
            confirmPassword,
            dependents,
            profilePhoto,
        } = req.body;

        if (!firstName || !lastName || !email || !companyContact || !startingDate || !duration || !amount || !benefits || !password || !confirmPassword) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        let uploadedImageUrl: string | null = null;
        if (profilePhoto) {
            const uploadRes = await cloudinary.uploader.upload(profilePhoto, {
                folder: "westrance_employee_profiles",
                transformation: [{ width: 300, height: 300, crop: "fill" }],
            });
            uploadedImageUrl = uploadRes.secure_url;
        }

        // Check if user already exists
        const existingUser = await database
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                emailVerified: users.emailVerified,
                image: users.image,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt
            })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        let userId: string;

        if (existingUser.length > 0) {
            // User exists, use existing user ID
            userId = existingUser[0].id;

            // Update the existing user's role to Employee if needed
            if (existingUser[0].role !== "Westrance Employee") {
                await database
                    .update(users)
                    .set({ role: "Westrance Employee" })
                    .where(eq(users.id, userId));
            }
        } else {
            // Create new user WITHOUT password - Better-Auth will handle password management
            const fullName = middleName ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`;

            userId = createId();

            // Create user WITHOUT password - Better-Auth will handle this
            await database.insert(users).values({
                id: userId,
                name: fullName,
                email,
                role: "Westrance Employee",
                emailVerified: false,
                image: uploadedImageUrl || null,
            });

            // Generate proper password hash for Better-Auth
            const hashedPassword = await generateBetterAuthPasswordHash(password);

            // Create account entry for Better-Auth with proper password hash
            await database.insert(account).values({
                id: createId(),
                accountId: email,
                providerId: "credential",
                userId: userId,
                password: hashedPassword, // Store properly hashed password
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        // Check if employee already exists
        const existingEmployee = await database
            .select()
            .from(WestranceEmployee)
            .where(eq(WestranceEmployee.emailAddress, email))
            .limit(1);

        if (existingEmployee.length > 0) {
            return res.status(400).json({ error: "Employee with this email already exists" });
        }

        const employeeId = generateEmployeeId();
        const hashedPassword = await generateBetterAuthPasswordHash(password);
        const insertedEmployess = await database.insert(WestranceEmployee).values({
            id: createId(),
            userId,
            companyUserId: adminId,
            employeeId,
            firstName,
            middleName,
            lastName,
            emailAddress: email,
            registrationNumber: companyContact,
            startingDate: new Date(startingDate),
            duration,
            amountPackage: amount,
            benefits,
            createPassword: hashedPassword,
            profileImage: uploadedImageUrl || null,
            dependents,
            role: "Westrance Employee",
        }).returning();

        return res.status(200).json({
            message: "Employee added successfully",
            data: {
                employee: insertedEmployess[0]
            },
            note: existingUser.length > 0
                ? "Used existing user account"
                : "Created new user account with properly hashed password.",
            instructions: "User can now sign in directly with their password."
        });
    } catch (error) {
        console.error("Error adding employee:", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const getWestranceEmployees = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id;
        // const adminRole = req.admin?.role;

        if (!adminId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Pagination params from query
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const westranceEmployees = await database
            .select()
            .from(WestranceEmployee)
            .where(eq(WestranceEmployee.companyUserId, adminId))
            .limit(limit)
            .offset(offset)

        const total = await database
            .select({ count: sql<number>`count(*)`.as("count") })
            .from(WestranceEmployee)
        return res.status(200).json({
            westranceEmployees,
            pagination: {
                total: total[0].count,
                page,
                limit,
                totalPages: Math.ceil(total[0].count / limit),
            },
        });
    } catch (error) {
        console.error("Failed to fetch employees", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};




export const getAllInvoices = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id;
        if (!adminId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;


        const Invoices = await database
            .select({
                id: addEmployeeInvoice.id,
                EmployeeId: addEmployeeInvoice.EmployeeId,
                companyId: addEmployeeInvoice.companyId,
                companyName: companyregister.companyName,
                companyType: companyregister.companyType,
                HospitalName: addEmployeeInvoice.HospitalName,
                PatientName: addEmployeeInvoice.PatientName,
                Amount: addEmployeeInvoice.Amount,
                RemainingBalance: addEmployeeInvoice.RemainingBalance,
                BenefitUsed: addEmployeeInvoice.BenefitUsed,
                SubmittedDate: addEmployeeInvoice.SubmittedDate,
            })
            .from(addEmployeeInvoice)
            .leftJoin(
                companyregister,
                eq(addEmployeeInvoice.employerCompanyId, companyregister.companyId)
            )
            .orderBy(desc(addEmployeeInvoice.SubmittedDate))
            .limit(limit)
            .offset(offset)

        if (!Invoices || Invoices.length === 0) {
            return res.status(404).json({ message: "No invoice found" });
        }

        const total = await database
            .select({ count: sql<number>`count(*)`.as("count") })
            .from(addEmployeeInvoice)
        return res.status(200).json({
            Invoices,
            pagination: {
                total: total[0].count,
                page,
                limit,
                totalPages: Math.ceil(total[0].count / limit),
            },
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const ReportsAnalytics = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const admin = req.admin?.id;
        if (!admin) return res.status(401).json({ error: "Unauthorized" });

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        // Paginated invoices
        const invoices = await database
            .select()
            .from(addEmployeeInvoice)
            .offset(offset)
            .limit(limit);

        // Total count
        const totalInvoices = await database
            .select({ count: sql<number>`count(*)`.as("count") })
            .from(addEmployeeInvoice)

        const totalCount = totalInvoices[0]?.count || 0;
        const totalPages = Math.ceil(totalCount / limit);

        return res.status(200).json({
            invoices,
            totalCount,
            totalPages,
            currentPage: page,
            limit,
        });
    } catch (error) {
        console.error("Failed to fetch invoices", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const getAllTicket = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id
        if (!adminId) return res.status(401).json({ error: "unauthorized" })

        const page = parseInt(req.query.page as string) || 0;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit

        const getAllTickets = await database
            .select()
            .from(createTicket)
            .limit(limit)
            .offset(offset)

        const totalInvoices = await database
            .select({ count: sql<number>`count(*)`.as("count") })
            .from(createTicket)

        const totalCount = totalInvoices[0]?.count || 0;
        const totalPages = Math.ceil(totalCount / limit);

        return res.status(200).json({
            getAllTickets,
            totalCount,
            totalPages,
            currentPage: page,
            limit,
        })
    } catch (error) {
        console.error("Failed to fetch invoices", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}

export const getTicketById = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id
        if (!adminId) return res.status(401).json({ error: "unauthorized" })

        const { companyId } = req.params
        console.log(typeof companyId);
        if (!companyId || typeof companyId !== "string") {
            return res.status(404).json({ error: "CompanyId Not Found" });
        }

        const [getTicketById] = await database
            .select({
                companyName: companyregister.companyName,
                companyType: companyregister.companyType,
                profileImage: companyregister.profileImage,
                ticketId: createTicket.id,
                subject: createTicket.subject,
                createdAt: createTicket.createdAt,
                status: createTicket.status
            })
            .from(createTicket)
            .leftJoin(
                companyregister,
                eq(createTicket.companyId, companyregister.companyId)
            )
            .where(eq(createTicket.companyId, companyId))

        return res.status(200).json({
            getTicketById
        })
    } catch (error) {
        console.error("Failed to fetch invoices", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}

export const updateTicketStatus = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id
        if (!adminId) return res.status(401).json({ error: "unauthorized" })
        const { ticketId } = req.params
        const { Status } = req.body

        if (!Status || !['Approved', 'Pending'].includes(Status)) {
            return res.status(400).json({ error: "Invalid status value" })
        }

        const updated = await database
            .update(createTicket)
            .set({ status: Status })
            .where(eq(createTicket.id, ticketId))
            .returning()

        if (!updated.length) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        return res.status(200).json({
            message: `Ticket marked as ${Status}`,
            ticket: updated[0].status
        });
    }
    catch (error) {
        console.error("Failed to fetch invoices", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}

export const RemoveTicketRequest = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id
        if (!adminId) return res.status(401).json({ error: "unauthorized" })
        const { ticketId } = req.params
        await database
            .delete(createTicket)
            .where(eq(createTicket.id, ticketId))

        return res.status(200).json({
            message: "Ticket Removed Successfully"
        })
    } catch (error) {
        console.error("Failed to fetch invoices", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}