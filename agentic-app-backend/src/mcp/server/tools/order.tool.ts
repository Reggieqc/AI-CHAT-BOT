import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { OrderService } from "../../../services/order.service.ts";


export function registerOrderTools(mcpServer: McpServer) {
    console.log('Registering order tools...');
    // tool 1: Get orders
    mcpServer.registerTool(
        "getOrders",
        {
            title: "Fetch all orders",
            description: "Retrieve all orders from the json data based on limit",
            inputSchema: {
                limit: z.number().optional(),
            },
            outputSchema: {
                orders: z.array(z.object({
                    _id: z.string(),
                    product: z.string(),
                    date: z.string().optional(),
                    customer: z.string(),
                    price: z.number(),
                }))
            },

        },
        async ({ limit }) => {
            console.log("Fetching orders...", limit);
            const orders = await OrderService.getLatestOrders(limit);
            return {
                content: [{ type: "text", text: JSON.stringify(orders, null, 2) }],
                structuredContent: { orders },
            };
        }
    );
    // tool 2: Get orders with Customer details
    mcpServer.registerTool(
        "getOrdersWithCustomerDetails",
        {
            title: "Fetch all orders with customer details",
            description: "Retrieve the latest orders along with customer details (name) with optional limit",
            inputSchema: {
                limit: z.number().optional(),
            },
            outputSchema: {
                orders: z.array(z.object({
                    _id: z.string(),
                    product: z.string(),
                    date: z.string().optional(),
                    customer: z.string(),
                    price: z.number(),
                })),
            },
        },
        async ({ limit }) => {
            console.log("Fetching orders with customer details...", limit);
            const orders = await OrderService.getLatestOrderWithCustomerDetails(limit);
            return {
                content: [{ type: "text", text: JSON.stringify(orders, null, 2) }],
                structuredContent: { orders },
            };
        }
    );
    // tool 3: Get order by id
    mcpServer.registerTool(
        "getOrderById",
        {
            title: "Fetch order by id",
            description: "Retrieve an order from the json data based on id",
            inputSchema: {
                id: z.string(),
            },
            outputSchema: {
                order: z.object({
                    _id: z.string(),
                    product: z.string(),
                    price: z.number(),
                    date: z.string().optional(),
                    customer: z.string(),
                })
            },
        },
        async ({ id }) => {
            const order = await OrderService.getOrderById(id);
            return {
                content: [{ type: "text", text: JSON.stringify(order, null, 2) }],
                structuredContent: { order },
            };
        }
    );
}
