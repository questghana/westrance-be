import { Response } from "express";
import { database } from "@/configs/connection.config";
import { addEmployee, users, account, addDependents, WestranceEmployee, addWestranceDependents, addHospitalEmployee, addEmployeeInvoice } from "@/schema/schema";
import generateEmployeeId from "@/utils/generate.employeeid";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { generateBetterAuthPasswordHash } from "@/utils/password-hash.util";
import bcrypt from "bcrypt"
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import cloudinary from "@/configs/cloudniary.config";

export interface AddEmployeeBody {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  companyContact: string;
  startingDate: string;
  duration: string;
  amount: string;
  benefits: string;
  password: string;
  confirmPassword: string;
  dependents?: string;
  profilePhoto?: string;
}

export const addEmployeeController = async (req: AuthenticatedRequest, res: Response) => {
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
      password,
      confirmPassword,
      dependents,
      profilePhoto,
    } = req.body;

    if (!firstName || !lastName || !email || !companyContact || !startingDate || !duration || !amount || !password || !confirmPassword) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    let uploadedImageUrl: string | null = null;
    if (profilePhoto) {
      const uploadRes = await cloudinary.uploader.upload(profilePhoto, {
        folder: "employee_profiles",
        transformation: [{ width: 300, height: 300, crop: "fill" }],
      });
      uploadedImageUrl = uploadRes.secure_url;
    }

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
      userId = existingUser[0].id;

      if (existingUser[0].role !== "Employee") {
        await database
          .update(users)
          .set({ role: "Employee" })
          .where(eq(users.id, userId));
      }
    } else {
      const fullName = middleName ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`;

      userId = createId();

      await database.insert(users).values({
        id: userId,
        name: fullName,
        email,
        role: "Employee",
        emailVerified: false,
        image: uploadedImageUrl || null,
      });

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
      .from(addEmployee)
      .where(eq(addEmployee.emailAddress, email))
      .limit(1);

    if (existingEmployee.length > 0) {
      return res.status(400).json({ error: "Employee with this email already exists" });
    }

    const employeeId = generateEmployeeId();
    const hashedPassword = await generateBetterAuthPasswordHash(password);

    const assignedBenefits = [
      "In-Patient",
      "Out-Patient",
      "Virtual Primary Care",
    ];

    const insertedEmployess = await database.insert(addEmployee).values({
      id: createId(),
      userId,
      companyUserId: req.user?.userId!,
      employeeId,
      firstName,
      middleName,
      lastName,
      emailAddress: email,
      registrationNumber: companyContact,
      startingDate: new Date(startingDate),
      duration,
      amountPackage: amount,
      benefits: assignedBenefits,
      createPassword: hashedPassword,
      profileImage: uploadedImageUrl || null,
      dependents,
      role: "Employee",
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

export const updateEmployeeController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      FullName,
      Emailaddress,
      CurrentPassword,
      NewPassword,
      CPassword,
      profilePhoto
    } = req.body;

    const existingEmployee = await database
      .select()
      .from(addEmployee)
      .where(eq(addEmployee.userId, userId));

    const prevImgUrl = existingEmployee[0]?.profileImage;
    let profileImg = prevImgUrl;

    if (profilePhoto) {
      if (prevImgUrl) {
        const parts = prevImgUrl.split('/');
        const publicIdWithExtension = parts[parts.length - 1];
        const publicId = `employee_profiles/${publicIdWithExtension.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      }

      const uploadResponse = await cloudinary.uploader.upload(profilePhoto, {
        folder: 'employee_profiles',
        transformation: [{ width: 300, height: 300, crop: "fill" }],
      });

      profileImg = uploadResponse.secure_url;
    }

    const user = await database
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const accountRecord = await database
      .select()
      .from(account)
      .where(eq(account.userId, userId))
      .limit(1);

    if (user.length === 0 || accountRecord.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    let updatedPassword = null;

    // Handle password update
    if (CurrentPassword || NewPassword || CPassword) {
      if (!CurrentPassword || !NewPassword || !CPassword) {
        return res.status(400).json({
          error: "Please provide all password fields to change password",
        });
      }

      const isPasswordValid = await bcrypt.compare(
        CurrentPassword,
        accountRecord[0].password!
      );

      if (!isPasswordValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      if (NewPassword !== CPassword) {
        return res
          .status(400)
          .json({ error: "New password and confirm password do not match" });
      }

      if (CurrentPassword === NewPassword) {
        return res
          .status(400)
          .json({ error: "New password must be different from current" });
      }

      updatedPassword = await bcrypt.hash(NewPassword, 12);

      await database.update(account)
        .set({
          accountId: Emailaddress,
          password: updatedPassword,
          updatedAt: new Date(),
        })
        .where(eq(account.userId, userId));
    }

    const userRole = req.user?.role;

    if (userRole === "Employee") {
      await database.update(addEmployee)
        .set({
          firstName: FullName,
          emailAddress: Emailaddress,
          profileImage: profileImg,
          updatedAt: new Date(),
          ...(updatedPassword && { createPassword: updatedPassword })
        })
        .where(eq(addEmployee.userId, userId));
    } else if (userRole === "Hospital Employee") {
      await database.update(addHospitalEmployee)
        .set({
          firstName: FullName,
          emailAddress: Emailaddress,
          profileImage: profileImg,
          updatedAt: new Date(),
          ...(updatedPassword && { createPassword: updatedPassword })
        })
        .where(eq(addHospitalEmployee.userId, userId));
    } else if (userRole === "Westrance Employee") {
      await database.update(WestranceEmployee)
        .set({
          firstName: FullName,
          emailAddress: Emailaddress,
          profileImage: profileImg,
          updatedAt: new Date(),
          ...(updatedPassword && { createPassword: updatedPassword })
        })
        .where(eq(WestranceEmployee.userId, userId));
    } else {
      console.warn("User role not recognized for employee profile update:", userRole);
    }

    await database.update(users)
      .set({
        name: FullName,
        email: Emailaddress,
        image: profileImg,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return res.status(200).json({
      message: "Profile updated successfully",
      updatedProfileImage: profileImg,
    });
  } catch (err) {
    console.error("Update error", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

export const addDependentController = async (req: AuthenticatedRequest, res: Response) => {
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

    const [employee] = await database
      .select()
      .from(addEmployee)
      .where(eq(addEmployee.employeeId, employeeId));

    // const [hospitalemployee] = await database
    //   .select()
    //   .from(addHospitalEmployee)
    //   .where(eq(addHospitalEmployee.employeeId, employeeId));

    // console.log(employee, hospitalemployee)

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const allowedDependents = employee ? Number(employee.dependents ?? 0) : 0;

    const existingDependents = await database
      .select()
      .from(addDependents)
      .where(eq(addDependents.employeeId, employeeId));

    const currentDependentCount = existingDependents.length;

    if (allowedDependents === 0) {
      return res.status(400).json({ error: "No dependents allowed for this employee." });
    }

    if (currentDependentCount >= allowedDependents) {
      return res.status(400).json({ error: `Only ${allowedDependents} dependents are allowed.` });
    }


    let uploadedImageUrl: string | null = null;
    if (profilePhoto) {
      const uploadRes = await cloudinary.uploader.upload(profilePhoto, {
        folder: "dependents_profiles",
        transformation: [{ width: 300, height: 300, crop: "fill" }],
      });
      uploadedImageUrl = uploadRes.secure_url;
    }


    await database.insert(addDependents).values({
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

export const addWestranceDependentController = async (req: AuthenticatedRequest, res: Response) => {
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

    const [westranceEmployee] = await database
      .select()
      .from(WestranceEmployee)
      .where(eq(WestranceEmployee.employeeId, employeeId));


    if (!westranceEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const allowedDependents = westranceEmployee ? Number(westranceEmployee.dependents ?? 0) : 0;

    const existingDependents = await database
      .select()
      .from(addWestranceDependents)
      .where(eq(addWestranceDependents.employeeId, employeeId));

    const currentDependentCount = existingDependents.length;

    if (allowedDependents === 0) {
      return res.status(400).json({ error: "No dependents allowed for this employee." });
    }

    if (currentDependentCount >= allowedDependents) {
      return res.status(400).json({ error: `Only ${allowedDependents} dependents are allowed.` });
    }


    let uploadedImageUrl: string | null = null;
    if (profilePhoto) {
      const uploadRes = await cloudinary.uploader.upload(profilePhoto, {
        folder: "Westrance_dependents_profiles",
        transformation: [{ width: 300, height: 300, crop: "fill" }],
      });
      uploadedImageUrl = uploadRes.secure_url;
    }


    await database.insert(addWestranceDependents).values({
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

export const getEmployeeDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
   const userId = req.user?.userId
   if(!userId) return res.status(401).json({error: "Unauthorized"})

   const employee = await database
   .select({ employeeId: addEmployee.employeeId, benefits: addEmployee.benefits, amountPackage: addEmployee.amountPackage, duration: addEmployee.duration })
   .from(addEmployee)
   .where(eq(addEmployee.userId, userId));

    const hospitalEmployee = await database
    .select({ employeeId: addHospitalEmployee.employeeId, benefits: addHospitalEmployee.benefits, amountPackage: addHospitalEmployee.amountPackage, duration: addHospitalEmployee.duration })
    .from(addHospitalEmployee)
    .where(eq(addHospitalEmployee.userId, userId));

    const westranceEmployee = await database
    .select({ employeeId: WestranceEmployee.employeeId, benefits: WestranceEmployee.benefits, amountPackage: WestranceEmployee.amountPackage, duration: WestranceEmployee.duration })
    .from(WestranceEmployee)
    .where(eq(WestranceEmployee.userId, userId));

    let employeeData = null;

    if (employee.length > 0) {
      employeeData = employee[0];
    } else if (hospitalEmployee.length > 0) {
      employeeData = hospitalEmployee[0];
    } else if (westranceEmployee.length > 0) {
      employeeData = westranceEmployee[0];
    }

    if (!employeeData) {
      return res.status(404).json({ error: "Employee not found in any table" });
    }

    return res.status(200).json({ employeeData });

  } catch (error) {
    console.error("error", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export const getEmployeeInvoice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ error: "Unauthorized" })
    
    const employeeResult = await database
      .select({ employeeId: addEmployee.employeeId })
      .from(addEmployee)
      .where(eq(addEmployee.userId, userId))
      .limit(1);

    const hospitalEmployeeResult = await database
      .select({ employeeId: addHospitalEmployee.employeeId })
      .from(addHospitalEmployee)
      .where(eq(addHospitalEmployee.userId, userId))
      .limit(1);

    const westranceEmployeeResult = await database
      .select({ employeeId: WestranceEmployee.employeeId })
      .from(WestranceEmployee)
      .where(eq(WestranceEmployee.userId, userId))
      .limit(1);    

    let employeeId: string | undefined;

    if (employeeResult.length > 0) {
      employeeId = employeeResult[0].employeeId;
    } else if (hospitalEmployeeResult.length > 0) {
      employeeId = hospitalEmployeeResult[0].employeeId;
    } else if (westranceEmployeeResult.length > 0) {
      employeeId = westranceEmployeeResult[0].employeeId;
    }

    if (!employeeId) {
      return res.status(404).json({ error: "Employee ID not found for the authenticated user" });
    }

    const EmployeeInvoice = await database
      .select()
      .from(addEmployeeInvoice)
      .where(eq(addEmployeeInvoice.EmployeeId, employeeId));

    return res.status(200).json({ EmployeeInvoice });

  } catch (error) {
    console.error("error", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}


