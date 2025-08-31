import cloudinary from "@/configs/cloudniary.config";
import { database } from "@/configs/connection.config";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { HospitalRolesManagement, account, addDependents, addEmployee, addHospitalDependents, addHospitalEmployee, users, addEmployeeInvoice } from "@/schema/schema";
import generateEmployeeId from "@/utils/generate.employeeid";
import { generateBetterAuthPasswordHash } from "@/utils/password-hash.util";
import { createId } from "@paralleldrive/cuid2";
import { and, or, eq, ilike } from "drizzle-orm";
import { Request, Response } from "express";
import PDFDocument from "pdfkit";




export const SearchPatientById = async (req: Request, res: Response) => {
    try {
        // search query
        const { patientId } = req.query;
        if (!patientId || typeof patientId !== 'string') {
            return res.status(400).json({ message: "Patient ID is required" });
        }

        // validate query
        if (!patientId) {
            return res.status(400).json({ message: "Patient ID is required" });
        }
        // find patient by ID
        const [employee] = await database.select().from(addEmployee).where(eq(addEmployee.employeeId, patientId));

        const [hospitalemployee] = await database.select().from(addHospitalEmployee).where(eq(addHospitalEmployee.employeeId, patientId));

        // console.log(employee, hospitalemployee)

        if (!employee && !hospitalemployee) {
            return res.status(404).json({ message: "Patient not found" });
        }
        const dependents = await database.select().from(addDependents).where(eq(addDependents.employeeId, patientId));
        const hospitalemployeedependents = await database.select().from(addHospitalDependents).where(eq(addHospitalDependents.employeeId, patientId));
        // return patient and dependents data
        return res.status(200).json({
            employee,
            hospitalemployee,
            dependents,
            hospitalemployeedependents
        });

    } catch (error) {
        console.error("Error searching patient by ID:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// export const addHospitalEmployeeController = async (req: AuthenticatedRequest, res: Response) => {
//     try {
//         const {
//             firstName,
//             middleName,
//             lastName,
//             email,
//             companyContact,
//             startingDate,
//             duration,
//             amount,
//             benefits,
//             password,
//             confirmPassword,
//             dependents,
//             profilePhoto
//         } = req.body
//         if (!firstName || !lastName || !email || !companyContact || !startingDate || !duration || !amount || !benefits || !password || !confirmPassword) {
//             return res.status(400).json({ error: "Missing required fileds" })
//         }

//         if (password !== confirmPassword) {
//             return res.status(400).json({ error: "Password do not match" })
//         }


//         let uploadedImageUrl: string | null = null;
//         if (profilePhoto) {
//             const uploadRes = await cloudinary.uploader.upload(profilePhoto, {
//                 folder: "Hospital_Employees_Profiles",
//                 transformation: [{ width: 300, height: 300, crop: "fill" }],
//             });
//             uploadedImageUrl = uploadRes.secure_url;
//         }

//         const existinguser = await database
//             .select({
//                 id: users.id,
//                 name: users.name,
//                 email: users.email,
//                 role: users.role,
//                 emailVerified: users.emailVerified,
//                 image: users.image,
//                 createdAt: users.createdAt,
//                 updatedAt: users.updatedAt
//             })
//             .from(users)
//             .where(eq(users.email, email))
//             .limit(1)

//         let userId: string;

//         if (existinguser.length > 0) {
//             // User exists, use existing user ID
//             userId = existinguser[0].id;

//             // Update the existing user's role to Employee if needed
//             if (existinguser[0].role !== "Hospital Employee") {
//                 await database
//                     .update(users)
//                     .set({ role: "Hospital Employee" })
//                     .where(eq(users.id, userId));
//             }
//         } else {
//             // Create new user WITHOUT password - Better-Auth will handle password management
//             const fullName = middleName ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`;

//             userId = createId();

//             // Create user WITHOUT password - Better-Auth will handle this
//             await database.insert(users).values({
//                 id: userId,
//                 name: fullName,
//                 email,
//                 // password: null, // Don't store password - Better-Auth handles this
//                 role: "Hospital Employee",
//                 emailVerified: false,
//                 image: uploadedImageUrl || null,
//             });

//             // Generate proper password hash for Better-Auth
//             const hashedPassword = await generateBetterAuthPasswordHash(password);

//             // Create account entry for Better-Auth with proper password hash
//             await database.insert(account).values({
//                 id: createId(),
//                 accountId: email,
//                 providerId: "credential",
//                 userId: userId,
//                 password: hashedPassword, // Store properly hashed password
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//             });
//         }

//         const existingEmployee = await database
//             .select()
//             .from(addHospitalEmployee)
//             .where(eq(addHospitalEmployee.emailAddress, email))
//             .limit(1);

//         if (existingEmployee.length > 0) {
//             return res.status(400).json({ error: "Hospital Employee with this email already exists" });
//         }

//         const employeeId = generateEmployeeId();
//         const hashedPassword = await generateBetterAuthPasswordHash(password);
//         const insertedHospitalEmployess = await database.insert(addHospitalEmployee).values({
//             id: createId(),
//             userId,
//             companyUserId: req.user?.userId!,
//             employeeId,
//             firstName,
//             middleName,
//             lastName,
//             emailAddress: email,
//             registrationNumber: companyContact,
//             startingDate: new Date(startingDate),
//             duration,
//             amountPackage: amount,
//             benefits,
//             createPassword: hashedPassword,
//             profileImage: uploadedImageUrl || null,
//             dependents,
//             role: "Hospital Employee",
//         }).returning();

//         return res.status(200).json({
//             message: "Hospital Employee added successfully",
//             data: {
//                 employee: insertedHospitalEmployess[0]
//             },
//         });
//     } catch (error) {
//         console.error("Error adding hospital employee:", error);
//         return res.status(500).json({ message: "Internal server error" });
//     }
// }


// export const getHospitalEmployees = async (req: AuthenticatedRequest, res: Response) => {
//     try {
//         const userId = req.user?.userId;

//         if (!userId) {
//             return res.status(401).json({ error: "Unauthorized" });
//         }


//         const employees = await database
//             .select()
//             .from(addHospitalEmployee)
//             .where(eq(addHospitalEmployee.companyUserId, userId));

//         return res.status(200).json({
//             employees,
//             count: employees.length
//         });
//     } catch (error) {
//         console.error("Failed to fetch employees", error);
//         return res.status(500).json({ error: "Something went wrong" });
//     }
// }

export const addHospitalEmployeeController = async (req: AuthenticatedRequest, res: Response) => {
    try {
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
            profilePhoto
        } = req.body;

        if (
            !firstName || !lastName || !email || !companyContact ||
            !startingDate || !duration || !amount || !benefits ||
            !password || !confirmPassword
        ) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        // ✅ Upload image if provided
        let uploadedImageUrl: string | null = null;
        if (profilePhoto) {
            const uploadRes = await cloudinary.uploader.upload(profilePhoto, {
                folder: "Hospital_Employees_Profiles",
                transformation: [{ width: 300, height: 300, crop: "fill" }],
            });
            uploadedImageUrl = uploadRes.secure_url;
        }

        const existinguser = await database
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

        if (existinguser.length > 0) {
            userId = existinguser[0].id;

            if (existinguser[0].role !== "Hospital Employee") {
                await database
                    .update(users)
                    .set({ role: "Hospital Employee" })
                    .where(eq(users.id, userId));
            }
        } else {
            const fullName = middleName
                ? `${firstName} ${middleName} ${lastName}`
                : `${firstName} ${lastName}`;

            userId = createId();

            await database.insert(users).values({
                id: userId,
                name: fullName,
                email,
                role: "Hospital Employee",
                emailVerified: false,
                image: uploadedImageUrl || null,
            });

            // Generate password hash for Better-Auth
            const hashedPassword = await generateBetterAuthPasswordHash(password);

            await database.insert(account).values({
                id: createId(),
                accountId: email,
                providerId: "credential",
                userId: userId,
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        const existingEmployee = await database
            .select()
            .from(addHospitalEmployee)
            .where(eq(addHospitalEmployee.emailAddress, email))
            .limit(1);

        if (existingEmployee.length > 0) {
            return res.status(400).json({ error: "Hospital Employee with this email already exists" });
        }

        let companyUserId = req.user?.userId!;

        if (req.user?.role === "Hospital Employee") {
            const [employeeData] = await database
                .select({ companyUserId: addHospitalEmployee.companyUserId })
                .from(addHospitalEmployee)
                .where(eq(addHospitalEmployee.userId, req.user?.userId!));

            if (!employeeData) {
                return res.status(404).json({ error: "Parent company not found for this employee" });
            }

            companyUserId = employeeData.companyUserId;
        }

        // ✅ Insert employee
        const employeeId = generateEmployeeId();
        const hashedPassword = await generateBetterAuthPasswordHash(password);

        const insertedHospitalEmployees = await database.insert(addHospitalEmployee).values({
            id: createId(),
            userId,
            companyUserId,
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
            role: "Hospital Employee",
        }).returning();

        return res.status(200).json({
            message: "Hospital Employee added successfully",
            data: {
                employee: insertedHospitalEmployees[0]
            },
        });
    } catch (error) {
        console.error("Error adding hospital employee:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getHospitalEmployees = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        let employees;

        if (userRole === "CompanyAdmin") {
            employees = await database
                .select()
                .from(addHospitalEmployee)
                .where(eq(addHospitalEmployee.companyUserId, userId));
        }
        else if (userRole === "Hospital Employee") {
            const [employeeData] = await database
                .select({ companyUserId: addHospitalEmployee.companyUserId })
                .from(addHospitalEmployee)
                .where(eq(addHospitalEmployee.userId, userId));

            if (!employeeData) {
                return res.status(404).json({ error: "Employee not found" });
            }

            employees = await database
                .select()
                .from(addHospitalEmployee)
                .where(eq(addHospitalEmployee.companyUserId, employeeData.companyUserId));
        } else {
            return res.status(403).json({ error: "Forbidden" });
        }

        return res.status(200).json({
            employees,
            count: employees.length
        });
    } catch (error) {
        console.error("Failed to fetch employees", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const getHospitalEmployeesWithDependents = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params
        if (!id) return res.status(400).json({ error: "Missing EmployeeId" })
        const employee = await database
            .select()
            .from(addHospitalEmployee)
            .where(eq(addHospitalEmployee.employeeId, id))

        const dependents = await database
            .select()
            .from(addHospitalDependents)
            .where(eq(addHospitalDependents.employeeId, id))

        if (!employee.length) {
            return res.status(404).json({ error: "Employee Not Found" })
        }

        return res.status(200).json({
            employee: employee[0],
            dependents
        })

    } catch (error) {
        console.log("Error fetching employee With dependents", error);
        return res.status(500).json({ error: "Server Error" });
    }
}

export const editHospitalEmployee = async (req: AuthenticatedRequest, res: Response) => {
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
            .from(addHospitalEmployee)
            .where(eq(addHospitalEmployee.employeeId, employeeId));

        const prevImgUrl = existingEmployee[0].profileImage
        let profileImg = prevImgUrl;

        if (profilePhoto) {
            const isBase64 = profilePhoto.startsWith("data:image");

            if (isBase64) {
                // Remove old image if it exists
                if (prevImgUrl) {
                    const parts = prevImgUrl.split('/');
                    const publicIdWithExtension = parts[parts.length - 1];
                    const publicId = `Hospital_Employees_Profiles/${publicIdWithExtension.split('.')[0]}`;
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

        const updateEmployee = await database.update(addHospitalEmployee).set({
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
        }).where(eq(addHospitalEmployee.employeeId, employeeId)).returning()

        return res.status(200).json({
            message: "Employee updated Successfully",
            updateEmployee
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server Error" });
    }
}

export const deleteHospitalEmployee = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Missing EmployeeId" });
        }


        const employee = await database
            .delete(addHospitalEmployee)
            .where(eq(addHospitalEmployee.employeeId, id))
            .returning()

        if (employee.length > 0) {
            const email = employee[0].emailAddress

            await database.delete(account).where(eq(account.accountId, email))

            await database.delete(users).where(eq(users.email, email))
        }

        if (employee.length > 0 && employee[0].profileImage) {
            const publicIdWithExtension = employee[0].profileImage.split('/').pop();
            const publicId = `Hospital_Employees_Profiles/${publicIdWithExtension?.split('.')[0]}`;
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

export const ActiveDeactiveHospitalEmployee = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { employeeId, status } = req.body

        if (!employeeId || !["Active", "Deactive"].includes(status)) {
            return res.status(400).json({ error: "Missing or Invalid EmployeeId or Status" });
        }

        const isActive = status === "Active"

        await database
            .update(addHospitalEmployee)
            .set({ isActive })
            .where(eq(addHospitalEmployee.employeeId, employeeId))

        return res.status(200).json({
            message: `Employee ${isActive ? "Activated" : "Deactivated"} Successfully`,
            status: isActive ? "Active" : "Deactive"
        })
    } catch (error) {
        console.log("Active/Deactive employee error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const addHospitalDependentController = async (req: Request, res: Response) => {
    try {
        const {
            FirstName,
            MiddleName,
            LastName,
            EmailAddress,
            Relation,
            CompanyRegisterNumber,
            profilePhoto,
            employeeId
        } = req.body;

        if (!FirstName || !LastName || !Relation || !employeeId) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const [hospitalemployee] = await database
            .select()
            .from(addHospitalEmployee)
            .where(eq(addHospitalEmployee.employeeId, employeeId));


        if (!hospitalemployee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        const allowedDependents = hospitalemployee ? Number(hospitalemployee.dependents ?? 0) : 0;

        // ✅ Step 2: Get current dependents of this employee
        const existingDependents = await database
            .select()
            .from(addDependents)
            .where(eq(addDependents.employeeId, employeeId));

        const currentDependentCount = existingDependents.length;

        // ✅ Step 3: Validation
        if (allowedDependents === 0) {
            return res.status(400).json({ error: "No dependents allowed for this employee." });
        }

        if (currentDependentCount >= allowedDependents) {
            return res.status(400).json({ error: `Only ${allowedDependents} dependents are allowed.` });
        }


        let uploadedImageUrl: string | null = null;
        if (profilePhoto) {
            const uploadRes = await cloudinary.uploader.upload(profilePhoto, {
                folder: "Hospital_dependents_profiles",
                transformation: [{ width: 300, height: 300, crop: "fill" }],
            });
            uploadedImageUrl = uploadRes.secure_url;
        }


        // ✅ Step 4: Insert
        await database.insert(addHospitalDependents).values({
            firstName: FirstName,
            middleName: MiddleName || null,
            lastName: LastName,
            emailAddress: EmailAddress || null,
            relation: Relation,
            registrationNumber: CompanyRegisterNumber || null,
            profileImage: uploadedImageUrl || null,
            employeeId
        });

        return res.status(200).json({
            message: "Dependent added successfully"
        });

    } catch (error: any) {
        console.error("error", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const addHospitalEmployeeRoleManagement = async (req: AuthenticatedRequest, res: Response) => {
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
            .from(addHospitalEmployee)
            .where(
                and(
                    eq(addHospitalEmployee.firstName, firstName),
                    eq(addHospitalEmployee.lastName, lastName)
                )
            );

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }


        const hashedPassword = await generateBetterAuthPasswordHash(Password);
        const result = await database.insert(HospitalRolesManagement).values({
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

export const getHospitalDepartment = async (_req: AuthenticatedRequest, res: Response) => {
    try {
        const department = await database.select({ RoleName: HospitalRolesManagement.RoleName, employeeId: HospitalRolesManagement.employeeId }).from(HospitalRolesManagement)
        return res.status(200).json({ department })
    } catch (error: any) {
        console.error("error", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
}

export const getPatientByNameAndId = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { SelectPatient, employeeId } = req.query;

        if (!SelectPatient && !employeeId) {
            return res.status(400).json({ message: "Patient name or id is required" });
        }

        // Build dynamic conditions
        const empConditions = [];
        if (employeeId) {
            empConditions.push(eq(addEmployee.employeeId, employeeId as string));
        }
        if (SelectPatient) {
            const words = (SelectPatient as string).trim().split(/\s+/);
            words.forEach((word) => {
                empConditions.push(
                    or(
                        ilike(addEmployee.firstName, `%${word}%`),
                        ilike(addEmployee.lastName, `%${word}%`)
                    )
                );
            });
        }

        const employee = await database
            .select({
                employeeId: addEmployee.employeeId,
                firstName: addEmployee.firstName,
                lastName: addEmployee.lastName,
            })
            .from(addEmployee)
            .where(empConditions.length ? and(...empConditions) : undefined);

        // Same for hospital employees
        const hospConditions = [];
        if (employeeId) {
            hospConditions.push(eq(addHospitalEmployee.employeeId, employeeId as string));
        }
        if (SelectPatient) {
            const words = (SelectPatient as string).trim().split(/\s+/);
            words.forEach((word) => {
                hospConditions.push(
                    or(
                        ilike(addHospitalEmployee.firstName, `%${word}%`),
                        ilike(addHospitalEmployee.lastName, `%${word}%`)
                    )
                );
            });
        }

        const hospitalemployee = await database
            .select({
                employeeId: addHospitalEmployee.employeeId,
                firstName: addHospitalEmployee.firstName,
                lastName: addHospitalEmployee.lastName,
            })
            .from(addHospitalEmployee)
            .where(hospConditions.length ? and(...hospConditions) : undefined);

        if ((!employee?.length) && (!hospitalemployee?.length)) {
            return res.status(404).json({ message: "Patient not found" });
        }

        return res.status(200).json({ employee, hospitalemployee });
    } catch (error) {
        console.error("error", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const addInvoice = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const { EmployeeId, PatientName, Amount, BenefitUsed, SubmittedDate } = req.body;

        const employee =
            (await database.query.addEmployee.findFirst({
                where: (fields, { eq }) => eq(fields.employeeId, EmployeeId),
            })) ??
            (await database.query.addHospitalEmployee.findFirst({
                where: (fields, { eq }) => eq(fields.employeeId, EmployeeId),
            }));

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // 3. Balance calculation
        const currentBalance = parseFloat(employee.amountPackage);
        const invoiceAmount = parseFloat(Amount);

        if (currentBalance <= 0) {
            return res.status(400).json({ message: "Employee has no remaining balance" });
        }

        if (invoiceAmount > currentBalance) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        const newBalance = currentBalance - invoiceAmount;

        if (!employee.companyUserId) {
            return res.status(400).json({ message: "Employee is not linked to any company" });
        }

        const company = await database.query.companyregister.findFirst({
            where: (fields, { eq }) => eq(fields.companyId, employee.companyUserId),
        });

        if (!company) {
            return res.status(404).json({ message: "Company/Hospital not found" });
        }

        // 5. Insert invoice
        await database.insert(addEmployeeInvoice).values({
            EmployeeId,
            companyId: employee.companyUserId,
            HospitalName: company.companyName,
            PatientName,
            Amount,
            RemainingBalance: newBalance.toString(),
            BenefitUsed,
            SubmittedDate,
        });

        // // 6. Update balance (depends on employee type)
        // if (employee.role === "Hospital Employee") {
        //     await database
        //         .update(addHospitalEmployee)
        //         .set({ amountPackage: newBalance.toString() })
        //         .where(eq(addHospitalEmployee.employeeId, EmployeeId));
        // } else {
        //     await database
        //         .update(addEmployee)
        //         .set({ amountPackage: newBalance.toString() })
        //         .where(eq(addEmployee.employeeId, EmployeeId));
        // }

        return res.status(200).json({
            message: "Invoice added successfully",
        });
    } catch (error: any) {
        console.error("error", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const getInvoice = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        let invoices;

        // const [company] = await database.select().from(companyregister)

        if (user.role === "CompanyAdmin") {
            invoices = await database.select().from(addEmployeeInvoice);
        } else {
            invoices = await database
                .select()
                .from(addEmployeeInvoice)
                .where(eq(addEmployeeInvoice.companyId, user.userId));
        }

        return res.status(200).json({
            invoices,
        });
    } catch (error) {
        console.error("error", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const deleteInvoice = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        await database.delete(addEmployeeInvoice).where(eq(addEmployeeInvoice.EmployeeId, id));
        return res.status(200).json({ message: "Invoice deleted successfully" });
    } catch (error: any) {
        console.error("error", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const downloadInvoice = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params

        const invoice = await database.query.addEmployeeInvoice.findFirst({
            where: (fields, { eq }) => eq(fields.id, id),
        })

        if (!invoice) {
            return res.status(404).json({ message: "Invoice Not Found" })
        }

        const doc = new PDFDocument()
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=invoice_${id}.pdf`);

        doc.pipe(res)
        doc.fontSize(20).text("Invoice", { align: "center" })
        doc.moveDown()
        doc.fontSize(12).text(`Invoice ID: ${invoice.EmployeeId}`);
        doc.text(`Patient Name: ${invoice.PatientName}`);
        doc.text(`Hospital: ${invoice.HospitalName}`);
        doc.text(`Amount: ${invoice.Amount}`);
        doc.text(`Benefit Used: ${invoice.BenefitUsed}`);
        doc.text(`Remaining Balance: ${invoice.RemainingBalance}`);
        doc.text(`Submitted Date: ${invoice.SubmittedDate}`);
        doc.end();
    } catch (error) {
        console.error("Error generating invoice PDF:", error);
        res.status(500).json({ error: "Something went wrong while generating invoice" });
    }
}












