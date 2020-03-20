const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
    let clavier = Markup.inlineKeyboard([
        Markup.callbackButton(ctx.i18n.t('Validate'), 'action=addTwitter'),
    ]).extra({ parse_mode: 'HTML' })

    if (ctx.message && !ctx.message.from.is_bot) {
        ctx.replyWithHTML('validate', clavier).then((d) => console.log(d))
    }
}
