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

config();
const JWT_SECRET = env.JWT_SECRET;

export const unifiedSignInController = async (req: Request<{}, {}, { email: string; password: string }>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

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

    const resetLink = `https://app.westrance.com/resetpassword?token=${token}`;

    await sendEmail({
      to: email,
      subject: "🔐 Reset Your Password - Westrance",
      html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;line-height:1.6;color:#333;">
        <!-- Header with Logo -->
        <div style="text-align:center;padding:20px 0;">
          <img src="https://app.westrance.com/Logo/logo.png" alt="Westrance Logo" 
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
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };
    res.clearCookie("token", cookieOptions);
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
};

export const authme = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token;
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
    let employee = null; 

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