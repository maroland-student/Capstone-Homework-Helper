import dotenv from 'dotenv'
import { createServer } from 'http'
import { auth } from '../lib/auth'

// load environment variables
dotenv.config({ path: '.env' })

const PORT = process.env.PORT || 3000

// create HTTP server for Better Auth
const server = createServer(async (req, res) => {
  // get the origin from the request
  const origin = req.headers.origin
  
  // set CORS headers for Expo - handle credentials properly
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

  // preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  // check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      auth: 'Better Auth configured'
    }))
    return
  }

  // handle Better Auth routes
  if (req.url?.startsWith('/api/auth')) {
    try {
      // convert Node.js request to Web API Request
      const url = new URL(req.url, `http://${req.headers.host}`)
      
      // read body for POST/PUT requests
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
      
      // set response headers
      response.headers.forEach((value, key) => {
        res.setHeader(key, value)
      })
      
      res.writeHead(response.status)
      res.end(await response.text())
    } catch (error) {
      console.error('Better Auth handler error:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ 
        error: 'Internal server error',
        message: 'Something went wrong'
      }))
    }
    return
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

// start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Better Auth configured`)
  console.log(`Auth endpoints available at http://localhost:${PORT}/api/auth`)
})

export default server