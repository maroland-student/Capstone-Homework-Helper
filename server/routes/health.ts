import { IncomingMessage, ServerResponse } from 'http';

const endpoint = '/health';

export function handles(req: IncomingMessage): boolean {
    return req.url === endpoint;
}

export async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    console.log("Handling /health request...");
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      auth: 'Better Auth configured'
    }))
}

export default {handles, handle}