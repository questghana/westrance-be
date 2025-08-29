import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { database } from "../configs/connection.config";
import * as schema from "@/schema/schema";
import { betterAuth } from "better-auth";
import { env } from "@/utils/env.utils";
import { sendEmail } from "@/utils/sendEmail";
import bcrypt from "bcrypt";

export const auth = betterAuth({
  database: drizzleAdapter(database, { provider: "pg", schema }),
  secret: env.COOKIE_SECRET,
  trustedOrigins: [env.FRONTEND_DOMAIN],

  session: {
    cookieCache: {
      enabled: true, // Enable caching session in cookie
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // Email/Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    password: {
      hash: async (password: string) => {
        return await bcrypt.hash(password, 12);
      },
      verify: async ({ password, hash }) => {
        return await bcrypt.compare(password, hash);
      },
    },
    sendResetPassword: async ({ url, user }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your Password",
        text: `Click the link to reset your password: ${url}`,
      });
    },
  },

  user: {
    modelName: "users",
    additionalFields: {
      role: {
        type: "string",
        default: "user",
      },
    },
    selectUser: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      role: true,
    },

    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async () => {
        // Optional: Add logic here
      },
    },

    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async () => {
        // Optional: Add logic here
      },
      beforeDelete: async () => {
        // Optional: Add cleanup
      },
      afterDelete: async () => {
        // Optional: Add post-delete logic
      },
    },
  },
});
