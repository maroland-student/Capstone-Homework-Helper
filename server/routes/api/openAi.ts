import { ErrorType, parseDatabaseError, parseNetworkError } from '@/lib/error-utils';
import { IncomingMessage, ServerResponse } from 'http';

import { OpenAIHandler } from '@/utilities/openAiUtility';
import ToggleLogs, { LogLevel } from '../../utilities/toggle_logs';
import UrlUtils from '../../utilities/url_utils';

const endpoint = '/api/openai';
type QueryBody = { prompt: string; image?: string };

export function handles(req: IncomingMessage): boolean {
    if (req == undefined || req.url == undefined)
        return false;
    return req.url.startsWith('/api/openai')
}

export async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if(req.url?.startsWith('/api/openai/math-problem')){
        ToggleLogs.log('Handling OpenAI math problem request..', LogLevel.INFO);

        // Filter only GET requests
        if(req.method !== 'GET'){
            ToggleLogs.log('Math problem endpoint only handles GET. Received: ' + req.method, LogLevel.WARN);
            UrlUtils.sendJson(res,405, { 
                error: 'Method Not Allowed', 
                message: 'Only GET requests are allowed for this endpoint.' 
            });
            return;
        }

        // Generate Algebra 1 problem
        try{
            ToggleLogs.log('Generating Algebra 1 word problem...', LogLevel.INFO);
            OpenAIHandler.generateAlgebra1Problem().then((problemText) => {
                ToggleLogs.log(`Generated problem: ${problemText.substring(0, 100)}...`, LogLevel.DEBUG);
                UrlUtils.sendJson(res,200, { 
                    problem: problemText 
                });
            }).catch((err) => {
                ToggleLogs.log('Error generating math problem: ' + err, LogLevel.CRITICAL);
                UrlUtils.sendJson(res,500, { 
                    error: 'Internal Server Error', 
                    message: 'An error occurred while generating the math problem.' 
                });
            });
        }catch(err){
            ToggleLogs.log('Error processing math problem request: ' + err, LogLevel.CRITICAL);
            UrlUtils.sendJson(res,500, { 
                error: 'Internal Server Error', 
                message: 'An error occurred while processing the request.' 
            });
        }

        return;
    }

    if(req.url?.startsWith('/api/openai/query')){
        ToggleLogs.log('Handling OpenAI query request..', LogLevel.INFO);

        // Filter only POST requests
        if(req.method !== 'POST'){
            // Only POST requests are allowed for this endpoint
            ToggleLogs.log('Query endpoint only handles POST. Received: ' + req.method, LogLevel.WARN);
            UrlUtils.sendJson(res,405, { 
                error: 'Method Not Allowed', 
                message: 'Only POST requests are allowed for this endpoint.' 
            });
            return;
        }

        // Check request json for required fields
        const body = (await UrlUtils.getBody(req) as QueryBody);
        if(!body || typeof body !== 'object'){
            ToggleLogs.log(`Invalid request body for OpenAI query endpoint. Body: ${body}`, LogLevel.WARN);
            UrlUtils.sendJson(res,400, { 
                error: 'Bad Request', 
                message: 'Request body must be a valid JSON object.' 
            });
            return;
        }

        const { prompt: userPrompt, image } = body;

        if (typeof userPrompt !== 'string' || !userPrompt.trim()) {
            UrlUtils.sendJson(res, 400, { 
                error: 'Bad Request', 
                message: 'Field "prompt" is required.' });
            return;
        }

        //Send request to util
        try{
            if(typeof image === 'string' && userPrompt.trim()){
                // Image analysis request
                ToggleLogs.log(`Sending image analysis prompt to OpenAI=${body.prompt} with image bytes=${body.image}...`, LogLevel.INFO);

                // Get image bytes
                if(!body.image){
                    UrlUtils.sendJson(res, 400, { 
                        error: 'Bad Request', 
                        message: 'Missing image data' });
                    return;
                }

                OpenAIHandler.generateFromImage(body.prompt, body.image).then((responseText) => {
                    ToggleLogs.log(`Received response from OpenAI=${responseText}`, LogLevel.DEBUG);
                    UrlUtils.sendJson(res,200, { 
                        response: responseText 
                    });
                });
            }else{
                // Text generation request
                ToggleLogs.log(`Sending text prompt to OpenAI=${body.prompt}...`, LogLevel.INFO);
                OpenAIHandler.generateText(body.prompt).then((responseText) => {
                    ToggleLogs.log(`Received response from OpenAI=${responseText}`, LogLevel.DEBUG);
                    UrlUtils.sendJson(res,200, { 
                        response: responseText 
                    });
                });
            }
        }catch(err){
            ToggleLogs.log('Error processing OpenAI query request: ' + err, LogLevel.CRITICAL);
            UrlUtils.sendJson(res,500, { 
                error: 'Internal Server Error', 
                message: 'An error occurred while processing the request.' 
            });
        }

        return
    }

    try {
        UrlUtils.simulateDelay(res, 500, 200, 'Mocked OpenAI response')
        return
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