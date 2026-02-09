import express from "express";
import { CustomerController } from "../controllers/customer.controller.ts";
import { OrderController } from "../controllers/order.controller.ts";

const router = express.Router();

router.get("/", OrderController.getAllOrders);
router.get("/:id", OrderController.getOrderById);


export default router;