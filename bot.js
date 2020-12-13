const Telegraf = require('telegraf')
const Composer = require('telegraf/composer')
const session = require('telegraf/session')
const path = require('path')
const I18n = require('telegraf-i18n')
const rateLimit = require('telegraf-ratelimit')
const { db } = require('./database')
const {
  twitterHandler,
  channelHandler,
  startHandler
} = require('./scenes')
const {
  ListPolling
  // addPrivateGroup
} = require('./handlers')

global.startDate = new Date()

const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: {
    webhookReply: false
  }
})

const limitConfig = {
  window: 1000,
  limit: 5
}
const i18n = new I18n({
  directory: path.resolve(__dirname, 'locales'),
  defaultLanguage: 'ru'
})

bot.telegram.getMe()
  .then(me => { global.botId = me.id })
  .catch(error => console.log(error))
bot.use(session({ ttl: 1200 }))
bot.use(rateLimit(limitConfig))
bot.use(i18n)
bot.use(Composer.privateChat(async (ctx, next) => {
  const ms = new Date()

  if (ctx.from) {
    if (!ctx.session.user) {
      ctx.session.user = await db.User.update(ctx)
      console.log('new session: ', new Date().toLocaleTimeString())
    }
  }
  // if (ctx.session.user && ctx.session.user.locale) console.log(ctx.session.user.locale)
  if (ctx.callbackQuery) ctx.state.answerCbQuery = []
  return next(ctx).then(() => {
    if (ctx.callbackQuery) ctx.answerCbQuery(...ctx.state.answerCbQuery).catch((err) => console.log(err))
    console.log('Response time %sms', new Date() - ms)
  })
}))
bot.use(async (ctx, next) => {
  ctx.state.db = db

  await next()
})

bot.use(twitterHandler)
bot.use(channelHandler)
bot.use(startHandler)

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
      // const list = new ListPolling(db) // вынести в отдельный файл
      // list.job.start()
    }).catch((error) => console.log(error))
  }
})

module.exports = { bot }
