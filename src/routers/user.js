const User = require('../models/user')
const multer = require('fastify-multer') 
const sharp = require('sharp')
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }
        cb(undefined, true)
    }
  })
const { sendWelcomeEmail, sendCancelEmail } = require('../emails/account')

const userRouter = (fastify, options, done) => {
fastify.post('/users', async (req, reply) => {
    const user = new User(req.body)
    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        reply.statusCode = 201
        reply.send({ user, token })
     } catch (e) {
        reply.statusCode = 400
        reply.send(e)
     }
})

fastify.post('/users/login', async (req, reply) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        reply.send({ user, token })
    } catch (e) {
        reply.statusCode = 400
        reply.send()
    }
})

fastify.post('/users/logout', async (req, reply) => {
    try {
        req.user.tokens = req.user.tokens.filter(res => res.token !==req.token)
        await req.user.save()
        reply.send()
    } catch (e) {
        reply.statusCode = 500
        reply.send(e)
    }
})

fastify.post('/users/logoutAll', async (req, reply) => {
    try {
        req.user.tokens = []
        await req.user.save()
        reply.statusCode = 200
        reply.send()
    } catch (e) {
        reply.statusCode = 500
        reply.send(e)
    }
})

fastify.get('/users/me', async (req, reply) => {
    reply.send(req.user)
})

fastify.get('/users/:id', async (req, reply) => {
    const _id = req.params.id

    try {
        const user = await User.findById(_id)
        if (!user) {
            reply.statusCode = 404
            return reply.send()
        }
        reply.send(user)
    } catch (e) {
        reply.statusCode = 500
        reply.send(e)
    }
})

fastify.patch('/users/me', async (req, reply) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if (!isValidOperation) {
        reply.statusCode = 400
        return reply.send({ error: 'Invalid updates!' })
    }
    try {
        updates.forEach(update => req.user[update] = req.body[update])
        await req.user.save()
        reply.send(req.user)
    } catch (e) {
        reply.statusCode = 400
        reply.send(e)
    }
})

fastify.delete('/users/me', async (req, reply) => {
    try {
        await req.user.remove()
        sendCancelEmail(req.user.email, req.user.name)
        reply.send(req.user)
    } catch (e) {
        reply.statusCode = 500
        reply.send(e)
    }
})

fastify.post('/users/me/avatar', { preHandler: upload.single('avatar') },
async (req, reply) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    reply.code(200).send('SUCCESS')
})

fastify.delete('/users/me/avatar', async (req, reply) => {
    req.user.avatar = undefined 
    await req.user.save()
    reply.code(200).send()
})

fastify.get('/users/:id/avatar', async (req, reply) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        reply.header('Content-Type', 'image/png')
        reply.send(user.avatar)
    } catch(e) {
        reply.code(404).send()
    }
})
done()
}

module.exports = userRouter