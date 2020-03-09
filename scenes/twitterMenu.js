const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')

const twitterMenu = new Scene('twitterMenu')
let buttons

twitterMenu.enter((ctx) => {
    buttons = [
        Markup.callbackButton(ctx.i18n.t('back'), `back`),
        Markup.callbackButton('>', '>')
    ]

    let twitters = ctx.session.user.twitters.map((v) => {
        return Markup.callbackButton(v.screen_name, `manage=${v.id}`)
    })

    ctx.replyWithHTML(ctx.i18n.t('twitterMenu', {
        twitters: twitters.length
    }),
        Markup.inlineKeyboard(twitters.concat(buttons)).extra()
    )
})

twitterMenu.action(/manage=(.+)/, async (ctx) => {
    console.log(ctx.match)
    await ctx.answerCbQuery(`Oh, ${ctx.match}! Great choice`).catch((err) => console.log(err))
})

twitterMenu.hears(/twitter.com/, (ctx) => ctx.state.db.Twitter.update(ctx))
twitterMenu.action('back', (ctx) => ctx.scene.enter('mainMenu'))
twitterMenu.action('>', (ctx) => ctx.reply('\\(\'>\')/'))

module.exports = twitterMenu
