// Dependencies
const server = require('../lib/createServer')
const config = require('./config')()

// Create app with optional HTTPS options
const app = server()

// Register route for post to /hello
// If user sends name in JSON-body, send back Hello {name} else Hello world
app.post('/hello', (req, res) => {
    const jsonBody = req.body.asJSON()
    const name = jsonBody.name || 'world'

    res.send(200, {
        message: `Hello ${name}`
    })
})

// Simple PING route for health check
app.get('/ping', (req, res) => res.send(200))

// Listen on httpPort from config with SSL false
app.listen(config.httpPort, { ssl: false }, port => {
    console.info(`App is listening for http on port: ${port}`)
})