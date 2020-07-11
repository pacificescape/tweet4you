const Telegraf = require('telegraf')
const Composer = require('telegraf/composer')
const session = require('telegraf/session')
const path = require('path')
const I18n = require('telegraf-i18n')
const rateLimit = require('telegraf-ratelimit')
const scenes = require('./scenes')
const { privateChat } = require('telegraf/composer')
const { db } = require('./database')
const { owner } = require('./middlewares')
const menu = require('./scenes')
const { ListPolling, sendInvite, addPrivateGroup } = require('./handlers')
const { isAdmin } = require('./helpers')

global.startDate = new Date()

const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: {
    webhookReply: false
  }
})

bot.telegram.getMe().then(me => { global.botId = me.id })

// session

bot.use(session({ ttl: 1200 }))

// rateLimit

const limitConfig = {
  window: 1000,
  limit: 5
}

bot.use(rateLimit(limitConfig))

// i18n

const i18n = new I18n({
  directory: path.resolve(__dirname, 'locales'),
  defaultLanguage: 'ru'
})

bot.use(i18n)

// others

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

bot.use(Composer.privateChat(menu))

const list = new ListPolling(db) // вынести в отдельный файл

bot.command('fs', owner, () => list.job.start())
bot.command('f', owner, () => list.job.stop())

bot.command('start', privateChat((ctx) => ctx.scene.enter('mainMenu')))
bot.command('tweet', isAdmin, sendInvite) // ??????
bot.on('message', privateChat((ctx) => {
  ctx.reply('/help')
}))
bot.action(/addPrivateGroup/, isAdmin, addPrivateGroup)
bot.action(/.+/, Composer.privateChat((ctx) => ctx.scene.enter('mainMenu')))
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
      list.job.start()
    }).catch((error) => console.log(error))
  }
})

module.exports = { bot }
