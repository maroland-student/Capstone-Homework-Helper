import { auth } from '@/lib/auth';
import { ErrorType, parseDatabaseError, parseNetworkError } from '@/lib/error-utils';
import { IncomingMessage, ServerResponse } from 'http';

const endpoint = '/api/auth';

export function handles(req: IncomingMessage): boolean {
    if (req == undefined || req.url == undefined)
        return false;
    return req.url.startsWith(endpoint)
}

export async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    console.log("Handling /api/auth request...");
    try {
        if (req.url == undefined || req.method == undefined || req.headers == undefined) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            return
        }
        const url = new URL(req.url, `http://${req.headers.host}`)

        let body: string | undefined
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            const chunks: Buffer[] = []
            req.on('data', (chunk) => chunks.push(chunk))
            await new Promise((resolve) => req.on('end', resolve))
            body = Buffer.concat(chunks).toString()
        }

        const webRequest = new Request(url.toString(), {
            method: req.method,
            headers: req.headers as HeadersInit,
            body: body,
        })

        const response = await auth.handler(webRequest)

        response.headers.forEach((value, key) => {
            res.setHeader(key, value)
        })

        res.writeHead(response.status)
        res.end(await response.text())
    } catch (error: any) {
        let appError;

        if (error?.message?.includes('ECONNRESET') ||
            error?.message?.includes('connection') ||
            error?.code === 'ECONNRESET') {
            appError = parseDatabaseError(error);
        } else if (error?.message?.includes('timeout') ||
            error?.message?.includes('TIMEOUT')) {
            appError = parseNetworkError(error);
        } else {
            appError = {
                type: ErrorType.INTERNAL_ERROR,
                message: error?.message || 'Unknown error',
                userMessage: 'Internal server error',
                code: error?.code || 'UNKNOWN',
                details: { originalError: error }
            };
        }

        console.error(`[${appError.type}] Better Auth handler error:`, {
            message: appError.message,
            code: appError.code,
            details: appError.details,
            timestamp: new Date().toISOString()
        });

        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
            error: 'Internal server error',
            message: 'Something went wrong',
            code: appError.code
        }))
    }
}

export default { handles, handle }