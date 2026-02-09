import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

class MCPClientService {
    private static instance: MCPClientService;
    client: Client;
    private tools: any[] = [];
    private initialised = false;

    private constructor() {
        this.client = new Client({
            name: 'node-mcp-client',
            version: '1.0.0',
        });
    }

    static getInstance(): MCPClientService {
        if (!this.instance) {
            this.instance = new MCPClientService();
        }
        return this.instance;
    }

    // Connect to the MCP Server

    async init() {
        if (this.initialised) return this;
        // connect to MCP server over HTTP
        const url = `${process.env.SERVER}:${process.env.PORT}/mcp`;
        const transport = new StreamableHTTPClientTransport(new URL(url));
        await this.client.connect(transport);
        this.initialised = true;
        return this;
    };

    async getTools() {
        await this.init();
        if (this.tools.length === 0) {
            const list = await this.client.listTools();
            this.tools = list.tools;
        }
        return this.tools;
    };

    // Call a specific tool by name wit unput arguments,
    async callTool(name:string, args: Record<string, any>){
        if(!this.initialised) await this.init();

        return this.client.callTool({name, arguments: args});
    };

}

export const MCPClient = MCPClientService.getInstance();