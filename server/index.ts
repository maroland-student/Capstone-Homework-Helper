import dotenv from 'dotenv'
import { createServer } from 'http'

import ApiAuth from './routes/api/auth'
import ApiOpenAi from './routes/api/openAi'
import Health from './routes/health'
import Log, { LogLevel } from './utilities/toggle_logs'

dotenv.config({ path: '.env' })

const PORT = process.env.PORT || 3000

const ROUTES = [
  // ApiAuth,
  // Health,
  ApiOpenAi
]

const server = createServer(async (req, res) => {
  const origin = req.headers.origin
  
  if (origin && (
    origin.includes('localhost') || 
    origin.includes('127.0.0.1') || 
    origin.includes('192.168.') ||
    origin.includes('10.0.2.2') ||
    origin.startsWith('exp://') ||
    origin.startsWith('capstone-exploration://')
  )) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*')
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With, Accept, Origin')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  // /health endpoint
  if(Health.handles(req)){
    await Health.handle(req, res)
    return
  }
  // if (req.url === '/health') {
  //   res.writeHead(200, { 'Content-Type': 'application/json' })
  //   res.end(JSON.stringify({ 
  //     status: 'OK', 
  //     timestamp: new Date().toISOString(),
  //     auth: 'Better Auth configured'
  //   }))
  //   return
  // }

  // /api/auth endpoints
  if(ApiAuth.handles(req)){
    await ApiAuth.handle(req, res)
    return
  }
  // if (req.url?.startsWith('/api/auth')) {
    // try {
    //   const url = new URL(req.url, `http://${req.headers.host}`)
      
    //   let body: string | undefined
    //   if (req.method !== 'GET' && req.method !== 'HEAD') {
    //     const chunks: Buffer[] = []
    //     req.on('data', (chunk) => chunks.push(chunk))
    //     await new Promise((resolve) => req.on('end', resolve))
    //     body = Buffer.concat(chunks).toString()
    //   }
      
    //   const webRequest = new Request(url.toString(), {
    //     method: req.method,
    //     headers: req.headers as HeadersInit,
    //     body: body,
    //   })
      
    //   const response = await auth.handler(webRequest)
      
    //   response.headers.forEach((value, key) => {
    //     res.setHeader(key, value)
    //   })
      
    //   res.writeHead(response.status)
    //   res.end(await response.text())
    // } catch (error: any) {
    //   let appError;
      
    //   if (error?.message?.includes('ECONNRESET') || 
    //       error?.message?.includes('connection') ||
    //       error?.code === 'ECONNRESET') {
    //     appError = parseDatabaseError(error);
    //   } else if (error?.message?.includes('timeout') || 
    //              error?.message?.includes('TIMEOUT')) {
    //     appError = parseNetworkError(error);
    //   } else {
    //     appError = {
    //       type: ErrorType.INTERNAL_ERROR,
    //       message: error?.message || 'Unknown error',
    //       userMessage: 'Internal server error',
    //       code: error?.code || 'UNKNOWN',
    //       details: { originalError: error }
    //     };
    //   }
      
    //   console.error(`[${appError.type}] Better Auth handler error:`, {
    //     message: appError.message,
    //     code: appError.code,
    //     details: appError.details,
    //     timestamp: new Date().toISOString()
    //   });
      
    //   res.writeHead(500, { 'Content-Type': 'application/json' })
    //   res.end(JSON.stringify({ 
    //     error: 'Internal server error',
    //     message: 'Something went wrong',
    //     code: appError.code
    //   }))
    // }
  // }

  // AI routes
  for (const route of ROUTES) {
    if(route.handles(req)){
      Log.log(`Routing ${req.method} ${req.url} to handler`, LogLevel.INFO)
      await route.handle(req, res)
      return
    }
  }

  // Overflow catch requests that don't match any route
  Log.log(`404 Not Found: ${req.method} ${req.url}`, LogLevel.WARN)
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Better Auth configured`)
  console.log(`Auth endpoints available at http://localhost:${PORT}/api/auth`)
})

export default server