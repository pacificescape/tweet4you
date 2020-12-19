const Composer = require('telegraf/composer')
const Markup = require('telegraf/markup')
const { match } = require('telegraf-i18n')

const composer = new Composer()

composer.start(async ctx => {
  const keyboard = Markup.keyboard([
    [
      ctx.i18n.t('menu.twitters'),
      ctx.i18n.t('menu.channels')
    ]
  ]).resize()

  const startMessageText = ctx.i18n.t('start', {
    name: `${ctx.session.user.first_name ? ctx.session.user.first_name : ''}${ctx.session.user.last_name ? ' ' + ctx.session.user.last_name : ''}`
  })

  if (ctx.message && !ctx.message.from.is_bot) {
    ctx.replyWithHTML(startMessageText, {
      reply_markup: keyboard
    }).catch((err) => console.log(err))
    return
  }
  return ctx.editMessageText(startMessageText, {
    reply_markup: keyboard
  }).catch((err) => console.log(err))
})
composer.hears(match('menu.twitters'), ctx => ctx.scene.enter('mainMenu'))
composer.hears(match('menu.channels'), ctx => ctx.scene.enter('mainMenu'))

module.exports = composer
