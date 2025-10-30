/// AI routes for interfacing with MyEdMaster AI for homework help
/// Simulated endpoints until full api access is given by John Leddo

///Endpoints
// /api/ai/get-solution
// /api/ai/get-steps
// /api/ai/classify

import { IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { StepByStepSolution, SystemsOfEquationsSubject } from '../../models/problem-classifications';
import Logs, { LogLevel } from '../../utilities/toggle_logs';
import UrlUtils from '../../utilities/url_utils';

const endpoint = '/api/ai';

const routes = {
    'get-solution': {
        expectedMethods:['GET'],
        handler: getSolution,
        queryParameters: [],
        requireBody: false,
    },
    'get-steps': {
        expectedMethods:['GET'],
        handler: getSteps,
        queryParameters: ['problem-id'],
        requireBody: true,
    },
    'classify': {
        expectedMethods:['GET'],
        handler: classify,
        queryParameters: [],
        requireBody: false,
    },
}

export function handles(req: IncomingMessage): boolean {
    if(!req.url?.startsWith(endpoint))
        return false;

    for(const key of Object.keys(routes)) {
        const expected = endpoint + '/' + key;
        const route = routes[key as keyof typeof routes];
        if(req.url?.startsWith(expected))
            return true;
    }

    return false;
}

export async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    for(const key of Object.keys(routes)) {
        const expected = endpoint + '/' + key;
        const route = routes[key as keyof typeof routes];
        if (req.url?.startsWith(expected)) {
            if (!UrlUtils.hasMethod(req, route.expectedMethods,  req.method)){
                // Invalid method
                Logs.log("Invalid method for " + expected + ". Received " + req.method, LogLevel.WARN);
                await UrlUtils.sendJson(res, 405, {
                    error: "Invalid method"
                })
                return;
            }

            if(route.queryParameters && route.queryParameters.length > 0){
                // Check required params
                const queryParams = route.queryParameters;
                const url = parse(req.url || "", true);

                for(let i = 0; i < route.queryParameters.length; i++)
                {
                    const param = route.queryParameters[i];
                    Logs.log("Checking for parameter " + param);

                    const value = url.query[param];
                    if(value === undefined){
                        Logs.log("Missing required parameter " + param);

                        await UrlUtils.sendJson(res, 400, {
                            error: "Bad request. Missing query parameters"
                        })
                        
                        return;
                    }
                }
            }

            if(route.requireBody && !UrlUtils.hasBody(req)){
                // Missing required body
                Logs.log("Missing body for endpoint " + expected);

                await UrlUtils.sendJson(res, 400, {
                    error: "Bad request"
                })
                return;
            }

            //Handle route
            await route.handler(req, res);
            return;
        }
    }
}

async function getSolution(req: IncomingMessage, res: ServerResponse): Promise<void> {
    await UrlUtils.simulateDelay(res, 200, 200, JSON.stringify({
        x: 6,
        y: 7,
    }))
}

async function getSteps(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = parse(req.url || "", true);
    const problemIdString = url.query['problem-id']
    
    // Check for valid problem id parameter
    const problemId = parseInt(
        Array.isArray(problemIdString) ? problemIdString[0] : problemIdString || ""
    );

    if(isNaN(problemId)){
        await UrlUtils.sendJson(res, 400, {
            error: "Bad request, missing query parameters"
        })
        return;
    }

    // Mock steps object
    const steps: StepByStepSolution = {
        id: -1,
        problemId: problemId,
        steps: [
            "Draw a circle",
            "Draw the rest of the owl"
        ]
    }

    await UrlUtils.simulateDelay(res, 5000, 200, JSON.stringify(steps))
}

async function classify(req: IncomingMessage, res: ServerResponse): Promise<void> {
    await UrlUtils.simulateDelay(res, 200, 200, JSON.stringify(SystemsOfEquationsSubject))
}

export default { handles, handle }