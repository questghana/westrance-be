import cloudinary from "@/configs/cloudniary.config";
import { database } from "@/configs/connection.config";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { HospitalRolesManagement, account, addDependents, addEmployee, addHospitalDependents, addHospitalEmployee, users, addEmployeeInvoice, WestranceEmployee, addWestranceDependents } from "@/schema/schema";
import generateEmployeeId from "@/utils/generate.employeeid";
import { generateBetterAuthPasswordHash } from "@/utils/password-hash.util";
import { createId } from "@paralleldrive/cuid2";
import { and, or, eq, ilike, sql, inArray } from "drizzle-orm";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Request, Response } from "express";




export const SearchPatientById = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.query;

        if (!patientId || typeof patientId !== "string") {
            return res.status(400).json({ message: "Patient ID is required" });
        }

        const [employee] = await database
            .select()
            .from(addEmployee)
            .where(eq(addEmployee.employeeId, patientId));

        const [hospitalemployee] = await database
            .select()
            .from(addHospitalEmployee)
            .where(eq(addHospitalEmployee.employeeId, patientId));

        const [westranceEmployee] = await database
            .select()
            .from(WestranceEmployee)
            .where(eq(WestranceEmployee.employeeId, patientId));

        let foundEmployee = employee || hospitalemployee || westranceEmployee;

        if (!foundEmployee) {
            return res.status(404).json({ message: "Patient not found" });
        }

        let dependents: any[] = [];
        if (employee) {
            dependents = await database
                .select()
                .from(addDependents)
                .where(eq(addDependents.employeeId, patientId));
        } else if (hospitalemployee) {
            dependents = await database
                .select()
                .from(addHospitalDependents)
                .where(eq(addHospitalDependents.employeeId, patientId));
        } else if (westranceEmployee) {
            dependents = await database
                .select()
                .from(addWestranceDependents)
                .where(eq(addWestranceDependents.employeeId, patientId));
        }

        return res.status(200).json({
            employee: foundEmployee,
            dependents,
        });
    } catch (error) {
        console.error("Error searching patient by ID:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

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

        // Pagination params from query
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        let employeesQuery;
        let totalCountQuery;

        if (userRole === "CompanyAdmin") {
            employeesQuery = database
                .select()
                .from(addHospitalEmployee)
                .where(eq(addHospitalEmployee.companyUserId, userId))
                .limit(limit)
                .offset(offset);

            totalCountQuery = database
                .select({ count: sql<number>`count(*)` })
                .from(addHospitalEmployee)
                .where(eq(addHospitalEmployee.companyUserId, userId));

        } else if (userRole === "Hospital Employee") {
            const [employeeData] = await database
                .select({ companyUserId: addHospitalEmployee.companyUserId })
                .from(addHospitalEmployee)
                .where(eq(addHospitalEmployee.userId, userId));

            if (!employeeData) {
                return res.status(404).json({ error: "Employee not found" });
            }

            employeesQuery = database
                .select()
                .from(addHospitalEmployee)
                .where(eq(addHospitalEmployee.companyUserId, employeeData.companyUserId))
                .limit(limit)
                .offset(offset);

            totalCountQuery = database
                .select({ count: sql<number>`count(*)` })
                .from(addHospitalEmployee)
                .where(eq(addHospitalEmployee.companyUserId, employeeData.companyUserId));

        } else {
            return res.status(403).json({ error: "Forbidden" });
        }

        const [employees, totalCountResult] = await Promise.all([
            employeesQuery,
            totalCountQuery
        ]);

        const total = totalCountResult[0]?.count || 0;
        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            employees,
            pagination: {
                total,
                totalPages,
                page,
                limit
            }
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
        const hashedPassword = await generateBetterAuthPasswordHash(password);
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
            createPassword: hashedPassword,
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
            PhoneNumber,
            profilePhoto,
            employeeId
        } = req.body;
        const dependentId = generateEmployeeId();
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
            PhoneNumber: PhoneNumber || null,
            profileImage: uploadedImageUrl || null,
            employeeId,
            dependentId
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

        // ---------- Employees ----------
        const empConditions: any[] = [];
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

        let employeeDependents: any[] = [];
        if (employee?.length) {
            employeeDependents = await database
                .select({
                    id: addDependents.id,
                    employeeId: addDependents.employeeId,
                    firstName: addDependents.firstName,
                    relation: addDependents.relation,
                })
                .from(addDependents)
                .where(inArray(addDependents.employeeId, employee.map(e => e.employeeId)));
        }

        // ---------- Hospital Employees ----------
        const hospConditions: any[] = [];
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

        let hospitalDependents: any[] = [];
        if (hospitalemployee?.length) {
            hospitalDependents = await database
                .select({
                    id: addHospitalDependents.id,
                    employeeId: addHospitalDependents.employeeId,
                    firstName: addHospitalDependents.firstName,
                    relation: addHospitalDependents.relation,
                })
                .from(addHospitalDependents)
                .where(inArray(addHospitalDependents.employeeId, hospitalemployee.map(e => e.employeeId)));
        }

        // ---------- Westrance Employees ----------
        const westranceConditions: any[] = [];
        if (employeeId) {
            westranceConditions.push(eq(WestranceEmployee.employeeId, employeeId as string));
        }
        if (SelectPatient) {
            const words = (SelectPatient as string).trim().split(/\s+/);
            words.forEach((word) => {
                westranceConditions.push(
                    or(
                        ilike(WestranceEmployee.firstName, `%${word}%`),
                        ilike(WestranceEmployee.lastName, `%${word}%`)
                    )
                );
            });
        }

        const westranceEmployee = await database
            .select({
                employeeId: WestranceEmployee.employeeId,
                firstName: WestranceEmployee.firstName,
                lastName: WestranceEmployee.lastName,
            })
            .from(WestranceEmployee)
            .where(westranceConditions.length ? and(...westranceConditions) : undefined);

        let westranceDependents: any[] = [];
        if (westranceEmployee?.length) {
            westranceDependents = await database
                .select({
                    id: addWestranceDependents.id,
                    employeeId: addWestranceDependents.employeeId,
                    firstName: addWestranceDependents.firstName,
                    relation: addWestranceDependents.relation,
                })
                .from(addWestranceDependents)
                .where(inArray(addWestranceDependents.employeeId, westranceEmployee.map(e => e.employeeId)));
        }

        // ---------- Final Response ----------
        if ((!employee?.length) && (!hospitalemployee?.length) && (!westranceEmployee?.length)) {
            return res.status(404).json({ message: "Patient not found" });
        }

        const allPatients: any[] = [];

        // Combine employees and their dependents
        employee.forEach((emp) => {
            allPatients.push({
                ...emp,
                type: "employee",
                dependents: employeeDependents.filter((dep) => dep.employeeId === emp.employeeId),
            });
        });

        hospitalemployee.forEach((emp) => {
            allPatients.push({
                ...emp,
                type: "hospitalemployee",
                dependents: hospitalDependents.filter((dep) => dep.employeeId === emp.employeeId),
            });
        });

        westranceEmployee.forEach((emp) => {
            allPatients.push({
                ...emp,
                type: "westranceEmployee",
                dependents: westranceDependents.filter((dep) => dep.employeeId === emp.employeeId),
            });
        });

        return res.status(200).json({
            patients: allPatients,
        });

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

        let entity: any =
            (await database.query.addEmployee.findFirst({
                where: (fields, { eq }) => eq(fields.employeeId, EmployeeId),
            })) ??
            (await database.query.addHospitalEmployee.findFirst({
                where: (fields, { eq }) => eq(fields.employeeId, EmployeeId),
            })) ??
            (await database.query.WestranceEmployee.findFirst({
                where: (fields, { eq }) => eq(fields.employeeId, EmployeeId),
            }));

        let entityType: "employee" | "hospitalemployee" | "westranceemployee" | "dependent" | null = null;
        let parentEmployee: any = null;

        if (entity) {
            if (entity.userId) {
                if ('createPassword' in entity) {
                    entityType = entity.role === "Hospital Employee" ? "hospitalemployee" : (entity.role === "Westrance Employee" ? "westranceemployee" : "employee");
                    parentEmployee = entity;
                } else {
                }
            }
        } else {
            const dependent =
                (await database.query.addDependents.findFirst({
                    where: (fields, { eq }) => eq(fields.dependentId, EmployeeId),
                })) ??
                (await database.query.addHospitalDependents.findFirst({
                    where: (fields, { eq }) => eq(fields.dependentId, EmployeeId),
                })) ??
                (await database.query.addWestranceDependents.findFirst({
                    where: (fields, { eq }) => eq(fields.dependentId, EmployeeId),
                }));

            if (dependent) {
                entityType = "dependent";
                const employeeIdOfDependent = dependent.employeeId;

                parentEmployee =
                    (await database.query.addEmployee.findFirst({
                        where: (fields, { eq }) => eq(fields.employeeId, employeeIdOfDependent),
                    })) ??
                    (await database.query.addHospitalEmployee.findFirst({
                        where: (fields, { eq }) => eq(fields.employeeId, employeeIdOfDependent),
                    })) ??
                    (await database.query.WestranceEmployee.findFirst({
                        where: (fields, { eq }) => eq(fields.employeeId, employeeIdOfDependent),
                    }));

                if (!parentEmployee) {
                    return res.status(404).json({ message: "Parent employee for dependent not found" });
                }
                entity = dependent;
            }
        }

        if (!entity) {
            return res.status(404).json({ message: "Employee or Dependent not found" });
        }
        let targetEntity = parentEmployee || entity;

        let finalEmployerCompanyId: string;
        if (entityType === "westranceemployee" || (entityType === "dependent" && parentEmployee && (parentEmployee as any).role === "Westrance Employee")) {
            finalEmployerCompanyId = "COMP-001";
        } else {
            finalEmployerCompanyId = targetEntity.companyUserId;
        }

        // Balance calculation
        const currentBalance = parseFloat(targetEntity.amountPackage);
        const invoiceAmount = parseFloat(Amount);

        if (currentBalance <= 0) {
            return res.status(400).json({ message: "Employee/Dependent has no remaining balance" });
        }

        if (invoiceAmount > currentBalance) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        const newBalance = currentBalance - invoiceAmount;

        const employerCompany = await database.query.companyregister.findFirst({
            where: (fields, { eq }) => eq(fields.companyId, finalEmployerCompanyId),
        });

        if (!employerCompany) {
            return res.status(404).json({ message: "Employer company for this employee/dependent not found" });
        }

        const company = await database.query.companyregister.findFirst({
            where: (fields, { eq }) => eq(fields.companyId, user.userId),
        });

        if (!company) {
            return res.status(404).json({ message: "Company/Hospital not found" });
        }

        if (company.companyType !== "Hospital" && company.companyType !== "Pharmacy") {
            return res.status(403).json({
                message: "Only Hospital or Pharmacy can create invoices"
            });
        }

        if (entityType === "employee") {
            await database.update(addEmployee).set({ amountPackage: newBalance.toString() }).where(eq(addEmployee.employeeId, targetEntity.employeeId));
        } else if (entityType === "hospitalemployee") {
            await database.update(addHospitalEmployee).set({ amountPackage: newBalance.toString() }).where(eq(addHospitalEmployee.employeeId, targetEntity.employeeId));
        } else if (entityType === "westranceemployee") {
            await database.update(WestranceEmployee).set({ amountPackage: newBalance.toString() }).where(eq(WestranceEmployee.employeeId, targetEntity.employeeId));
        } else if (entityType === "dependent") {
            if ('employeeId' in targetEntity) {
                const originalEmployee = await database.query.addEmployee.findFirst({
                    where: (fields, { eq }) => eq(fields.employeeId, targetEntity.employeeId),
                });
                const originalHospitalEmployee = await database.query.addHospitalEmployee.findFirst({
                    where: (fields, { eq }) => eq(fields.employeeId, targetEntity.employeeId),
                });
                const originalWestranceEmployee = await database.query.WestranceEmployee.findFirst({
                    where: (fields, { eq }) => eq(fields.employeeId, targetEntity.employeeId),
                });

                if (originalEmployee) {
                    await database.update(addEmployee).set({ amountPackage: newBalance.toString() }).where(eq(addEmployee.employeeId, targetEntity.employeeId));
                } else if (originalHospitalEmployee) {
                    await database.update(addHospitalEmployee).set({ amountPackage: newBalance.toString() }).where(eq(addHospitalEmployee.employeeId, targetEntity.employeeId));
                } else if (originalWestranceEmployee) {
                    await database.update(WestranceEmployee).set({ amountPackage: newBalance.toString() }).where(eq(WestranceEmployee.employeeId, targetEntity.employeeId));
                }
            }
        }

        // Insert invoice
        await database.insert(addEmployeeInvoice).values({
            EmployeeId: EmployeeId,
            employerCompanyId: finalEmployerCompanyId,
            companyId: company.companyId,
            HospitalName: company.companyName,
            PatientName,
            Amount,
            RemainingBalance: newBalance.toString(),
            BenefitUsed,
            SubmittedDate: new Date(SubmittedDate),
        });

        return res.status(200).json({
            message: `Invoice created successfully by ${company.companyName}`,
        });
    } catch (error: any) {
        console.error("error", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

export const getInvoiceByHospital = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        // Paginated invoices
        const invoices = await database
            .select({
                id: addEmployeeInvoice.id,
                EmployeeId: addEmployeeInvoice.EmployeeId,
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
            .where(eq(addEmployeeInvoice.companyId, user.userId))
            .offset(offset)
            .limit(limit);

        // Total count
        const totalInvoices = await database
            .select({ count: sql<number>`count(*)` })
            .from(addEmployeeInvoice)
            .where(eq(addEmployeeInvoice.companyId, user.userId));

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

// export const downloadInvoice = async (req: AuthenticatedRequest, res: Response) => {
//     try {
//         const { id } = req.params

//         const invoice = await database.query.addEmployeeInvoice.findFirst({
//             where: (fields, { eq }) => eq(fields.id, id),
//         })

//         if (!invoice) {
//             return res.status(404).json({ message: "Invoice Not Found" })
//         }

//         return res.status(200).json({
//             invoice
//         })
//     } catch (error) {
//         console.error("Error generating invoice PDF:", error);
//         res.status(500).json({ error: "Something went wrong while generating invoice" });
//     }
// }

export const getMonthlyPatientVisits = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        let company;
        let companyId = user.userId;

        if (user.role === "Hospital Employee") {
            const [employeeData] = await database
                .select({ companyUserId: addHospitalEmployee.companyUserId })
                .from(addHospitalEmployee)
                .where(eq(addHospitalEmployee.userId, user.userId));

            if (!employeeData) {
                return res.status(404).json({ error: "Employee not found" });
            }

            companyId = employeeData.companyUserId;
        }

        company = await database.query.companyregister.findFirst({
            where: (fields, { eq }) => eq(fields.companyId, companyId),
        });

        if (!company || (company.companyType !== "Hospital" && company.companyType !== "Pharmacy")) {
            return res.status(403).json({ message: "Only Hospital or Pharmacy can view patient visit analytics." });
        }

        const fromParam = req.query.from as string | undefined;
        const toParam = req.query.to as string | undefined;

        const buildRangeMonths = (fromDate: Date, toDate: Date) => {
            const months: { start: Date; end: Date; label: string }[] = [];
            let current = startOfMonth(fromDate);
            const last = endOfMonth(toDate);
            while (current <= last) {
                months.push({
                    start: startOfMonth(current),
                    end: endOfMonth(current),
                    label: current.toLocaleString('default', { month: 'long' })
                });
                current = startOfMonth(subMonths(endOfMonth(current), -1));
            }
            return months;
        };

        const result: { month: string; visits: number }[] = [];

        if (fromParam && toParam) {
            const from = new Date(fromParam);
            const to = new Date(toParam);
            const months = buildRangeMonths(from, to);
            for (const m of months) {
                const [countRow] = await database
                    .select({ count: sql<number>`count(*)`.mapWith(Number) })
                    .from(addEmployeeInvoice)
                    .where(sql`${addEmployeeInvoice.companyId} = ${companyId} AND ${addEmployeeInvoice.SubmittedDate} BETWEEN ${m.start.toISOString()} AND ${m.end.toISOString()}`);
                result.push({ month: m.label, visits: countRow?.count || 0 });
            }
        } else {
            for (let i = 11; i >= 0; i--) {
                const date = subMonths(new Date(), i);
                const start = startOfMonth(date);
                const end = endOfMonth(date);
                const monthName = date.toLocaleString('default', { month: 'long' });
                const [countRow] = await database
                    .select({ count: sql<number>`count(*)`.mapWith(Number) })
                    .from(addEmployeeInvoice)
                    .where(sql`${addEmployeeInvoice.companyId} = ${companyId} AND ${addEmployeeInvoice.SubmittedDate} BETWEEN ${start.toISOString()} AND ${end.toISOString()}`);
                result.push({ month: monthName, visits: countRow?.count || 0 });
            }
        }

        return res.status(200).json({ data: result });
    } catch (error: any) {
        console.error("Error fetching monthly patient visits:", error);
        return res.status(500).json({ error: error.message || "Something went wrong" });
    }
};

export const getHospitalDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Total Verified Beneficiaries (Employees + Dependents)
        const totalEmployees = await database.select({ count: sql<number>`count(*)` }).from(addHospitalEmployee).where(eq(addHospitalEmployee.companyUserId, userId));
        const totalDependents = await database
            .select({ count: sql<number>`count(*)` })
            .from(addHospitalDependents)
            .where(inArray(addHospitalDependents.employeeId, database.select({ employeeId: addHospitalEmployee.employeeId }).from(addHospitalEmployee).where(eq(addHospitalEmployee.companyUserId, userId))));


        const totalVerifiedBeneficiaries = Number(totalEmployees[0]?.count || 0) + Number(totalDependents[0]?.count || 0);

        // Bills Submitted
        const billsSubmitted = await database.select({ count: sql<number>`count(*)` }).from(addEmployeeInvoice).where(eq(addEmployeeInvoice.companyId, userId));

        // Bills Awaiting Payment (Assuming RemainingBalance > 0)
        const billsAwaitingPayment = await database
            .select({ count: sql<number>`count(*)` })
            .from(addEmployeeInvoice)
            .where(and(eq(addEmployeeInvoice.companyId, userId), sql`CAST(${addEmployeeInvoice.RemainingBalance} AS DECIMAL) > 0`));


        const appointmentsToday = "0";

        return res.status(200).json({
            totalVerifiedBeneficiaries,
            appointmentsToday,
            billsSubmitted: billsSubmitted[0]?.count || 0,
            billsAwaitingPayment: billsAwaitingPayment[0]?.count || 0,
        });
    } catch (error) {
        console.error("Error fetching hospital dashboard stats:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};











