// src/seeds/01_admin.ts

import { db } from "../../models/db";
import { admins } from "../../models/schema";
import { Seed } from "../runner";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const seed: Seed = {
    name: "01_admin",

    async run() {
        console.log("   📝 Inserting default admin...");

        const defaultPassword = await bcrypt.hash("password123", 10);

        const adminsData = [
            { 
                name: "مدير النظام",
                email: "admin@admin.com",
                password: defaultPassword,
            },
        ];

        console.log("   📥 Saving Admin...");
        await db.insert(admins).values(adminsData);

        console.log("   🚀 Completed! Seeded default admin.");
    },

    async rollback() {
        console.log("   🗑️ Rolling back seeded admin...");
        await db.delete(admins).where(eq(admins.email, "admin@admin.com"));
        console.log("   ✅ Rollback completed successfully.");
    },
};

export default seed;