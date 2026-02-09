import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { registerCustomerTools } from "./tools/customer.tool.ts";
import { registerOrderTools } from "./tools/order.tool.ts";
import { registerWeatherTools } from "./tools/weather.tool.ts";

export function createMcpServer() {
    console.log('Creating MCP server Instance...')
    const server = new McpServer({
        name: 'agentic-app',
        version: '1.0.0',
    });

    // Register tools
    registerCustomerTools(server);
    registerOrderTools(server);
    registerWeatherTools(server);

    return server;
}