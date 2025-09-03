import { database } from "@/configs/connection.config";
import { admins } from "@/schema/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs"

const seedAdmin = async () => {
    try {
        const email = "admin@example.com";
        const password = "Admin@123";

        // check karo admin already exist to nahi
        const existing = await database.select().from(admins).where(eq(admins.email, email));
        if (existing.length > 0) {
            console.log("⚠️ Admin already exists");
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await database.insert(admins).values({
            email,
            password: hashedPassword,
        });

        console.log("Admin inserted successfully:", email);
        process.exit(0);
    } catch (err) {
        console.error("Error seeding admin:", err);
        process.exit(1);
    }
};

seedAdmin();
