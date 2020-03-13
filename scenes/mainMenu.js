const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')

const mainMenu = new Scene('mainMenu')

mainMenu.enter((ctx) => {
    let clavier = Markup.inlineKeyboard([
        Markup.callbackButton(ctx.i18n.t('add_twitter'), 'action=addTwitter'),
        Markup.callbackButton(ctx.i18n.t('add_channel'), 'action=addGroup')
    ]).extra({ parse_mode: 'HTML' })

    let start_message_text = ctx.i18n.t('start', {
        name: `${ctx.session.user.first_name ? ctx.session.user.first_name : ''}${ctx.session.user.last_name ? ' ' + ctx.session.user.last_name : ''}`
    })

    ctx.editMessageText(start_message_text, clavier)
        .catch(() => ctx.replyWithHTML(start_message_text, clavier))

})

mainMenu.action(/addTwitter/, async (ctx) => {
    await ctx.answerCbQuery(`Oh, ${ctx.match[0]}! Great choice`)
    ctx.scene.enter('twitterMenu')
})

mainMenu.action(/addGroup/, async (ctx) => {
    await ctx.answerCbQuery(`Oh, ${ctx.match[0]}! Great choice`)
    ctx.scene.enter('groupsMenu')
})

module.exports = mainMenu
