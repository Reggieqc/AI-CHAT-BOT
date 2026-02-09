import express from "express";
import { CustomerController } from "../controllers/customer.controller.ts";

const router = express.Router();

router.get("/", CustomerController.getAllCustomers);
router.get("/:id", CustomerController.getCustomerById);


export default router;