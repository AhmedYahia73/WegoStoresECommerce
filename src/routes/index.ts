import { Router } from "express";
import superAdminRoute from "./super_admin";
import uploadRoute from "./upload";
import callbacksRoute from "./callbacks";

const route = Router();

route.use("/", callbacksRoute);
route.use("/upload", uploadRoute);
route.use("/super_admin", superAdminRoute);

export default route;
