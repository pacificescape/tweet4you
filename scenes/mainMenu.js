const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
// const Extra = require('telegraf/extra')

const mainMenu = new Scene('mainMenu')

mainMenu.enter((ctx) => {
  const clavier = Markup.inlineKeyboard([
    Markup.callbackButton(ctx.i18n.t('add_twitter'), 'action=addTwitter'),
    Markup.callbackButton(ctx.i18n.t('add_channel'), 'action=addGroup')
  ]).extra({ parse_mode: 'HTML' })

  const startMessageText = ctx.i18n.t('start', {
    name: `${ctx.session.user.first_name ? ctx.session.user.first_name : ''}${ctx.session.user.last_name ? ' ' + ctx.session.user.last_name : ''}`
  })

  if (ctx.message && !ctx.message.from.is_bot) {
    ctx.replyWithHTML(startMessageText, clavier)
    return
  }
  return ctx.editMessageText(startMessageText, clavier).catch((err) => console.log(err))
})

mainMenu.action(/addTwitter/, async (ctx) => {
  ctx.scene.enter('twitterMenu')
})

mainMenu.action(/addGroup/, async (ctx) => {
  ctx.scene.enter('groupsMenu')
})

module.exports = mainMenu
