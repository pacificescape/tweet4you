const Telegraf = require('telegraf');
const CronJob = require('cron').CronJob
const { db } = require('./database')

const {
    handleGetTweets,
    handleAddTweeter
} = require('./handdlers')

global.startDate = new Date();

let last_id = 1228122315193487400
let counter = 0

const bot = new Telegraf(process.env.BOT_TOKEN, {
    telegram: {
        webhookReply: false
    }
})

bot.use(async (ctx, next) => {
    ctx.state.db = db
    ctx.state.redis = redis
    ctx.state.tg = telegram

    await next()
})

const checking = async () => {
    bot.telegram.sendMessage('@fkey124', `${counter}`)
    try {
        const posts = await handleGetTweets()
        let newPosts = []

        for (const post of posts) {
            if (post.id == last_id) {
                last_id = posts[0].id
                break
            }
            if (post.id !== last_id) {
                newPosts.push(post)
            }
        }

        if (newPosts.length > 0) {
            for (const post of newPosts) {
                bot.telegram.sendMessage('@fkey124', post.text)
            }
        }

    } catch (err) {
        bot.telegram.sendMessage('@fkey124', err)
    }

}

var job = new CronJob('*/15 * * * * *', checking, null, false, 'America/Los_Angeles', null);



bot.command('go', (ctx) => {
    job.start(ctx)
})


bot.on('message', () => { bot.telegram.sendMessage('@fkey124', '123') })
bot.command('add', handleAddTweeter)

db.connection.once('open', async () => {
    console.log('Connected to MongoDB')

    if (process.env.BOT_DOMAIN) {
        bot.launch({
            webhook: {
                domain: process.env.BOT_DOMAIN,
                hookPath: `/LyAdminBot:${process.env.BOT_TOKEN}`,
                port: process.env.WEBHOOK_PORT || 2200
            }
        }).then(() => {
            console.log('bot start webhook')
        })
    } else {
        bot.launch().then(() => {
            console.log('bot start polling')
        })
    }
})
