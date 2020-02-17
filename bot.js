const Telegraf = require('telegraf');
const CronJob = require('cron').CronJob
const { db } = require('./database')

const handleGetTweets = require('./handdlers/handleGetTweets')

global.startDate = new Date();

let last_id = 1228122315193487400
let counter = 0

const bot = new Telegraf(process.env.BOT_TOKEN, {
    telegram: {
        webhookReply: false
    }
})

const checking = async (ctx) => {
    console.log(counter++)
    ctx.reply(counter)
    try {
        const posts = await handleGetTweets(ctx)
        let newPosts = []

        for (const post of posts) {
            if (post.id == last_id) {
                last_id = posts[0].id
                return
            }
            if (post.id !== last_id) {
                newPosts.push(post)
            }
        }

        if(newPosts.length > 0) {
            for (const post of newPosts) {
                ctx.reply(post.text)
            }
        }

    } catch (err) {
        ctx.reply(err)
    }

}

var job = new CronJob('* * * * * *', (ctx) => {
    checking(ctx)
}, null, true, 'America/Los_Angeles');



bot.command('go', () => job.start() )



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
