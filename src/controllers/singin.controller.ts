import { Request, Response, CookieOptions } from "express";
import { database } from "@/configs/connection.config";
import { addEmployee, users, companyregister, account, addHospitalEmployee, WestranceEmployee } from "@/schema/schema";
import { eq } from "drizzle-orm";
// import { logger } from "@/utils/logger.util";
import { User } from "@/types/api";
import bcrypt from "bcrypt"
import { generateJwt } from "@/utils/common.util";
import { sendEmail } from "@/utils/sendEmail";
import { generateBetterAuthPasswordHash } from "@/utils/password-hash.util";
import jwt from "jsonwebtoken"
import { config } from "dotenv";
import { env } from "@/utils/env.utils";

export interface EmployeeSignInBody {
  email: string;
  password: string;
}

// export const employeeSignInController = async (
//   req: Request<{}, {}, EmployeeSignInBody>,
//   res: Response
// ) => {
//   try {
//     const { email, password } = req.body;
//     console.log("maa ka")

//     if (!email || !password) {
//       return res.status(400).json({ error: "Email and password required" });
//     }

//     const user = await database
//       .select({
//         id: users.id,
//         name: users.name,
//         email: users.email,
//         role: users.role,
//         emailVerified: users.emailVerified,
//         image: users.image,
//         createdAt: users.createdAt,
//         updatedAt: users.updatedAt
//       })
//       .from(users)
//       .where(and(
//         eq(users.email, email),
//         eq(users.role, "Employee")
//       ))
//       .limit(1) as User[];

//     if (user.length === 0) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     if (!user[0].role || user[0].role === 'User') {
//       let newRole = 'User';

//       const companyCheck = await database
//         .select()
//         .from(companyregister)
//         .where(eq(companyregister.administrativeEmail, email))
//         .limit(1);

//       if (companyCheck.length > 0) {
//         newRole = 'Company';
//       } else {
//         const employeeCheck = await database
//           .select()
//           .from(addEmployee)
//           .where(eq(addEmployee.emailAddress, email))
//           .limit(1);

//         if (employeeCheck.length > 0) {
//           newRole = 'Employee';
//         }
//       }

//       await database
//         .update(users)
//         .set({ role: newRole })
//         .where(eq(users.id, user[0].id));

//       user[0].role = newRole;

//       console.log(`Updated user ${email} role to: ${newRole}`);
//     }

//     const employee = await database
//       .select({
//         employeeId: addEmployee.employeeId,
//         firstName: addEmployee.firstName,
//         lastName: addEmployee.lastName,
//         startingDate: addEmployee.startingDate,
//         profileImage: addEmployee.profileImage,
//         dependents: addEmployee.dependents,
//         amountPackage: addEmployee.amountPackage,
//         benefits: addEmployee.benefits,
//         registrationNumber: addEmployee.registrationNumber,
//         emailAddress: addEmployee.emailAddress,

//       })
//       .from(addEmployee)
//       .where(eq(addEmployee.userId, user[0].id))
//       .limit(1);

//     if (employee.length === 0) {
//       return res.status(401).json({ error: "Employee record not found" });
//     }


//     console.log("User data:", user[0]);
//     console.log("User role:", user[0].role);

//     return res.status(200).json({
//       message: "Employee authenticated successfully",
//       data: {
//         user: {
//           id: user[0].id,
//           name: user[0].name,
//           email: user[0].email,
//           role: user[0].role || "Employee"
//         },
//         employee: {
//           employeeId: employee[0].employeeId,
//           firstName: employee[0].firstName,
//           lastName: employee[0].lastName,
//           startingDate: employee[0].startingDate,
//           profileImage: employee[0].profileImage,
//           dependents: employee[0].dependents,
//           amountPackage: employee[0].amountPackage,
//           benefits: employee[0].benefits,
//           registrationNumber: employee[0].registrationNumber,
//           emailAddress: employee[0].emailAddress,
//         }
//       }
//     } as EmployeeSignInResponse);

//   } catch (error) {
//     logger.error("Employee sign-in error:", error);
//     return res.status(500).json({ error: "Authentication failed" });
//   }
// };
config();
const JWT_SECRET = env.JWT_SECRET;

export const unifiedSignInController = async (req: Request<{}, {}, { email: string; password: string }>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Lookup user
    const user = await database
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        emailVerified: users.emailVerified,
        image: users.image,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1) as User[];

    if (user.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const userId = user[0].id;

    // Determine role if missing
    let role = user[0].role;
    if (!role || role === 'User') {
  const company = await database
    .select()
    .from(companyregister)
    .where(eq(companyregister.administrativeEmail, email))
    .limit(1);

  const employee = await database
    .select()
    .from(addEmployee)
    .where(eq(addEmployee.emailAddress, email))
    .limit(1);

  const hospitalEmployee = await database
    .select()
    .from(addHospitalEmployee)
    .where(eq(addHospitalEmployee.emailAddress, email))
    .limit(1);

  const westranceEmployee = await database
    .select()
    .from(WestranceEmployee)
    .where(eq(WestranceEmployee.emailAddress, email))
    .limit(1);

  if (company.length > 0) {
    role = "CompanyAdmin";
  } else if (hospitalEmployee.length > 0) {
    role = "Hospital Employee";
  } else if (westranceEmployee.length > 0) {
    role = "Westrance Employee";
  } else if (employee.length > 0) {
    role = "Employee";
  } else {
    role = "User";
  }

  await database.update(users)
    .set({ role })
    .where(eq(users.id, userId));
}

    // Password check (assumes Better-Auth style hash stored in `account`)
    const accountRecord = await database
      .select()
      .from(account)
      .where(eq(account.accountId, email))
      .limit(1);

    if (accountRecord.length === 0) {
      return res.status(401).json({ error: "No account found for this user" });
    }

    const isValidPassword = await bcrypt.compare(password, accountRecord[0].password!);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = generateJwt({ userId: userId, role, email }, '1d');
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day    
    };
    res.cookie('token', token, cookieOptions);

    // Role-specific data
    if (role === "CompanyAdmin") {
      const company = await database
        .select()
        .from(companyregister)
        .where(eq(companyregister.administrativeEmail, email))
        .limit(1);

      if (!company[0].isActive) {
        return res.status(403).json({ error: "Your account has been DeActivated by Admin" });
      }

      return res.status(200).json({
        message: "Company login success",
        data: {
          token,
          user: { ...user[0], role },
          company: company[0],
        }
      });
    }

    if (role === "Employee") {
      const employee = await database
        .select()
        .from(addEmployee)
        .where(eq(addEmployee.emailAddress, email))
        .limit(1);

      if (employee.length === 0) {
        return res.status(401).json({ error: "Employee not found" });
      }

      if (!employee[0].isActive) {
        return res.status(403).json({ error: "Your account has been deactivated by your company." });
      }


      return res.status(200).json({
        message: "Employee login success",
        data: {
          token,
          user: { ...user[0], role },
          employee: employee[0],
        }
      });
    }

    if (role === "Hospital Employee") {
      const HospitalEmployee = await database
        .select()
        .from(addHospitalEmployee)
        .where(eq(addHospitalEmployee.emailAddress, email))
        .limit(1)

      if (HospitalEmployee.length === 0) {
        return res.status(401).json({ error: "Hospital Employee Not Found" })
      }

      if (!HospitalEmployee[0].isActive) {
        return res.status(403).json({ error: "Your account has been deactivated by your Hospital" })
      }

      return res.status(200).json({
        message: "Hospital Employee Login Successfully",
        data: {
          token,
          user: { ...user[0], role },
          employee: HospitalEmployee[0]
        }
      })


    }

    if (role === "Westrance Employee") {
      const westranceEmployee = await database
        .select()
        .from(WestranceEmployee)
        .where(eq(WestranceEmployee.emailAddress, email))
        .limit(1)

      if (westranceEmployee.length === 0) {
        return res.status(401).json({ error: "Westrance Employee Not Found" })
      }

      if (!westranceEmployee[0].isActive) {
        return res.status(403).json({ error: "Your account has been deactivated by your Company" })
      }

      return res.status(200).json({
        message: "Westrance Employee Login Successfully",
        data: {
          token,
          user: { ...user[0], role },
          employee: westranceEmployee[0]   
        }
        })
    }


    // Default case for fallback role
    return res.status(200).json({
      message: "User login success",
      data: {
        token,
        user: { ...user[0], role: role || "User" },
      }
    });

  } catch (error) {
    console.error("Unified login error:", error);
    return res.status(500).json({ error: "Something went wrong during login" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await database.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found with this email" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });

    // const resetLink = `http://localhost:4000/resetpassword?token=${token}`;
    const resetLink = `${process.env.FRONTEND_DOMAIN}/resetpassword?token=${token}`;

    await sendEmail({
      to: email,
      subject: "🔐 Reset Your Password - Westrance",
      html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;line-height:1.6;color:#333;">
        <!-- Header with Logo -->
        <div style="text-align:center;padding:20px 0;">
          <img src="/Logo/logo.png" alt="Westrance Logo" 
               style="max-width:150px;margin-bottom:10px;" />
        </div>
    
        <!-- Main Content -->
        <div style="background:#fff;padding:30px;border:1px solid #eee;border-radius:8px;">
          <h3 style="color:#0A51BA;margin-top:0;">Password Reset Request</h3>
          <p>Hello <strong>${user.name || "User"}</strong>,</p>
          <p>We received a request to reset your Westrance account password.</p>
          <p>Please click the button below to reset your password:</p>
          
          <div style="text-align:center;margin:30px 0;">
            <a href="${resetLink}" 
               style="background:#0A51BA;color:#fff;padding:12px 20px;
                      text-decoration:none;border-radius:5px;font-weight:bold;">
              Reset Password
            </a>
          </div>
          
          <p>If the button doesn’t work, copy and paste this link into your browser:</p>
          <p style="word-break:break-all;color:#0A51BA;">${resetLink}</p>
          
          <p style="color:#999;font-size:12px;">
            This link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
    
        <!-- Footer -->
        <div style="text-align:center;color:#999;font-size:12px;margin-top:20px;">
          © ${new Date().getFullYear()} Westrance. All rights reserved.
        </div>
      </div>
      `,
    });

    return res.status(200).json({ success: true, message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, Newpassword, confirmpassword } = req.body

    if (!token || !Newpassword || !confirmpassword) {
      return res.status(404).json({ error: "Missing required Fields" })
    }

    if (Newpassword !== confirmpassword) {
      return res.status(404).json({ error: "New And Confirm Not Match" })
    }

    // console.log(token, Newpassword, confirmpassword)
    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string };

    const hashedPassword = await generateBetterAuthPasswordHash(Newpassword);

    await database.update(account).set({
      password: hashedPassword
    }).where(eq(account.userId, decoded.userId))



    return res.status(200).json({ success: true, message: "Password Reset Successfully" });
  } catch (error) {
    console.error("reset Password error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
}

export const logout = async (_req: Request, res: Response) => {
  try {
    res.clearCookie('token');
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
};

export const authme = async (req: Request, res: Response) => {
  try {
    // console.log("Authme endpoint hit.");
    const token = req.cookies.token;
    // console.log("Received token from cookies:", token);
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized - No token" });
    }
    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string, role: string, email: string };
    console.log("Decoded token:", decoded);

    const [user] = await database.select().from(users).where(eq(users.id, decoded.userId));
    console.log("User found in DB:", user);

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized - User not found" });
    }

    let company = null;
    let employee = null; // Initialize employee as null

    if (user.role === "CompanyAdmin") {
      [company] = await database.select().from(companyregister).where(eq(companyregister.administrativeEmail, user.email));
      console.log("Company found for admin:", company);
    } else if (user.role === "Employee") {
      [employee] = await database.select().from(addEmployee).where(eq(addEmployee.userId, user.id));
      console.log("Employee found for Employee role:", employee);
    } else if (user.role === "Hospital Employee") {
      [employee] = await database.select().from(addHospitalEmployee).where(eq(addHospitalEmployee.userId, user.id));
      console.log("Hospital Employee found for Hospital Employee role:", employee);
    } else if (user.role === "Westrance Employee") {
      [employee] = await database.select().from(WestranceEmployee).where(eq(WestranceEmployee.userId, user.id));
      console.log("Westrance Employee found for Westrance Employee role:", employee);
    }

    return res.status(200).json({ success: true, data: { user, company, employee } });
  } catch (error) {
    console.error("Auth me error:", error);
    return res.status(401).json({ success: false, message: "Unauthorized - Invalid token" });
  }
};