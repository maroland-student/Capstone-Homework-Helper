import { IncomingMessage, ServerResponse } from 'http';
import Log, { LogLevel } from './toggle_logs';

export function getUrl(req: IncomingMessage) {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    return url;
}

export function getQuery(req: IncomingMessage) {
    const url = getUrl(req);
    return url.searchParams;
}

export function getPath(req: IncomingMessage) {
    const url = getUrl(req);
    return url.pathname;
}

export function parseCookies(req: IncomingMessage) {
    const header = req.headers.cookie
    if (!header) return {}

    return Object.fromEntries(
        header.split(';').map(c => {
            const [key, value] = c.trim().split('=')
            return [key, decodeURIComponent(value)]
        })
    )
}

export async function getBody(req: IncomingMessage) {
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk)
    const raw = Buffer.concat(chunks).toString()
    if (!raw)
        return null
    try {
        return JSON.parse(raw)
    } catch {
        console.log("Unable to parse json, returning string")
        return raw
    }
}

export function sendJson(res: ServerResponse, status: number, data: any) {
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
}

export function sendText(res: ServerResponse, status: number, data: string) {
    res.writeHead(status, { 'Content-Type': 'text/plain' })
    res.end(data)
}

export function sendHtml(res: ServerResponse, status: number, data: string) {
    res.writeHead(status, { 'Content-Type': 'text/html' })
    res.end(data)
}

export function notFound(res: ServerResponse): void;
export function notFound(res: ServerResponse, errorMessage: string): void;
export function notFound(res: ServerResponse, errorMessage?: string): void {
    sendJson(res, 404, {
        error: errorMessage ?? 'Not Found'
    })
}

export async function simulateDelay(res: ServerResponse, milliseconds: number, status: number, data: string) {
    if (milliseconds < 0)
        milliseconds = 1;

    Log.log("Simulating delay of " + milliseconds + "ms", LogLevel.DEBUG);

    await new Promise(resolve => setTimeout(resolve, milliseconds));

    Log.log("Simulating delay finished", LogLevel.DEBUG);

    sendText(res, status, data);
}

export function hasMethod(req: IncomingMessage, allowedMethods: string[], target: string | undefined): boolean {
    if (!req || req == undefined)
        return true;

    if (!allowedMethods || allowedMethods.length == 0)
        return true;

    if (target == undefined || target === "")
        return false;

    for (const allowed of allowedMethods) {
        if (allowed === target)
            return true;

        if (allowed.toLowerCase() === target.toLowerCase())
            return true;
    }


    return false;
}

export function hasBody(req: IncomingMessage): boolean {
    const body = getBody(req);
    return body != undefined;
}

export function hasRequiredQueryParams(queryParams: string[], req: IncomingMessage | null = null,  params: Record<string, string> | null = null): boolean {
    // Ensure at least one of req or params is provided
    if(req == null && params == null)
        return false;

    // If params not provided, extract from req
    if(params == null || params == undefined)
        params = getQueryParams(req);

    for(const key of queryParams){
        if(!(key in params)) return false;
    }

    return true;
}

export function getQueryParams(req: IncomingMessage | null): Record<string, string> {
    if(req == null || req == undefined || req.url == undefined)
        return {};

    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const params: Record<string, string> = {};

    for (const [key, value] of url.searchParams.entries()) {
        params[key] = value;
    }

    return params;
}

export default { getUrl, getQuery, getPath, parseCookies, getBody, sendJson, sendText, sendHtml, notFound, simulateDelay, hasBody, hasRequiredQueryParams, hasMethod, getQueryParams }