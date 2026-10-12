"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticated_1 = require("../../middlewares/authenticated");
const auth_1 = __importDefault(require("./auth"));
const admins_1 = __importDefault(require("./admins"));
const paymentMethods_1 = __importDefault(require("./paymentMethods"));
const users_1 = __importDefault(require("./users"));
const router = (0, express_1.Router)();
// Public Super Admin Auth Route (Login via `admins` table)
router.use("/auth", auth_1.default);
// Protected Super Admin Routes (Must be logged in at `admins` table)
router.use(authenticated_1.authenticated);
router.use("/admins", admins_1.default);
router.use("/payment_methods", paymentMethods_1.default);
router.use("/users", users_1.default);
exports.default = router;
