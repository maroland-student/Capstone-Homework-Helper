import { IncomingMessage, ServerResponse } from 'http';

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

export function parseCookies(req: IncomingMessage){
    const header = req.headers.cookie
    if(!header) return {}

    return Object.fromEntries(
        header.split(';').map(c => {
            const[key, value] = c.trim().split('=')
            return [key, decodeURIComponent(value)]
        })
    )
}

export async function getBody(req: IncomingMessage) {
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk)
    const raw = Buffer.concat(chunks).toString()
    if (!raw) return null

    try {
        return JSON.parse(raw)
    } catch {
        return raw
    }
}

export function sendJson(res: ServerResponse, status: number, data: any){
    res.writeHead(status, { 'Content-Type': 'application/json'})
    res.end(JSON.stringify(data))
}

export function sendText(res: ServerResponse, status: number, data: string){
    res.writeHead(status, { 'Content-Type': 'text/plain'})
    res.end(data)
}

export function sendHtml(res: ServerResponse, status: number, data: string){
    res.writeHead(status, { 'Content-Type': 'text/html'})
    res.end(data)
}

export function notFound(res: ServerResponse): void;
export function notFound(res: ServerResponse, errorMessage: string): void;
export function notFound(res: ServerResponse, errorMessage?: string): void {
  sendJson(res, 404, { error: errorMessage ?? 'Not Found' })
}

export default { getUrl, getQuery, getPath, parseCookies, getBody, sendJson, sendText, sendHtml, notFound }