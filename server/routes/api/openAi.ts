import { ErrorType, parseDatabaseError, parseNetworkError } from '@/lib/error-utils';
import { IncomingMessage, ServerResponse } from 'http';

const endpoint = '/api/openai';

export function handles(req: IncomingMessage): boolean {
    if (req == undefined || req.url == undefined)
        return false;
    return req.url.startsWith('/api/openai')
}

export async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    console.log("Handling /api/openai request...");
    try {
        
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

        console.error(`[${appError.type}] ` + endpoint + ` handler error:`, {
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