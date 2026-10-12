import { Router } from "express";
import superAdminRoute from "./super_admin";

const route = Router();

route.use("/super_admin", superAdminRoute);

export default route;
