import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WeatherService } from "../../../services/weather.service.ts";
import { z } from "zod";

export function registerWeatherTools(mcpServer: McpServer) {
    console.log("Registering weather tools...");

    // tool 1 get live weather by city or region
    mcpServer.registerTool(
        "getWeatherData",
        {
            title: "Fetch weather data",
            description: "Retrieve the live weather for a given location from external API",
            inputSchema: {
                city: z.string(),
                country: z.string().optional(),
            },
            outputSchema: {
                data: z.any(), // or define a structured schema later
            },
        },
        async ({ city, country }) => {
            const query = country ? `${city},${country}` : city;
            const data = await WeatherService.fetchWeatherData(query);
            return {
                content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                structuredContent: { data },
            };
        }
    );
}
