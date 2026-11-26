"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSubscriptionEndDate = calculateSubscriptionEndDate;
/**
 * Calculate subscription end date (1 month after startDate)
 */
function calculateSubscriptionEndDate(startDate = new Date()) {
    const end = new Date(startDate);
    end.setMonth(end.getMonth() + 1);
    return end.toISOString().split("T")[0];
}
