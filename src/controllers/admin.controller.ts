import { database } from "@/configs/connection.config";
import { account, addDependents, addEmployee, addEmployeeInvoice, addHospitalDependents, addHospitalEmployee, addWestranceDependents, admins, companyregister, createTicket, users, WestranceEmployee, WestranceRolesManagement, companyNotifications } from "@/schema/schema";
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
import { notifications } from "@/schema/schema";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";


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
        const cookieOptions: CookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production" ? true : false,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        };
        res.clearCookie("token", cookieOptions);
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

        const company = await database.query.companyregister.findFirst({
            where: (fields, { eq }) => eq(fields.companyId, 'COMP-001'),
        });

        if (!company) {
            return res.status(404).json({ error: "Company not found" });
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

export const getWestranceEmployeesWithDependents = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const { id } = req.params
        if (!id) return res.status(404).json({ error: "Missing EmployeeId" })
        const employee = await database
            .select()
            .from(WestranceEmployee)
            .where(eq(WestranceEmployee.employeeId, id))

        const Westrancedependents = await database
            .select()
            .from(addWestranceDependents)
            .where(eq(addWestranceDependents.employeeId, id))

        if (!employee.length) {
            return res.status(404).json({ error: "Employee Not Found" })
        }

        return res.status(200).json({
            employee: employee[0],
            Westrancedependents
        })

    } catch (error) {
        console.log("Error fetching employee", error);
        return res.status(500).json({ error: "Server Error" });
    }
}

export const editWestranceEmployee = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const {
            employeeId,
            firstName,
            middleName,
            lastName,
            email,
            companyContact,
            startingDate,
            duration,
            amount,
            benefits,
            dependents,
            password,
            confirmPassword,
            profilePhoto
        } = req.body

        // console.log(req.body)
        if (!employeeId) {
            return res.status(400).json({ error: "Employee ID is required" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" })
        }

        const existingEmployee = await database
            .select()
            .from(WestranceEmployee)
            .where(eq(WestranceEmployee.employeeId, employeeId));

        const prevImgUrl = existingEmployee[0].profileImage
        let profileImg = prevImgUrl;

        if (profilePhoto) {
            const isBase64 = profilePhoto.startsWith("data:image");

            if (isBase64) {
                // Remove old image if it exists
                if (prevImgUrl) {
                    const parts = prevImgUrl.split('/');
                    const publicIdWithExtension = parts[parts.length - 1];
                    const publicId = `westrance_employee_profiles/${publicIdWithExtension.split('.')[0]}`;
                    await cloudinary.uploader.destroy(publicId);
                }

                // Upload new image
                const uploadResponse = await cloudinary.uploader.upload(profilePhoto, {
                    folder: 'Hospital_Employees_Profiles',
                    transformation: [{ width: 300, height: 300, crop: "fill" }],
                });

                profileImg = uploadResponse.secure_url;
            } else {
                // Image is already a Cloudinary URL, use as-is
                profileImg = profilePhoto;
            }
        }

        const updateEmployee = await database.update(WestranceEmployee).set({
            firstName,
            middleName,
            lastName,
            emailAddress: email,
            registrationNumber: companyContact,
            startingDate: new Date(startingDate),
            duration,
            amountPackage: amount,
            benefits,
            dependents,
            createPassword: password,
            profileImage: profileImg
        }).where(eq(WestranceEmployee.employeeId, employeeId)).returning()

        return res.status(200).json({
            message: "Employee updated Successfully",
            updateEmployee
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server Error" });
    }
}

export const deleteWestranceEmployee = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Missing EmployeeId" });
        }

        const employee = await database
            .delete(WestranceEmployee)
            .where(eq(WestranceEmployee.employeeId, id))
            .returning()

        if (employee.length > 0) {
            const email = employee[0].emailAddress

            await database.delete(account).where(eq(account.accountId, email))

            await database.delete(users).where(eq(users.email, email))
        }

        if (employee.length > 0 && employee[0].profileImage) {
            const publicIdWithExtension = employee[0].profileImage.split('/').pop();
            const publicId = `westrance_employee_profiles/${publicIdWithExtension?.split('.')[0]}`;
            await cloudinary.uploader.destroy(publicId);
        }

        return res.status(200).json({
            message: "Employee deleted Successfully",
        })

    } catch (error) {
        console.log("Error deleting employee", error);
        return res.status(500).json({ error: "Server Error" });
    }
}

export const ActiveDeactiveWestranceEmployee = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const { employeeId, status } = req.body

        if (!employeeId || !["Active", "Deactive"].includes(status)) {
            return res.status(400).json({ error: "Missing or Invalid EmployeeId or Status" });
        }

        const isActive = status === "Active"

        await database
            .update(WestranceEmployee)
            .set({ isActive })
            .where(eq(WestranceEmployee.employeeId, employeeId))

        return res.status(200).json({
            message: `Employee ${isActive ? "Activated" : "Deactivated"} Successfully`,
            status: isActive ? "Active" : "Deactive"
        })
    } catch (error) {
        console.log("Active/Deactive employee error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// export const addWestranceDependentController = async (req: AuthenticatedRequestAdmin, res: Response) => {        
//     try {
//         const {
//             FirstName,
//             MiddleName,
//             LastName,
//             EmailAddress,
//             Relation,
//             PhoneNumber,
//             profilePhoto,
//             employeeId
//         } = req.body;

//         if (!FirstName || !LastName || !Relation || !employeeId) {
//             return res.status(400).json({ error: "Missing required fields" });
//         }

//         const [westranceEmployee] = await database
//             .select()
//             .from(WestranceEmployee)
//             .where(eq(WestranceEmployee.employeeId, employeeId));


//         if (!westranceEmployee) {
//             return res.status(404).json({ error: "Employee not found" });
//         }

//         const allowedDependents = westranceEmployee ? Number(westranceEmployee.dependents ?? 0) : 0;

//         // ✅ Step 2: Get current dependents of this employee
//         const existingDependents = await database
//             .select()
//             .from(addWestranceDependents)
//             .where(eq(addWestranceDependents.employeeId, employeeId));

//         const currentDependentCount = existingDependents.length;

//         // ✅ Step 3: Validation
//         if (allowedDependents === 0) {
//             return res.status(400).json({ error: "No dependents allowed for this employee." });
//         }

//         if (currentDependentCount >= allowedDependents) {
//             return res.status(400).json({ error: `Only ${allowedDependents} dependents are allowed.` });
//         }


//         let uploadedImageUrl: string | null = null;
//         if (profilePhoto) {
//             const uploadRes = await cloudinary.uploader.upload(profilePhoto, {
//                 folder: "Westrance_dependents_profiles",
//                 transformation: [{ width: 300, height: 300, crop: "fill" }],
//             });
//             uploadedImageUrl = uploadRes.secure_url;
//         }


//         // ✅ Step 4: Insert
//         await database.insert(addWestranceDependents).values({
//             firstName: FirstName,
//             middleName: MiddleName || null,
//             lastName: LastName,
//             emailAddress: EmailAddress || null,
//             relation: Relation,
//             PhoneNumber: PhoneNumber || null,
//             profileImage: uploadedImageUrl || null,
//             employeeId
//         });

//         return res.status(200).json({
//             message: "Dependent added successfully"
//         });

//     } catch (error: any) {
//         console.error("error", error);
//         return res.status(500).json({ error: "Something went wrong" });
//     }
// };

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

        // if (!Invoices || Invoices.length === 0) {
        //     return res.status(404).json({ message: "No invoice found" });
        // }

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

        // Create a company in-app notification about ticket status update
        const [ticket] = await database
            .select({
                companyId: createTicket.companyId,
                subject: createTicket.subject,
            })
            .from(createTicket)
            .where(eq(createTicket.id, ticketId))

        if (ticket) {
            await database.insert(companyNotifications).values({
                recipientCompanyId: ticket.companyId,
                type: "ticket_status",
                message: `Your ticket (Subject: ${ticket.subject}) has been marked as ${Status}.`,
                isRead: false,
            });
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

        const [ticket] = await database
            .select({
                companyId: createTicket.companyId,
                subject: createTicket.subject,
            })
            .from(createTicket)
            .where(eq(createTicket.id, ticketId))

        await database
            .delete(createTicket)
            .where(eq(createTicket.id, ticketId))

        if (ticket) {
            await database.insert(companyNotifications).values({
                recipientCompanyId: ticket.companyId,
                type: "ticket_removed",
                message: `Your ticket (Subject: ${ticket.subject}) has been removed by the admin.`,
                isRead: false,
            });
        }

        return res.status(200).json({
            message: "Ticket Removed Successfully"
        })
    } catch (error) {
        console.error("Failed to fetch invoices", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}

export const addWestranceEmployeeRoleManagement = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const {
            EmployeeName,
            RoleName,
            RoleDescription,
            Password,
            ConfirmPassword
        } = req.body;

        if (!EmployeeName || !RoleName || !Password || !ConfirmPassword) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (Password !== ConfirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        const [firstName, lastName] = EmployeeName.trim().split(" ");

        if (!firstName || !lastName) {
            return res.status(400).json({ error: "Employee name must include both first and last name" });
        }

        const [employee] = await database
            .select()
            .from(WestranceEmployee)
            .where(
                and(
                    eq(WestranceEmployee.firstName, firstName),
                    eq(WestranceEmployee.lastName, lastName)
                )
            );

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }


        const hashedPassword = await generateBetterAuthPasswordHash(Password);
        const result = await database.insert(WestranceRolesManagement).values({
            employeeId: employee.employeeId,
            EmployeeName,
            RoleName,
            RoleDescription,
            Password: hashedPassword,
            ConfirmPassword: hashedPassword,
        });

        return res.status(200).json({
            data: result,
            message: "Role added successfully"
        });
    } catch (error: any) {
        console.error("error", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}

export const getWestranceDepartment = async (_req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const department = await database.select({ RoleName: WestranceRolesManagement.RoleName, employeeId: WestranceRolesManagement.employeeId }).from(WestranceRolesManagement)
        return res.status(200).json({ department })
    } catch (error: any) {
        console.error("error", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}

export const getAdminNotifications = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id;
        if (!adminId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const notificationsList = await database
            .select()
            .from(notifications)
            .where(eq(notifications.recipientId, adminId))
            .orderBy(desc(notifications.createdAt))
            .limit(10);

        const unreadCount = await database
            .select({ count: sql<number>`count(*)` })
            .from(notifications)
            .where(and(eq(notifications.recipientId, adminId), eq(notifications.isRead, false)));

        return res.status(200).json({
            notifications: notificationsList,
            unreadCount: unreadCount[0]?.count || 0,
        });
    } catch (error) {
        console.error("Failed to fetch admin notifications:", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const updateNotificationStatus = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id;
        if (!adminId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { notificationId } = req.params;
        const { isRead } = req.body;

        if (typeof isRead !== 'boolean') {
            return res.status(400).json({ error: "Invalid 'isRead' status provided" });
        }

        const [updatedNotification] = await database
            .update(notifications)
            .set({ isRead: isRead, updatedAt: new Date() })
            .where(and(eq(notifications.id, notificationId), eq(notifications.recipientId, adminId)))
            .returning();

        if (!updatedNotification) {
            return res.status(404).json({ error: "Notification not found or not authorized" });
        }

        return res.status(200).json({
            message: "Notification status updated successfully",
            notification: updatedNotification,
        });
    } catch (error) {
        console.error("Failed to update notification status:", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const markAllNotificationsAsRead = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id;
        if (!adminId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        await database
            .update(notifications)
            .set({ isRead: true, updatedAt: new Date() })
            .where(eq(notifications.recipientId, adminId));

        return res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Failed to mark all notifications as read:", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const deleteNotification = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id;
        if (!adminId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { notificationId } = req.params;

        const [deletedNotification] = await database
            .delete(notifications)
            .where(and(eq(notifications.id, notificationId), eq(notifications.recipientId, adminId)))
            .returning();

        if (!deletedNotification) {
            return res.status(404).json({ error: "Notification not found or not authorized" });
        }

        return res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.error("Failed to delete notification:", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const getAdminDetail = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id
        if (!adminId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const adminDetail = await database.select().from(admins)
        return res.status(200).json({
            adminDetail
        });
    } catch (error) {
        console.error("Failed to fetch company detail", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}

export const updateAdminDetail = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id;
        const { email, password, profilePhoto } = req.body;

        if (!adminId) {
            return res.status(401).json({ error: "Unauthorized – missing adminId" });
        }

        const existingAdmin = await database
            .select()
            .from(admins)
            .where(eq(admins.id, adminId));

        if (!existingAdmin.length) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        const prevImgUrl = existingAdmin[0].profileImage;
        let profileImg = prevImgUrl || null;

        if (profilePhoto && profilePhoto.startsWith('data:image')) {
            if (prevImgUrl) {
                const parts = prevImgUrl.split('/');
                const publicIdWithExtension = parts[parts.length - 1];
                const publicId = `admin_profiles/${publicIdWithExtension.split('.')[0]}`;
                await cloudinary.uploader.destroy(publicId);
            }

            const uploadResponse = await cloudinary.uploader.upload(profilePhoto, {
                folder: 'admin_profiles',
            });
            profileImg = uploadResponse.secure_url;
            console.log("Uploaded Admin Image URL:", profileImg);
        }

        if (password) {
            const hashedPassword = await generateBetterAuthPasswordHash(password);
            await database
                .update(admins)
                .set({ password: hashedPassword })
                .where(eq(admins.id, adminId));
        }

        const updatedAdminDetail = await database
            .update(admins)
            .set({
                email,
                profileImage: profileImg,
            })
            .where(eq(admins.id, adminId))
            .returning();

        if (updatedAdminDetail.length === 0) {
            return res.status(404).json({ error: "Admin not found or no changes made" });
        }

        return res.status(200).json({
            message: "Admin detail updated successfully",
            updatedAdminDetail: updatedAdminDetail[0],
        });
    } catch (error) {
        console.error("Error updating admin detail:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const adminDashboardStats = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id
        if (!adminId) return res.status(401).json({ error: "Unauthorized" })
        console.log(adminId);

        // total companies not admin company
        const totalCompanies = await database
            .select({ count: sql<number>`count(*)` })
            .from(companyregister)
            .where(and(ne(companyregister.companyId, "COMP-001"), eq(companyregister.isActive, true)))

        // total westrance employees
        const totalWestranceEmployees = await database
            .select({ count: sql<number>`count(*)` })
            .from(WestranceEmployee)

        //  total healthcare providers both hospital and pharmacy
        const totalHealthcareProviders = await database
            .select({ count: sql<number>`count(*)` })
            .from(companyregister)
            .where(or(eq(companyregister.companyType, "Hospital"), eq(companyregister.companyType, "Pharmacy")))

        // total monthly claims
        const totalMonthlyClaims = await database
            .select({ count: sql<number>`count(*)` })
            .from(addEmployeeInvoice)

        return res.status(200).json({
            totalCompanies: totalCompanies[0].count,
            totalWestranceEmployees: totalWestranceEmployees[0].count,
            totalHealthcareProviders: totalHealthcareProviders[0].count,
            totalMonthlyClaims: totalMonthlyClaims[0].count
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Something went wrong" })
    }
}

export const monthlyWestranceUsageAnalytics = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id
        if (!adminId) return res.status(401).json({ error: "Unauthorized" })

        const fromParam = req.query.from as string | undefined;
        const toParam = req.query.to as string | undefined;

        const buildRangeMonths = (fromDate: Date, toDate: Date) => {
            const months: { start: Date; end: Date; label: string }[] = [];
            let current = new Date(startOfMonth(fromDate));
            const last = new Date(endOfMonth(toDate));
            while (current <= last) {
                months.push({
                    start: startOfMonth(current),
                    end: endOfMonth(current),
                    label: current.toLocaleString('default', { month: 'long' })
                });
                current = startOfMonth(subMonths(endOfMonth(current), -1)); // add 1 month
            }
            return months;
        }

        const monthlyUsage = [] as { month: string; desktop: number; mobile: number }[];

        if (fromParam && toParam) {
            const from = new Date(fromParam);
            const to = new Date(toParam);
            const months = buildRangeMonths(from, to);
            for (const m of months) {
                const [countResult] = await database
                    .select({ count: sql<number>`count(*)`.as("count") })
                    .from(companyregister)
                    .where(
                        and(
                            ne(companyregister.companyId, "COMP-001"),
                            sql`${companyregister.createdAt} BETWEEN ${m.start.toISOString()} AND ${m.end.toISOString()}`
                        )
                    );
                monthlyUsage.push({ month: m.label, desktop: countResult.count, mobile: 0 });
            }
        } else {
            for (let i = 11; i >= 0; i--) {
                const date = subMonths(new Date(), i);
                const start = startOfMonth(date);
                const end = endOfMonth(date);
                const monthName = date.toLocaleString('default', { month: 'long' });

                const [countResult] = await database
                    .select({ count: sql<number>`count(*)`.as("count") })
                    .from(companyregister)
                    .where(
                        and(
                            ne(companyregister.companyId, "COMP-001"),
                            sql`${companyregister.createdAt} BETWEEN ${start.toISOString()} AND ${end.toISOString()}`
                        )
                    );
                monthlyUsage.push({ month: monthName, desktop: countResult.count, mobile: 0 });
            }
        }

        return res.status(200).json({
            monthlyUsage
        })

    } catch (error) {
        console.error("Failed to fetch monthly Westrance usage analytics:", error);
        return res.status(500).json({ error: "Something went wrong" })
    }
}

export const getReportsAnalyticsStatistics = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id;
        if (!adminId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Compute totals based on invoices
        const [coveredByInvoice] = await database
            .select({ count: sql<number>`count(*)` })
            .from(addEmployeeInvoice);

        const [medicalCoveredByInvoice] = await database
            .select({ count: sql<number>`count(*)` })
            .from(addEmployeeInvoice)
            .where(sql`(${addEmployeeInvoice.BenefitUsed} ILIKE '%OPD%'
				OR ${addEmployeeInvoice.BenefitUsed} ILIKE '%In-Patient%'
				OR ${addEmployeeInvoice.BenefitUsed} ILIKE '%Medicines%'
				OR ${addEmployeeInvoice.BenefitUsed} ILIKE '%Diagnostic%'
				OR ${addEmployeeInvoice.BenefitUsed} ILIKE '%Dental%'
				OR ${addEmployeeInvoice.BenefitUsed} ILIKE '%Vision%')`);

        const totalEmployeesCovered = {
            count: Number(coveredByInvoice?.count || 0)
        };

        const totalMedicalCovered = {
            count: Number(medicalCoveredByInvoice?.count || 0)
        };

        // Get total benefits utilized (sum of all invoice amounts)
        const totalBenefitsUtilizedResult = await database
            .select({ total: sql<number>`SUM(CAST(${addEmployeeInvoice.Amount} AS REAL))`.mapWith(Number) })
            .from(addEmployeeInvoice);

        const totalBenefitsUtilized = totalBenefitsUtilizedResult[0]?.total || 0;

        // Get total available benefits (sum of all employee amount packages from all types)
        const [regularBenefits, hospitalBenefits, westranceBenefits] = await Promise.all([
            database
                .select({ total: sql<number>`SUM(CAST(${addEmployee.amountPackage} AS REAL))`.mapWith(Number) })
                .from(addEmployee)
                .where(eq(addEmployee.isActive, true)),

            database
                .select({ total: sql<number>`SUM(CAST(${addHospitalEmployee.amountPackage} AS REAL))`.mapWith(Number) })
                .from(addHospitalEmployee)
                .where(eq(addHospitalEmployee.isActive, true)),

            database
                .select({ total: sql<number>`SUM(CAST(${WestranceEmployee.amountPackage} AS REAL))`.mapWith(Number) })
                .from(WestranceEmployee)
                .where(eq(WestranceEmployee.isActive, true))
        ]);

        const totalAvailableBenefits = Number(regularBenefits[0]?.total || 0) + Number(hospitalBenefits[0]?.total || 0) + Number(westranceBenefits[0]?.total || 0);

        // Calculate average utilization rate
        let averageUtilizationRate = 0;
        if (totalAvailableBenefits > 0) {
            averageUtilizationRate = (totalBenefitsUtilized / totalAvailableBenefits) * 100;
        }

        // Format the currency (assuming GHS)
        const formatCurrency = (amount: number) => {
            return `₵ ${amount.toLocaleString()}`;
        };

        return res.status(200).json({
            message: "Statistics retrieved successfully",
            statistics: {
                totalEmployeesCovered: totalEmployeesCovered.count.toLocaleString(),
                totalMedicalCovered: totalMedicalCovered.count.toLocaleString(),
                totalBenefitsUtilized: formatCurrency(totalBenefitsUtilized),
                averageUtilizationRate: `${averageUtilizationRate.toFixed(2)}%`
            },
            rawStatistics: {
                totalEmployeesCovered: totalEmployeesCovered.count,
                totalMedicalCovered: totalMedicalCovered.count,
                totalBenefitsUtilized: totalBenefitsUtilized,
                averageUtilizationRate: averageUtilizationRate
            }
        });

    } catch (error) {
        console.error("Failed to fetch reports analytics statistics:", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};


export const getTopCompaniesBySpend = async (req: AuthenticatedRequestAdmin, res: Response) => {
    try {
        const adminId = req.admin?.id;
        if (!adminId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const limit = parseInt(req.query.limit as string) || 5;

        const topCompanies = await database
            .select({
                companyId: companyregister.companyId,
                companyName: companyregister.companyName,
                companyType: companyregister.companyType,
                totalSpend: sql<number>`SUM(CAST(${addEmployeeInvoice.Amount} AS REAL))`.mapWith(Number),
            })
            .from(addEmployeeInvoice)
            .leftJoin(
                companyregister,
                eq(addEmployeeInvoice.employerCompanyId, companyregister.companyId)
            )
            .groupBy(
                addEmployeeInvoice.employerCompanyId,
                companyregister.companyId,
                companyregister.companyName,
                companyregister.companyType,
            )
            .orderBy(desc(sql`SUM(CAST(${addEmployeeInvoice.Amount} AS REAL))`))
            .limit(limit);

        return res.status(200).json({ topCompanies });
    } catch (error) {
        console.error("Failed to fetch top companies by spend:", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}

