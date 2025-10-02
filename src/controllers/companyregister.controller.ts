import { database } from "@/configs/connection.config";
import { companyregister, users, account, addEmployee, addDependents, addEmployeeInvoice, addHospitalEmployee, companyNotifications } from "@/schema/schema";
import { logger } from "@/utils/logger.util";
import { Request, Response } from "express";
import { eq, sql, or } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { generateBetterAuthPasswordHash } from "@/utils/password-hash.util";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import cloudinary from "@/configs/cloudniary.config";
// import { CompanySignInResponse, User } from "@/types/api";
export interface companyRegister {
    companyName: string;
    companyType: string;
    industry?: string;
    registrationNumber: string;
    numberOfEmployees: number;
    region: string;
    city: string;
    address: string;
    website?: string;
    administrativeFullName: string;
    administrativeEmail: string;
    createpassword: string;
    confirmPassword: string;
    profileImage?: string;
    termAccepted: boolean
}

export const companyRegisterController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {
            companyName,
            companyType,
            industry,
            registrationNumber,
            numberOfEmployees,
            region,
            city,
            address,
            website,
            administrativeName,
            administrativeEmail,
            createPassword,
            confirmPassword,
            profileImage,
            termAccepted
        } = req.body
        console.log(req.body)
        // Generate proper password hash for Better-Auth
        const hashedPassword = await generateBetterAuthPasswordHash(createPassword);

        if (!companyName || !companyType || !registrationNumber || !numberOfEmployees || !region || !city ||
            !address || !administrativeName || !administrativeEmail || !createPassword || !confirmPassword || !termAccepted) {
            return res.status(400).json({ error: "missing required fields" })
        }

        if (createPassword !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        let uploadedImageUrl: string | null = null;
        if (profileImage && profileImage.startsWith("data:image")) {
            const uploadResult = await cloudinary.uploader.upload(profileImage, {
                folder: "company_profiles",
                transformation: [{ width: 300, height: 300, crop: "fill" }],
            });
            uploadedImageUrl = uploadResult.secure_url;
        }

        // Check if user already exists
        const existingUser = await database.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            emailVerified: users.emailVerified,
            image: users.image,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt
        }).from(users).where(eq(users.email, administrativeEmail)).limit(1);

        let userId: string;

        if (existingUser.length > 0) {
            // User exists, use existing user ID
            userId = existingUser[0].id;

            // Update the existing user's role to Company if needed
            if (existingUser[0].role !== "CompanyAdmin") {
                await database
                    .update(users)
                    .set({ role: "CompanyAdmin" })
                    .where(eq(users.id, userId));
            }
        } else {
            // Create new user WITHOUT password - Better-Auth will handle password management
            userId = createId();

            // Create user WITHOUT password - Better-Auth will handle this
            await database.insert(users).values({
                id: userId,
                name: administrativeName,
                email: administrativeEmail,
                role: "CompanyAdmin",
                emailVerified: false,
                image: uploadedImageUrl || null,
            });


            // Create account entry for Better-Auth with proper password hash
            await database.insert(account).values({
                id: createId(),
                accountId: administrativeEmail,
                providerId: "credential",
                userId: userId,
                password: hashedPassword, // Store properly hashed password
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        // Check if company already exists
        const existingCompany = await database
            .select()
            .from(companyregister)
            .where(eq(companyregister.administrativeEmail, administrativeEmail))
            .limit(1);

        if (existingCompany.length > 0) {
            return res.status(400).json({ error: "Company with this email already exists" });
        }


        await database.insert(companyregister).values({
            companyId: userId,
            companyName,
            companyType,
            industry,
            registrationNumber,
            numberOfEmployees,
            region,
            city,
            address,
            website,
            administrativeName,
            administrativeEmail,
            createPassword: hashedPassword, // Store original password for reference only
            confirmPassword: hashedPassword, // Store original password for reference only
            profileImage: uploadedImageUrl || null,
            termsAccepted: termAccepted,
        }).returning()

        return res.status(200).json({
            message: "Company registered successfully",
            note: existingUser.length > 0
                ? "Used existing user account"
                : "Created new user account with properly hashed password.",
            instructions: "User can now sign in directly with their password."
        });
    } catch (error) {
        logger.error("Company registration error:", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const getCompanyEmployees = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit
        const employees = await database
            .select()
            .from(addEmployee)
            .where(eq(addEmployee.companyUserId, userId))
            .limit(limit)
            .offset(offset)

        const [{ count }] = await database
            .select({ count: sql<number>`count(*)` })
            .from(addEmployee)
            .where(eq(addEmployee.companyUserId, userId))

        return res.status(200).json({
            employees,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error("Failed to fetch employees", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}

export const getEmployeeWithDependents = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params
        if (!id) return res.status(400).json({ error: "Missing EmployeeId" })

        const employee = await database
            .select()
            .from(addEmployee)
            .where(eq(addEmployee.employeeId, id))

        const dependents = await database
            .select()
            .from(addDependents)
            .where(eq(addDependents.employeeId, id))


        if (!employee.length) {
            return res.status(404).json({ error: "Employee Not Found" })
        }
        return res.status(200).json({
            employee: employee[0],
            dependents,
        })
    } catch (error) {
        console.error("Error fetching employee + dependents", error);
        return res.status(500).json({ error: "Server Error" });
    }
}

export const editEmployee = async (req: Request, res: Response) => {
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
            .from(addEmployee)
            .where(eq(addEmployee.employeeId, employeeId));

        const prevImgUrl = existingEmployee[0].profileImage
        let profileImg = prevImgUrl;

        if (profilePhoto) {
            const isBase64 = profilePhoto.startsWith("data:image");

            if (isBase64) {
                // Remove old image if it exists
                if (prevImgUrl) {
                    const parts = prevImgUrl.split('/');
                    const publicIdWithExtension = parts[parts.length - 1];
                    const publicId = `employee_profiles/${publicIdWithExtension.split('.')[0]}`;
                    await cloudinary.uploader.destroy(publicId);
                }

                // Upload new image
                const uploadResponse = await cloudinary.uploader.upload(profilePhoto, {
                    folder: 'employee_profiles',
                    transformation: [{ width: 300, height: 300, crop: "fill" }],
                });

                profileImg = uploadResponse.secure_url;
            } else {
                // Image is already a Cloudinary URL, use as-is
                profileImg = profilePhoto;
            }
        }

        const updateEmployee = await database.update(addEmployee).set({
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
        }).where(eq(addEmployee.employeeId, employeeId)).returning()

        return res.status(200).json({
            message: "Employee updated Successfully",
            updateEmployee
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server Error" });
    }
}

export const deleteEmployee = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ error: "Missing EmployeeId" });

        // Step 1: Fetch dependents before deleting
        const dependents = await database
            .select()
            .from(addDependents)
            .where(eq(addDependents.employeeId, id));

        // Step 2: Delete dependents
        await database
            .delete(addDependents)
            .where(eq(addDependents.employeeId, id));

        // Step 3: Delete employee (and fetch for profile image)
        const employee = await database
            .delete(addEmployee)
            .where(eq(addEmployee.employeeId, id))
            .returning();

        if (employee.length > 0) {
            const email = employee[0].emailAddress;

            // Step 3.1: Delete from account table
            await database.delete(account).where(eq(account.accountId, email));

            // Step 3.2: Delete from users table
            await database.delete(users).where(eq(users.email, email));
        }

        // Step 4: Delete employee image from Cloudinary
        if (employee.length > 0 && employee[0]?.profileImage) {
            const publicIdWithExtension = employee[0].profileImage.split('/').pop();
            const publicId = `employee_profiles/${publicIdWithExtension?.split('.')[0]}`;
            await cloudinary.uploader.destroy(publicId);
        }

        // Step 5: Delete dependents' images from Cloudinary
        if (dependents.length > 0) {
            await Promise.all(
                dependents.map(dep => {
                    const publicIdWithExtension = dep?.profileImage?.split('/').pop();
                    const publicId = `dependents_profiles/${publicIdWithExtension?.split('.')[0]}`;
                    return cloudinary.uploader.destroy(publicId);
                })
            );
        }

        return res.status(200).json({
            message: "Employee and Dependents Deleted Successfully"
        });

    } catch (error) {
        console.error("Error deleting employee", error);
        return res.status(500).json({ error: "Server Error" });
    }
};

export const ActiveDeactiveemployee = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { employeeId, status } = req.body;

        if (!employeeId || !["Active", "Deactive"].includes(status)) {
            return res.status(400).json({ error: "Missing or invalid employeeId or status" });
        }

        const isActive = status === "Active";


        await database
            .update(addEmployee)
            .set({ isActive })
            .where(eq(addEmployee.employeeId, employeeId));

        return res.status(200).json({
            message: `Employee ${isActive ? "Activated" : "Deactivated"} successfully`,
            status: isActive ? "Active" : "Deactive",
        });
    } catch (error) {
        console.error("Active/Deactive employee error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getHospitalPharmacy = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        // Paginated data
        const companyDetail = await database
            .select()
            .from(companyregister)
            .where(
                or(
                    eq(companyregister.companyType, "Hospital"),
                    eq(companyregister.companyType, "Pharmacy")
                )
            )
            .limit(limit)
            .offset(offset);

        // Total Hospital count
        const [{ hospitalCount }] = await database
            .select({ hospitalCount: sql<number>`count(*)`.mapWith(Number) })
            .from(companyregister)
            .where(eq(companyregister.companyType, "Hospital"));

        // Total Pharmacy count
        const [{ pharmacyCount }] = await database
            .select({ pharmacyCount: sql<number>`count(*)`.mapWith(Number) })
            .from(companyregister)
            .where(eq(companyregister.companyType, "Pharmacy"));

        // Total records (Hospital + Pharmacy)
        const total = hospitalCount + pharmacyCount;

        return res.status(200).json({
            companyDetail,
            Hospitalcount: hospitalCount,
            Pharmacycount: pharmacyCount,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Failed to fetch company detail", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const getCompanyDetail = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const companyDetail = await database.select().from(companyregister).where(eq(companyregister.companyId, userId))
        return res.status(200).json({
            companyDetail
        });
    } catch (error) {
        console.error("Failed to fetch company detail", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}

export const updateCompanyDetail = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const companyId = req.user?.userId
        const {
            companyName,
            companyType,
            industry,
            registrationNumber,
            numberOfEmployees,
            region,
            city,
            address,
            website,
            administrativeFullName,
            administrativeEmail,
            createpassword,
            profilePhoto
        } = req.body
        console.log(req.body)
        if (!companyId) {
            return res.status(401).json({ error: "Unauthorized – missing companyId" });
        }

        const existingCompany = await database
            .select()
            .from(companyregister)
            .where(eq(companyregister.companyId, companyId));

        if (!existingCompany.length) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const prevImgUrl = existingCompany[0].profileImage
        let profileImg = prevImgUrl

        if (profilePhoto && profilePhoto.startsWith('data:image')) {
            if (prevImgUrl) {
                const parts = prevImgUrl.split('/');
                const publicIdWithExtension = parts[parts.length - 1];
                const publicId = `company_profiles/${publicIdWithExtension.split('.')[0]}`;
                await cloudinary.uploader.destroy(publicId)
            }

            const uploadResponse = await cloudinary.uploader.upload(profilePhoto, {
                folder: 'company_profiles'
            })
            profileImg = uploadResponse.secure_url
            console.log("Uploaded Image URL:", profileImg);
        }


        if (createpassword) {
            const hashedPassword = await generateBetterAuthPasswordHash(createpassword);
            await database
                .update(account)
                .set({ password: hashedPassword })
                .where(eq(account.userId, companyId));
        }

        const updatedCompanyDetail = await database
            .update(companyregister)
            .set({
                companyName,
                companyType,
                industry,
                registrationNumber,
                numberOfEmployees,
                region,
                city,
                address,
                website,
                administrativeName: administrativeFullName,
                administrativeEmail,
                // createPassword,
                // confirmPassword,
                profileImage: profileImg
            })
            .where(eq(companyregister.companyId, companyId))
            .returning();

        if (updatedCompanyDetail.length === 0) {
            return res.status(404).json({ error: "Company not found or no changes made" });
        }

        return res.status(200).json({
            message: "Company detail updated successfully",
            updatedCompanyDetail: updatedCompanyDetail[0],
        });
    } catch (error) {
        console.error("Error updating company detail:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const getCompanyEmployeesWithDependentsCount = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const employees = await database
            .select()
            .from(addEmployee)
            .where(eq(addEmployee.companyUserId, userId));

        const allDependents = await database
            .select()
            .from(addDependents);

        const employeesWithDependents = employees.map((emp) => {
            const dependents = allDependents.filter(d => d.employeeId === emp.employeeId);
            return {
                ...emp,
                dependents,
            };
        }).filter(emp => emp.dependents.length > 0)

        return res.status(200).json({
            count: employeesWithDependents.length
        });
    } catch (error) {
        console.error("Failed to fetch employees + dependents", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const getInvoiceByCompany = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const invoices = await database
            .select({
                id: addEmployeeInvoice.id,
                EmployeeId: addEmployeeInvoice.EmployeeId,
                employerCompanyId: addEmployeeInvoice.employerCompanyId,
                companyId: addEmployeeInvoice.companyId,
                HospitalName: addEmployeeInvoice.HospitalName,
                PatientName: addEmployeeInvoice.PatientName,
                Amount: addEmployeeInvoice.Amount,
                RemainingBalance: addEmployeeInvoice.RemainingBalance,
                BenefitUsed: addEmployeeInvoice.BenefitUsed,
                SubmittedDate: addEmployeeInvoice.SubmittedDate,
                employeeAmountPackage: addEmployee.amountPackage,
                hospitalEmployeeAmountPackage: addHospitalEmployee.amountPackage,
            })
            .from(addEmployeeInvoice)
            .leftJoin(addEmployee, eq(addEmployeeInvoice.EmployeeId, addEmployee.employeeId))
            .leftJoin(addHospitalEmployee, eq(addEmployeeInvoice.EmployeeId, addHospitalEmployee.employeeId))
            .where(eq(addEmployeeInvoice.employerCompanyId, user.userId))
            .offset(offset)
            .limit(limit);

        const totalInvoices = await database
            .select({ count: sql<number>`count(*)`.as("count") })
            .from(addEmployeeInvoice)
            .where(eq(addEmployeeInvoice.employerCompanyId, user.userId));

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

// ================= Company Notifications ================= //
export const getCompanyNotifications = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const companyId = req.user?.userId;
        if (!companyId) return res.status(401).json({ error: "Unauthorized" });

        const notificationsList = await database
            .select()
            .from(companyNotifications)
            .where(eq(companyNotifications.recipientCompanyId, companyId))
            .orderBy(sql`"created_at" DESC`)
            .limit(10);

        const unread = await database
            .select({ count: sql<number>`count(*)`.as("count") })
            .from(companyNotifications)
            .where(sql`${companyNotifications.recipientCompanyId} = ${companyId} AND ${companyNotifications.isRead} = false`);

        return res.status(200).json({
            notifications: notificationsList,
            unreadCount: unread[0]?.count || 0,
        });
    } catch (error) {
        console.error("Failed to fetch company notifications:", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const updateCompanyNotificationStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const companyId = req.user?.userId;
        if (!companyId) return res.status(401).json({ error: "Unauthorized" });
        const { notificationId } = req.params;
        const { isRead } = req.body;

        if (typeof isRead !== 'boolean') {
            return res.status(400).json({ error: "Invalid 'isRead' status provided" });
        }

        const [updated] = await database
            .update(companyNotifications)
            .set({ isRead, updatedAt: new Date() })
            .where(sql`${companyNotifications.id} = ${notificationId} AND ${companyNotifications.recipientCompanyId} = ${companyId}`)
            .returning();

        if (!updated) {
            return res.status(404).json({ error: "Notification not found or not authorized" });
        }

        return res.status(200).json({ message: "Notification status updated successfully" });
    } catch (error) {
        console.error("Failed to update company notification status:", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const markAllCompanyNotificationsAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const companyId = req.user?.userId;
        if (!companyId) return res.status(401).json({ error: "Unauthorized" });

        await database
            .update(companyNotifications)
            .set({ isRead: true, updatedAt: new Date() })
            .where(eq(companyNotifications.recipientCompanyId, companyId));

        return res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Failed to mark all company notifications as read:", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const deleteCompanyNotification = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const companyId = req.user?.userId;
        if (!companyId) return res.status(401).json({ error: "Unauthorized" });
        const { notificationId } = req.params;

        const [deleted] = await database
            .delete(companyNotifications)
            .where(sql`${companyNotifications.id} = ${notificationId} AND ${companyNotifications.recipientCompanyId} = ${companyId}`)
            .returning();

        if (!deleted) {
            return res.status(404).json({ error: "Notification not found or not authorized" });
        }

        return res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.error("Failed to delete company notification:", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const getCompanyAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const monthlyAnalytics = await database
            .select({
                month: sql<string>`TO_CHAR(${addEmployee.startingDate}, 'Month')`,
                totalEmployees: sql<number>`COUNT(DISTINCT ${addEmployee.employeeId})`.as('totalEmployees'),
                employeesWithDependents: sql<number>`COUNT(DISTINCT ${addEmployee.employeeId}) FILTER (WHERE ${addDependents.dependentId} IS NOT NULL)`.as('employeesWithDependents'),
            })
            .from(addEmployee)
            .leftJoin(addDependents, eq(addEmployee.employeeId, addDependents.employeeId))
            .where(eq(addEmployee.companyUserId, userId))
            .groupBy(sql`TO_CHAR(${addEmployee.startingDate}, 'Month')`)
            .orderBy(sql`MIN(${addEmployee.startingDate})`);

        const result = [
            { month: "January", totalEmployees: 0, employeesWithDependents: 0 },
            { month: "February", totalEmployees: 0, employeesWithDependents: 0 },
            { month: "March", totalEmployees: 0, employeesWithDependents: 0 },
            { month: "April", totalEmployees: 0, employeesWithDependents: 0 },
            { month: "May", totalEmployees: 0, employeesWithDependents: 0 },
            { month: "June", totalEmployees: 0, employeesWithDependents: 0 },
            { month: "July", totalEmployees: 0, employeesWithDependents: 0 },
            { month: "August", totalEmployees: 0, employeesWithDependents: 0 },
            { month: "September", totalEmployees: 0, employeesWithDependents: 0 },
            { month: "October", totalEmployees: 0, employeesWithDependents: 0 },
            { month: "November", totalEmployees: 0, employeesWithDependents: 0 },
            { month: "December", totalEmployees: 0, employeesWithDependents: 0 },
        ];

        monthlyAnalytics.forEach(data => {
            const monthIndex = result.findIndex(m => m.month === data.month);
            if (monthIndex !== -1) {
                result[monthIndex].totalEmployees = data.totalEmployees;
                result[monthIndex].employeesWithDependents = data.employeesWithDependents;
            }
        });

        return res.status(200).json({
            data: result
        });
    } catch (error) {
        console.error("Failed to fetch company analytics", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}

export const getCompanyDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Total Employees
        const employees = await database
            .select({ count: sql<number>`count(*)` })
            .from(addEmployee)
            .where(eq(addEmployee.companyUserId, userId));

        // Total Employees with Dependents
        const employeesWithDependents = await database
            .select({ count: sql<number>`count(DISTINCT ${addEmployee.employeeId})` })
            .from(addEmployee)
            .leftJoin(addDependents, eq(addEmployee.employeeId, addDependents.employeeId))
            .where(sql`${addDependents.dependentId} IS NOT NULL AND ${addEmployee.companyUserId} = ${userId}`);

        // Connected Hospitals
        const hospitals = await database
            .select({ count: sql<number>`count(*)` })
            .from(companyregister)
            .where(eq(companyregister.companyType, "Hospital"));

        // Connected Pharmacies
        const pharmacies = await database
            .select({ count: sql<number>`count(*)` })
            .from(companyregister)
            .where(eq(companyregister.companyType, "Pharmacy"));

        return res.status(200).json({
            employees: employees[0].count,
            employeesWithDependents: employeesWithDependents[0].count,
            hospitals: hospitals[0].count,
            pharmacies: pharmacies[0].count,
        });
    } catch (error) {
        console.error("Failed to fetch company dashboard stats", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}

export const getcompanyReportAnalyticsStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
       const userId = req.user?.userId;
       if(!userId) return res.status(401).json({ error: "Unauthorized" });


    const totalEmployeesCovered = await database
        .select({ count: sql<number>`count(DISTINCT ${addEmployee.employeeId})` })
        .from(addEmployee)
        .where(eq(addEmployee.companyUserId, userId));

    const totalMedicalCovered = await database
        .select({ count: sql<number>`count(*)` })
        .from(addEmployee)
        .where(sql`${addEmployee.benefits} LIKE '%Medical%' AND ${addEmployee.companyUserId} = ${userId}`);

    const totalBenefitsUtilizedResult = await database
        .select({ total: sql<number>`SUM(CAST(${addEmployeeInvoice.Amount} AS REAL))`.mapWith(Number) })
        .from(addEmployeeInvoice)
        .where(eq(addEmployeeInvoice.employerCompanyId, userId));

    const totalBenefitsUtilized = totalBenefitsUtilizedResult[0]?.total || 0;

    const totalAvailableBenefitsResult = await database
        .select({ total: sql<number>`SUM(CAST(${addEmployee.amountPackage} AS REAL))`.mapWith(Number) })
        .from(addEmployee)
        .where(eq(addEmployee.companyUserId, userId));

    const totalAvailableBenefits = totalAvailableBenefitsResult[0]?.total || 0;

    let averageUtilizationRate = 0;
    if (totalAvailableBenefits > 0) {
        averageUtilizationRate = (totalBenefitsUtilized / totalAvailableBenefits) * 100;
    }

    return res.status(200).json({
        totalEmployeesCovered: totalEmployeesCovered[0].count,
        totalMedicalCovered: totalMedicalCovered[0].count,
        totalBenefitsUtilized: totalBenefitsUtilized.toFixed(2),
        averageUtilizationRate: averageUtilizationRate.toFixed(2) + '%',
    });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}