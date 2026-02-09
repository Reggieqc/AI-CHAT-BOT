import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { custom, z } from "zod";
import { CustomerService } from "../../../services/customer.service.ts";

export function registerCustomerTools(mcpServer: McpServer) {
    console.log('Registering Customer tools...');
    // tool 1: get customers
    mcpServer.registerTool(
        "getCustomers",
        {
            title: "Fetch all customers",
            description: "Retrieve all customers from the json data based on limit",
            inputSchema: {
                limit: z.number().optional(),
            },
            outputSchema: {
                customers: z.array(z.object({
                    _id: z.string(),
                    name: z.string(),
                    email: z.string(),
                    joinedAt: z.string(),
                })),
            },
        },
        async ({ limit }) => {
            console.log("Fetching customers...", limit);
            const customers = await CustomerService.getLatestCustomers(limit);
            return {
                content: [{ type: "text", text: JSON.stringify(customers, null, 2) }],
                structuredContent: { customers },
            };

        }
    );
    // tool 2: get customer by id
    mcpServer.registerTool(
        "getCustomerById",
        {
            title: "Fetch customer by id",
            description: "Retrieve a customer from the json data based on id",
            inputSchema: {
                id: z.string(),
            },
            outputSchema: {
                customer: z.object({
                    _id: z.string(),
                    name: z.string(),
                    email: z.string(),
                    joinedAt: z.string(),
                })
            }
        },
        async ({ id }) => {
            const customer = await CustomerService.getCustomerById(id);
            return {
                content: [{ type: "text", text: JSON.stringify(customer, null, 2) }],
                structuredContent: { customer },
            }
        }
    )
}