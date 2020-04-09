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
  ListPolling,
  //  handleTwitterPolling,
  sendInvite
} = require('./handlers')
const {
  isAdmin
} = require('./helpers')

// const { listShow } = require('./API')

global.startDate = new Date()

const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: {
    webhookReply: false
  }
})
bot.telegram.getMe().then(me => { global.botId = me.id })
bot.use(session({ ttl: 1200 }))

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
      console.log('new session: ', new Date().toLocaleTimeString())
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

const list = new ListPolling(bot, db) // вынести в отдельный файл

bot.command('fs', owner, () => list.job.start())
bot.command('f', owner, () => list.job.stop())

bot.command('start', (ctx) => ctx.scene.enter('mainMenu'))
bot.hears('!tweet', isAdmin, sendInvite) // сделать бот приватным
bot.on('message', (ctx) => {
  ctx.reply('/help')
})
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
      list.job.start()
      // fkey.job.start();
    }).catch((error) => console.log(error))
  }
})
