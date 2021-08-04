const Task = require('../models/task')

const taskRouter = (fastify, options, done) => {

fastify.post('/tasks', async (req, reply) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        await task.save()
        reply.statusCode = 201
        reply.send(task)

    } catch (e) {
        reply.statusCode = 400
        reply.send(e)
    }
})
 // GET /tasks?completed=true(false)
 // GET /tasks?limit=10&skip=20(get third page)
 // GET /tasks?sortBy=createdAt:desc
fastify.get('/tasks', async (req, reply) => {
    const match = {}
    const sort = {}
    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        await req.user.populate(
            {
                path: 'tasks',
                match,
                options: {
                    limit: parseInt(req.query.limit),
                    skip: parseInt(req.query.skip),
                    sort
                }
            }
        ).execPopulate()
        reply.send(req.user.tasks)
    } catch (e) {
        reply.statusCode = 500
        reply.send(e)
    }
})

fastify.get('/tasks/:id', async (req, reply) => {
    const _id = req.params.id 
    try {
        const task = await Task.findOne({ _id, "owner": req.user._id })
        if (!task) {
            reply.statusCode = 404
            return reply.send()
        }
        reply.send(task)
    } catch (e) {
        reply.statusCode = 500
        reply.send(e)
    }
})

fastify.patch('/tasks/:id', async (req, reply) => {
    const _id = req.params.id
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))
    if (!isValidOperation) {
        reply.statusCode = 400
        return reply.send({error: "Invalid Updates!"})
    }

    try {
        const task = await Task.findByIdAndUpdate(_id)

        updates.forEach(update => task[update] = req.body[update])
        await task.save()
        if (!task) {
            reply.statusCode = 404
            return reply.send()
        }
        reply.send(task)
    } catch (e) {
        reply.statusCode = 400
        reply.send(e)
    }
})

fastify.delete('/tasks/:id', async (req, reply) => {
    const _id = req.params.id 

    try {
        const task = await Task.findOne({ _id, "owner": req.user._id })

        if (!task){
            reply.statusCode = 404
            return reply.send()
        }
        reply.send(task)
    } catch (e) {
        reply.statusCode = 500
        reply.send(e)
    }
})
    done()
}

module.exports = taskRouter