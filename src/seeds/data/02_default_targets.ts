// src/seeds/02_default_targets.ts

import { db } from "../../models/db";
import { targets } from "../../models/schema";
import { Seed } from "../runner";
import { sql } from "drizzle-orm";

const seed: Seed = {
    name: "02_default_targets",

    async run() {
        console.log("   📝 Inserting rich set of default targets...");

        const targetsData = [
            // 🎯 أهداف المبيعات (Sales Targets) - مبالغ مالية أو صفقات مغلقة
            { 
                name: "تارجت مبيعات الربع السنوي الأول (Q1)",
                type: "sales" as const,
                number: 150000.00, // مثلاً 150 ألف جنيه/دولار
            },
            { 
                name: "تارجت مبيعات الربع السنوي الثاني (Q2)",
                type: "sales" as const,
                number: 250000.00,
            },
            { 
                name: "تارجت مبيعات الموظفين المبتدئين شهرياً",
                type: "sales" as const,
                number: 15000.00,
            },
            { 
                name: "تارجت مبيعات كبار العملاء (VIP)",
                type: "sales" as const,
                number: 500000.00,
            },

            // 🚗 أهداف الزيارات (Visits Targets) - عدد زيارات للعملاء على الأرض أو الاجتماعات
            { 
                name: "تارجت زيارات المبيعات الخارجية الأسبوعي",
                type: "visit" as const,
                number: 20.00, // 20 زيارة ميدانية في الأسبوع
            },
            { 
                name: "تارجت زيارات عملاء العقارات شهرياً",
                type: "visit" as const,
                number: 80.00,
            },
            { 
                name: "تارجت اجتماعات الـ Zoom والـ Online اليومي",
                type: "visit" as const,
                number: 5.00, // 5 اجتماعات يومياً لكل مندوب
            },
            { 
                name: "تارجت زيارات المتابعة والدعم الفني",
                type: "visit" as const,
                number: 12.00,
            }
        ];

        console.log("   📥 Saving targets...");
        await db.insert(targets).values(targetsData);

        console.log(`   🚀 Completed! Seeded ${targetsData.length} diverse targets.`);
    },

    async rollback() {
        console.log("   🗑️ Rolling back seeded targets...");
        // حذف البيانات بناءً على الـ UUIDs المحددة التي تم إدخالها فقط
        await db.delete(targets).where(
            sql`id LIKE 't1111111%' OR id LIKE 't2222222%' OR id LIKE 't3333333%' OR id LIKE 't4444444%' OR id LIKE 't5555555%' OR id LIKE 't6666666%' OR id LIKE 't7777777%' OR id LIKE 't8888888%'`
        );
        console.log("   ✅ Rollback completed successfully.");
    },
};

export default seed;