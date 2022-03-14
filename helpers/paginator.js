const Markup = require('telegraf/markup')

module.exports = function paginator (ctx, back) {
  const { page, pages } = ctx.session

  const buttons = pages <= 1 ? back ? [Markup.callbackButton(ctx.i18n.t('nav.back'), back)] : []
    : [
      back ? Markup.callbackButton(ctx.i18n.t('nav.back'), back) : null,
      page !== 0 ? Markup.callbackButton('', '<') : null,
      page !== pages - 1 ? Markup.callbackButton('>', '>') : null
    ].filter(e => e)

  return { buttons, page, pages }
}
