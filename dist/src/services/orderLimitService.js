"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndNotifyOrderLimit = checkAndNotifyOrderLimit;
exports.incrementUserOrdersAndNotify = incrementUserOrdersAndNotify;
exports.resetExpiredUsersToBasePackage = resetExpiredUsersToBasePackage;
exports.scanOrderLimitsAndNotify = scanOrderLimitsAndNotify;
exports.startOrderLimitMonitor = startOrderLimitMonitor;
const node_cron_1 = __importDefault(require("node-cron"));
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../models/db");
const schema_1 = require("../models/schema");
const sendEmails_1 = require("../utils/sendEmails");
const subscription_1 = require("../utils/subscription");
/**
 * Checks whether a user has reached their package order limit (`users.orders == users.orders_to`)
 * and sends a one-time Arabic upgrade email to `users.email`.
 */
async function checkAndNotifyOrderLimit(userId) {
    const [user] = await db_1.db
        .select({
        id: schema_1.users.id,
        name: schema_1.users.name,
        email: schema_1.users.email,
        subdomain: schema_1.users.subdomain,
        orders: schema_1.users.orders,
        orders_to: schema_1.users.orders_to,
        upgrade_notified: schema_1.users.upgrade_notified,
    })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
        .limit(1);
    if (!user ||
        user.orders_to === null ||
        user.orders_to <= 0 ||
        user.orders !== user.orders_to ||
        user.upgrade_notified) {
        return false;
    }
    // Atomically claim the notification flag so concurrent checks never send duplicate emails
    const [claimResult] = await db_1.db
        .update(schema_1.users)
        .set({ upgrade_notified: true })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, user.id), (0, drizzle_orm_1.eq)(schema_1.users.orders, user.orders_to), (0, drizzle_orm_1.eq)(schema_1.users.upgrade_notified, false)));
    if (!claimResult?.affectedRows) {
        return false;
    }
    try {
        await (0, sendEmails_1.sendPackageUpgradeEmail)({
            to: user.email,
            userName: user.name,
            subdomain: user.subdomain,
            orders: user.orders,
            ordersTo: user.orders_to,
        });
        console.log(`[OrderLimit] Sent package upgrade email to ${user.email} (${user.orders}/${user.orders_to})`);
        return true;
    }
    catch (error) {
        // Release claim so a future retry can deliver the email
        await db_1.db
            .update(schema_1.users)
            .set({ upgrade_notified: false })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
        console.error(`[OrderLimit] Failed sending upgrade email to ${user.email}:`, error?.message || error);
        return false;
    }
}
/**
 * Atomically increments `users.orders` by 1 and triggers upgrade notification if limit is reached.
 */
async function incrementUserOrdersAndNotify(userId) {
    await db_1.db
        .update(schema_1.users)
        .set({ orders: (0, drizzle_orm_1.sql) `${schema_1.users.orders} + 1` })
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
    await checkAndNotifyOrderLimit(userId);
}
/**
 * Resets any user whose `end_date` has passed (`today > users.end_date`)
 * back to the first package (`packages.sort = 1`) for a fresh 1-month cycle:
 * - `orders = 0`
 * - `orders_from = 0`
 * - `orders_to = firstPkg.orders_to`
 * - `package_id = firstPkg.id`
 * - `start_date = today`, `end_date = today + 1 month`
 * - `upgrade_notified = false`
 */
async function resetExpiredUsersToBasePackage() {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const expiredUsers = await db_1.db
        .select({ id: schema_1.users.id })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.isNotNull)(schema_1.users.end_date), (0, drizzle_orm_1.lt)(schema_1.users.end_date, todayStr)));
    if (expiredUsers.length === 0) {
        return 0;
    }
    const [firstPkg] = await db_1.db
        .select()
        .from(schema_1.packages)
        .where((0, drizzle_orm_1.eq)(schema_1.packages.sort, 1))
        .limit(1);
    if (!firstPkg) {
        console.warn("[SubscriptionMonitor] No package found with sort = 1; skipping expired user reset.");
        return 0;
    }
    const nextEndDate = (0, subscription_1.calculateSubscriptionEndDate)(now);
    const expiredIds = expiredUsers.map((u) => u.id);
    await db_1.db
        .update(schema_1.users)
        .set({
        orders: 0,
        orders_from: 0,
        orders_to: firstPkg.orders_to,
        package_id: firstPkg.id,
        start_date: todayStr,
        end_date: nextEndDate,
        upgrade_notified: false,
    })
        .where((0, drizzle_orm_1.inArray)(schema_1.users.id, expiredIds));
    console.log(`[SubscriptionMonitor] Reset ${expiredIds.length} expired user(s) to sort=1 package (${firstPkg.id})`);
    return expiredIds.length;
}
/**
 * Scans all users with `orders == orders_to` (`orders_to > 0` and not yet notified)
 * and sends the upgrade email.
 */
async function scanOrderLimitsAndNotify() {
    const candidates = await db_1.db
        .select({ id: schema_1.users.id })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.isNotNull)(schema_1.users.orders_to), (0, drizzle_orm_1.gt)(schema_1.users.orders_to, 0), (0, drizzle_orm_1.eq)(schema_1.users.orders, schema_1.users.orders_to), (0, drizzle_orm_1.eq)(schema_1.users.upgrade_notified, false)));
    for (const row of candidates) {
        await checkAndNotifyOrderLimit(row.id);
    }
}
let monitorStarted = false;
function startOrderLimitMonitor() {
    if (monitorStarted)
        return;
    monitorStarted = true;
    let running = false;
    const runTick = async () => {
        if (running)
            return;
        running = true;
        try {
            await resetExpiredUsersToBasePackage();
            await scanOrderLimitsAndNotify();
        }
        catch (error) {
            console.error("[OrderLimit] Monitor tick failed:", error?.message || error);
        }
        finally {
            running = false;
        }
    };
    void runTick();
    node_cron_1.default.schedule("* * * * *", runTick);
}
