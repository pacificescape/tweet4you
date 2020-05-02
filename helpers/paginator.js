const Markup = require('telegraf/markup')

module.exports = function paginator (ctx, yaml, cbq) {
  const { page, pages } = ctx.session

  const buttons = pages === 1 ? [Markup.callbackButton(yaml, cbq)]
    : [
      Markup.callbackButton(yaml, cbq),
      page !== 0 ? Markup.callbackButton('<', '<') : Markup.callbackButton('|', '|'),
      page !== pages - 1 ? Markup.callbackButton('>', '>') : Markup.callbackButton('|', '|')
    ].filter(e => e)

  return { buttons, page, pages }
}
