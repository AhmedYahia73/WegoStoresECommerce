import { Router } from "express";
import authRoute from "./auth";
import superAdminRoute from "./super_admin";
import uploadRoute from "./upload";
import callbacksRoute from "./callbacks";

const route = Router();

route.use("/", callbacksRoute);
route.use("/auth", authRoute);
route.use("/upload", uploadRoute);
route.use("/super_admin", superAdminRoute);

export default route;
