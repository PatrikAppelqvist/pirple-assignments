// Dependencies
const http = require('http')
const https = require('https')
const { parse } = require('url')
const { StringDecoder } = require('string_decoder')

const methods = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
    HEAD: 'HEAD'
}

/**
 * Used to trim any trailing slashes
 * 
 * @param {string} path
 * @returns {string} trimmedPath
 */
const trimPath = path => path.replace(/\/+$/g, '').toLowerCase()

/**
 * Object to hold routes added via method functions
 * Data looks like:
 * {
 *   [path]: {
 *     [method]: callback
 *   }
 * }
 */
const routes = {}

/**
 * Handler for any routes that does not exist
 * 
 * @param {object} _ not used
 * @param {object} res
 */
const notFoundHandler = (_, res) => {
    res.send(404)
}

/**
 * Parse string as json
 * 
 * @param {string} data
 * @returns {object} data as object
 * @throws {Error} error
 */
const parseAsJson = data => data && JSON.parse(data)

/**
 * Parse url, path, queryString, method, headers and body from request
 * Resolve promise with results
 * 
 * @param {object} req 
 * @returns {Promise} promise
 */
const parseRequest = req => {
    return new Promise(resolve => {
        // Parse the url as a object
        const url = parse(req.url, true)

        // Get the trimmed path from url
        const path = trimPath(url.pathname)

        // Get the query from the path
        const query = url.query

        // Obtain the method used
        const method = req.method.toUpperCase()

        // Get the headers
        const headers = req.headers

        // Get the payload if any exist
        const decoder = new StringDecoder('utf-8')
        let payloadBuffer = ''

        req.on('data', data => {
            payloadBuffer += decoder.write(data)
        })

        req.on('end', () => {
            payloadBuffer += decoder.end()
            resolve({
                path,
                query,
                method,
                headers,
                payload: payloadBuffer
            })
        })
    })
}

/**
 * Route request to correct registered handler
 * 
 * @param {object} parsedRequest
 */
const routeRequest = (req, res) => ({
    path,
    query,
    method,
    headers,
    payload
}) => {
    // Choose which routehandler to call based on path and method
    const route = routes[path] || {}
    const handler = route[method]
    const chosenHandler = handler || notFoundHandler

    // The request object sent to route handler
    // Adds on some helper functions to make it easier to work with
    const request = {
        ...req,
        path,
        query,
        method,
        headers,
        body: {
            asString: () => payload,
            asJSON: () => parseAsJson(payload)
        }
    }

    // The response object sent to route handler
    // Adds on some helper functions to make it easier to work with
    const response = {
        ...res,
        setHeaders: resHeaders => {
            Object.keys(resHeaders).forEach(key => {
                res.setHeader(key, resHeaders[key])
            })
        },
        // Set content-type header and write response with statuscode
        // Supports objects and strings
        send: (statusCode, body = {}) => {
            const contentType = typeof body === 'object' ? 'application/json' : 'text/plain'
            res.setHeader('Content-Type', contentType)
            res.writeHead(statusCode)
            res.end(JSON.stringify(body))
        }
    }

    return new Promise((resolve, reject) => {
        try {
            chosenHandler(request, response)
            resolve({})
        } catch(e) {
            console.error(`Error when handling: ${method} on path ${path}.`, e.message)
            reject(e)
        }
    })
}

/**
 * 
 * Simple router to take request, parse it and send it to registered handler
 * @param {object} req
 * @param {object} res
 */
const router = (req, res) => {
    parseRequest(req)
        .then(routeRequest(req, res))
        .catch(e => {
            // Catch any issues and send 500 internal server error to keep server alive
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(500)
            res.end(JSON.stringify({ error: e.message }))
        })
}

/**
 * Used to create an app.
 * 
 * @returns {object} App
 */
const createServer = (httpsOptions) => {
    const httpServer = http.createServer(router)

    let httpsServer
    if(httpsOptions) {
        httpsServer = https.createServer({
            key: httpsOptions.key,
            cert: httpsOptions.cert
        }, router)
    }
    
    // Helper function to register a route in routes object.
    const createRoute = method => (path, cb) => {
        const trimmedPath = trimPath(path)
        routes[trimmedPath] = routes[trimmedPath] || {}
        routes[trimmedPath][method] = cb
    }

    return {
        get: createRoute(methods.GET),
        post: createRoute(methods.POST),
        delete: createRoute(methods.DELETE),
        put: createRoute(methods.PUT),
        head: createRoute(methods.HEAD),
        listen: (port, options, cb) => {
            if(options && options.ssl) {
                if(httpsServer) {
                    httpsServer.listen(port, () => {
                        cb(port)
                    })
                } else {
                    throw new Error('Need key and cert in httpsOptions when creating server to be able to use https')
                }
            } else {
                httpServer.listen(port, () => {
                    cb(port)
                })
            }
        }
    }
}

module.exports = createServer