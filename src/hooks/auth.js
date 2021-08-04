const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = (fastify, options, done) => {
    console.log(options)
    const urls = ['/users/me', '/users/logout', '/users/logoutAll', '/users/me/avatar']
    fastify.addHook('onRequest', async (request, reply) => {
        if (urls.includes(request.raw.url) || request.raw.url.includes('/tasks')) {
            try {
                let token = request.headers.authorization
                token = token.replace('Bearer', '').trim()
                const decoded = jwt.verify(token, process.env.JWT_SECRET)
                const user = await User.findOne( { _id: decoded._id, 'tokens.token': token })

                if (!user) {
                    throw new Error()
                }

                request.token = token
                request.user = user
                return
            } catch (e) {
                reply.code(401)
                throw new Error('Please authonticate.')
            }
        }
        done()
        
    })
    done()
   
}

module.exports = auth