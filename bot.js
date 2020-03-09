const Telegraf = require('telegraf')
const session = require('telegraf/session')
const path = require('path')
const I18n = require('telegraf-i18n')
const scenes = require('./scenes')
const { db } = require('./database')
const {
    owner
} = require('./middlewares')
const menu = require('./scenes')
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
bot.use(session())

// const { match } = I18n
const i18n = new I18n({
  directory: path.resolve(__dirname, 'locales'),
  defaultLanguage: 'ru'
})

bot.use(i18n)

bot.use(async (ctx, next) => {
    const ms = new Date()

    if (ctx.from) {
      if (!ctx.session.user) {
        ctx.session.user = await db.User.update(ctx)
      }
    }
    // if (ctx.session.user && ctx.session.user.locale) console.log(ctx.session.user.locale)
    if (ctx.callbackQuery) ctx.state.answerCbQuery = []
    return next(ctx).then(() => {
      if (ctx.callbackQuery) ctx.answerCbQuery(...ctx.state.answerCbQuery).catch((err) => console.log(err))
      console.log('Response time %sms', new Date() - ms)
    })
  })


bot.use(async (ctx, next) => {
    ctx.state.db = db

    await next()
})


bot.use(menu)

const fkey = new handleTwitterPolling(bot, db, 'fkey123');
const list = new handleListPolling(bot); // вынести в отдельный файл

bot.command('fkey', owner, () => fkey.job.start())
bot.command('f', owner, () => fkey.job.stop())
bot.command('add', handleAddTweeter)

bot.command('start', (ctx) => ctx.scene.enter('mainMenu'))
bot.on('message', (ctx) => ctx.reply(ctx.message.text))
bot.action(/.+/, (ctx) => ctx.scene.enter('mainMenu'))
bot.use(scenes.middleware())


db.connection.once('open', async () => {
    console.log('Connected to MongoDB')
    if (process.env.BOT_DOMAIN) {
        bot.launch({
            webhook: {
                domain: process.env.BOT_DOMAIN,
                hookPath: `/tweet3bot:${process.env.BOT_TOKEN}`,
                port: process.env.WEBHOOK_PORT || 2200
            }
        }).then(() => {
            console.log('bot start webhook')
        }).catch((error) => console.log(error))
    } else {
        bot.launch().then(() => {
            console.log('bot start polling')
            // list.job.start();
            // fkey.job.start();
        }).catch((error) => console.log(error))
    }
})
