import cron from "node-cron";
import { and, eq, gt, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "../models/db";
import { packages, users } from "../models/schema";
import { sendPackageUpgradeEmail } from "../utils/sendEmails";
import { calculateSubscriptionEndDate } from "../utils/subscription";

/**
 * Checks whether a user has reached their package order limit (`users.orders == users.orders_to`)
 * and sends a one-time Arabic upgrade email to `users.email`.
 */
export async function checkAndNotifyOrderLimit(userId: string): Promise<boolean> {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      subdomain: users.subdomain,
      orders: users.orders,
      orders_to: users.orders_to,
      upgrade_notified: users.upgrade_notified,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (
    !user ||
    user.orders_to === null ||
    user.orders_to <= 0 ||
    user.orders !== user.orders_to ||
    user.upgrade_notified
  ) {
    return false;
  }

  // Atomically claim the notification flag so concurrent checks never send duplicate emails
  const [claimResult]: any = await db
    .update(users)
    .set({ upgrade_notified: true })
    .where(
      and(
        eq(users.id, user.id),
        eq(users.orders, user.orders_to),
        eq(users.upgrade_notified, false)
      )
    );

  if (!claimResult?.affectedRows) {
    return false;
  }

  try {
    await sendPackageUpgradeEmail({
      to: user.email,
      userName: user.name,
      subdomain: user.subdomain,
      orders: user.orders,
      ordersTo: user.orders_to,
    });
    console.log(`[OrderLimit] Sent package upgrade email to ${user.email} (${user.orders}/${user.orders_to})`);
    return true;
  } catch (error: any) {
    // Release claim so a future retry can deliver the email
    await db
      .update(users)
      .set({ upgrade_notified: false })
      .where(eq(users.id, user.id));
    console.error(`[OrderLimit] Failed sending upgrade email to ${user.email}:`, error?.message || error);
    return false;
  }
}

/**
 * Atomically increments `users.orders` by 1 and triggers upgrade notification if limit is reached.
 */
export async function incrementUserOrdersAndNotify(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ orders: sql`${users.orders} + 1` })
    .where(eq(users.id, userId));

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
export async function resetExpiredUsersToBasePackage(): Promise<number> {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const expiredUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(and(isNotNull(users.end_date), lt(users.end_date, todayStr)));

  if (expiredUsers.length === 0) {
    return 0;
  }

  const [firstPkg] = await db
    .select()
    .from(packages)
    .where(eq(packages.sort, 1))
    .limit(1);

  if (!firstPkg) {
    console.warn("[SubscriptionMonitor] No package found with sort = 1; skipping expired user reset.");
    return 0;
  }

  const nextEndDate = calculateSubscriptionEndDate(now);
  const expiredIds = expiredUsers.map((u) => u.id);

  await db
    .update(users)
    .set({
      orders: 0,
      orders_from: 0,
      orders_to: firstPkg.orders_to,
      package_id: firstPkg.id,
      start_date: todayStr,
      end_date: nextEndDate,
      upgrade_notified: false,
    })
    .where(inArray(users.id, expiredIds));

  console.log(
    `[SubscriptionMonitor] Reset ${expiredIds.length} expired user(s) to sort=1 package (${firstPkg.id})`
  );
  return expiredIds.length;
}

/**
 * Scans all users with `orders == orders_to` (`orders_to > 0` and not yet notified)
 * and sends the upgrade email.
 */
export async function scanOrderLimitsAndNotify(): Promise<void> {
  const candidates = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        isNotNull(users.orders_to),
        gt(users.orders_to, 0),
        eq(users.orders, users.orders_to),
        eq(users.upgrade_notified, false)
      )
    );

  for (const row of candidates) {
    await checkAndNotifyOrderLimit(row.id);
  }
}

let monitorStarted = false;

export function startOrderLimitMonitor(): void {
  if (monitorStarted) return;
  monitorStarted = true;

  let running = false;
  const runTick = async () => {
    if (running) return;
    running = true;
    try {
      await resetExpiredUsersToBasePackage();
      await scanOrderLimitsAndNotify();
    } catch (error: any) {
      console.error("[OrderLimit] Monitor tick failed:", error?.message || error);
    } finally {
      running = false;
    }
  };

  void runTick();
  cron.schedule("* * * * *", runTick);
}
