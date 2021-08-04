const fastify = require('fastify')({
    logger: true
})
const fp = require('fastify-plugin')
const helmet = require('fastify-helmet')
const multer = require('fastify-multer') 
require('./db/mongoose')

const port = process.env.PORT

fastify.setErrorHandler(function (error, request, reply) {
  reply.code(400).send({error: error.message, from: error.name})
})
fastify.register(helmet)
//fastify.register(require('./emails/account'))
fastify.register(multer.contentParser)
// hooks
fastify.register(fp(require('./hooks/auth')))

// routes
fastify.register(require('./routers/user'))
fastify.register(require('./routers/task'))
// emails


fastify.listen(port, err => {
    if (err) throw err
    console.log(`server listening on ${fastify.server.address().port}`)
})