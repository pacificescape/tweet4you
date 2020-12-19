const Markup = require('telegraf/markup')

module.exports = async (error, ctx) => {
  const type = `<b>${ctx.updateType}</b>`
  const stack = `<code>${error.stack}</code>`
  const from = (ctx.from && ctx.from.id) ? `\n\n<a href="tg://user?id=${ctx.from.id}">${ctx.from.id}</a>\n\n` : '\n\n'
  const text = `${type}${from}${stack}`

  await ctx.replyWithHTML(ctx.i18n.t('error.message', {
    admin: process.env.OWNER_ID
  }), {
    reply_markup: Markup.keyboard([
      [
        ctx.i18n.t('menu.twitters'),
        ctx.i18n.t('menu.channels')
      ]
    ]).resize()
  }).catch(() => {})

  await ctx.telegram.sendMessage(process.env.OWNER_ID, text, {
    parse_mode: 'HTML'
  }).catch(() => {})

  console.error(`error for ${ctx.updateType}`, error)
}
