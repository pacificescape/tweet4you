const { Composer, Markup } = require('telegraf')

const composer = new Composer()

composer.use(async (ctx) => {
  const keyboard = Markup.keyboard([
    [
      ctx.i18n.t('menu.twitters'),
      ctx.i18n.t('menu.channels')
    ]
  ]).resize()

  const text = ctx.i18n.t('error.unknown')

  return await ctx.replyWithHTML(text, {
    reply_markup: keyboard
  })
    .catch((err) => console.log(err))
})

module.exports = composer
