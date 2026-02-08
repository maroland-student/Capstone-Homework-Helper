import { IncomingMessage, ServerResponse } from "http";

import ToggleLogs, { LogLevel } from "../../utilities/toggle_logs";
import UrlUtils from "../../utilities/url_utils";

const endpoint = "/api/email-enabled";
type QueryBody = { prompt: string; image?: string };
type EmailEnabledBody = {
    user: string;
    value: string;
}

export function handles(req: IncomingMessage): boolean {
    if (req == undefined || req.url == undefined) return false;
    return req.url.startsWith(endpoint);
}

export async function handle(
    req: IncomingMessage,
    res: ServerResponse,
): Promise<void> {
    if (req.url?.startsWith(endpoint)) {
        ToggleLogs.log('Handling email enabled request..', LogLevel.INFO);

        if (req.method == 'GET') {
            // Not implemented yet
            UrlUtils.sendJson(res, 200, { enabled: true });
        } else if (req.method == 'POST') {
            // Check required body fields
            const body = (await UrlUtils.getBody(req)) as EmailEnabledBody;
            if (
                !body ||
                typeof body !== 'object' ||
                typeof body.user !== 'string' ||
                typeof body.value !== 'string'
            ) {
                UrlUtils.sendJson(res, 400, {
                    error: 'Bad Request',
                    message:
                        'Request body must contain "user" and "value" string fields.',
                });
                return;
            }

            // Set setting, not implemented yet
            UrlUtils.sendJson(res, 200, { success: true });
        } else {
            UrlUtils.sendJson(res, 405, {
                error: 'Method Not Allowed',
                message: 'Only POST requests are allowed for this endpoint.',
            });
            return;
        }
    }
}