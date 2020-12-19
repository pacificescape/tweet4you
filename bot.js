const Telegraf = require('telegraf')
const Composer = require('telegraf/composer')
const session = require('telegraf/session')
const path = require('path')
const I18n = require('telegraf-i18n')
const rateLimit = require('telegraf-ratelimit')
const { db } = require('./database')
const {
  privateHandlers,
  twitterHandler,
  channelHandler,
  startHandler,
  unknownHandler
} = require('./composers')
const {
  ListPolling,
  errorHandler
  // addPrivateGroup
} = require('./handlers')
const { userMiddleware } = require('./middlewares')

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

bot.on(['channel_post', 'edited_channel_post',], () => { })

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
bot.catch(errorHandler)
bot.use(async (ctx, next) => {
  ctx.state.db = db
  console.log(ctx.updateType)
  console.log(ctx.callbackQuery)
  await next()
})
bot.use(Composer.privateChat(userMiddleware))
bot.use(Composer.privateChat(twitterHandler))
bot.use(Composer.privateChat(channelHandler))
bot.use(Composer.privateChat(startHandler))
bot.use(Composer.privateChat(unknownHandler))

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
      const list = new ListPolling(db) // вынести в отдельный файл
      // list.job.start()
    }).catch((error) => console.log(error))
  }
})

module.exports = { bot }
