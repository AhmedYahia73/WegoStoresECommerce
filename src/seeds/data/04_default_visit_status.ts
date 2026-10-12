// src/seeds/04_default_visit_status.ts

import { db } from "../../models/db";
import { visitStatus } from "../../models/schema";
import { Seed } from "../runner";
import { sql } from "drizzle-orm";

const seed: Seed = {
    name: "04_default_visit_status",

    async run() {
        console.log("   📝 Inserting comprehensive default visit statuses...");

        // استخدام نفس المعرفات الثابتة لضمان توافق الربط مع الـ Seeder الخاص بالـ Visits
        const statusPendingId = "st111111-1111-1111-1111-111111111111";
        const statusInterestedId = "st222222-2222-2222-2222-222222222222";
        const statusDoneId = "st333333-3333-3333-3333-333333333333";

        const visitStatusesData = [
            { 
                name: "قيد الانتظار / المتابعة (Pending)",
                status: true,
            },
            { 
                name: "مهتم بالتعاقد (Interested / Lead)",
                status: true,
            },
            { 
                name: "تمت العملية بنجاح (Closed Won)",
                status: true,
            },
            { 
                name: "غير مهتم حالياً (Not Interested)",
                status: true,
            },
            { 
                name: "مؤجل لعدم التواجد (Postponed)",
                status: true,
            },
            { 
                name: "العنوان غير صحيح / وهمي (Invalid Location)",
                status: true,
            },
            { 
                name: "ملغي من قِبل الإدارة (Canceled)",
                status: true,
            }
        ];

        console.log("   📥 Saving visit statuses...");
        await db.insert(visitStatus).values(visitStatusesData);

        console.log(`   🚀 Completed! Seeded ${visitStatusesData.length} visit statuses.`);
    },

    async rollback() {
        console.log("   🗑️ Rolling back seeded visit statuses...");
        // مسح الحالات اللي تم إدخالها بالـ UUIDs المحددة عشان لو في داتا تانية متتأثرش
        await db.delete(visitStatus).where(
            sql`id LIKE 'st111111%' OR id LIKE 'st222222%' OR id LIKE 'st333333%' OR id LIKE 'st444444%' OR id LIKE 'st555555%' OR id LIKE 'st666666%' OR id LIKE 'st777777%'`
        );
        console.log("   ✅ Rollback completed successfully.");
    },
};

export default seed;