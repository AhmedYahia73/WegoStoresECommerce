"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tenantSchemaService_1 = require("../services/tenantSchemaService");
async function run() {
    console.log("==================================================");
    console.log("🚀 Starting Multi-Tenant Database Migration Runner");
    console.log("==================================================\n");
    try {
        const results = await (0, tenantSchemaService_1.migrateAllTenants)();
        console.log("\n==================================================");
        console.log("🏁 Migration Complete Summary:");
        const totalMigrated = results.length;
        const totalTablesCreated = results.reduce((sum, r) => sum + r.createdTables.length, 0);
        const totalColumnsAdded = results.reduce((sum, r) => sum + r.addedColumns.length, 0);
        const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
        console.log(`- Tenants Processed : ${totalMigrated}`);
        console.log(`- Tables Created    : ${totalTablesCreated}`);
        console.log(`- Columns Added     : ${totalColumnsAdded}`);
        console.log(`- Errors Encountered: ${totalErrors}`);
        console.log("==================================================");
        process.exit(totalErrors > 0 ? 1 : 0);
    }
    catch (error) {
        console.error("Fatal error during tenant migration:", error);
        process.exit(1);
    }
}
run();
