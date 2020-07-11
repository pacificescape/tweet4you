const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  const clavier = Markup.inlineKeyboard([
    Markup.callbackButton(ctx.i18n.t('Validate'), `${ctx.from.id}=${ctx.chat.id}=addPrivateGroup`)
  ]).extra({ parse_mode: 'HTML' })

  if (ctx.message && !ctx.message.from.is_bot) {
    ctx.replyWithHTML('Add group', clavier).then((d) => console.log(d))
  }
}
