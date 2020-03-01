const Telegraf = require('telegraf');
const { db } = require('./database')

const {
    handleAddTweeter,
    handleListPolling,
    handleTwitterPolling
} = require('./handlers')

global.startDate = new Date();

const bot = new Telegraf(process.env.BOT_TOKEN, {
    telegram: {
        webhookReply: false
    }
})

// bot.use(async (ctx, next) => {
//     ctx.state.db = db

//     await next()
// })

const fkey = new handleTwitterPolling(bot)

bot.command('fkey', () => fkey.job.start())
bot.command('f', () => fkey.job.stop())

bot.on('message', () => { bot.telegram.sendMessage('@fkey124', '123') })
bot.command('add', handleAddTweeter)

// db.connection.once('open', async () => {
//     console.log('Connected to MongoDB')
//     const fkey = new handleListPolling(bot)
//     if (process.env.BOT_DOMAIN) {
//         bot.launch({
//             webhook: {
//                 domain: process.env.BOT_DOMAIN,
//                 hookPath: `/LyAdminBot:${process.env.BOT_TOKEN}`,
//                 port: process.env.WEBHOOK_PORT || 2200
//             }
//         }).then(() => {
//             console.log('bot start webhook')
//         })
//     } else {
//         bot.launch().then(() => {
//             console.log('bot start polling')
//             fkey.job.start()
//         })
//     }
// })

const list = new handleListPolling(bot)
bot.launch().then(() => {
    console.log('bot start polling')
    list.job.start()
})
