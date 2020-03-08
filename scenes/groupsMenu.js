const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')

const groupsMenu = new Scene('groupsMenu')
let buttons

groupsMenu.enter((ctx) => {
    buttons = [
        Markup.callbackButton(ctx.i18n.t('back'), `back`),
        Markup.callbackButton('>', '>')
    ]

    let groups = ctx.session.user.groups.map((v) => {
        Markup.callbackButton(v.screen_name, `manage=${v.id}`)
    })

    ctx.replyWithHTML(ctx.i18n.t('groupsMenu', {
        groups: groups.length
    }),
        Markup.inlineKeyboard(groups.concat(buttons)).extra()
    )
})

groupsMenu.action(/manage/, async (ctx) => {
    console.log(ctx.match)
    await ctx.answerCbQuery(`Oh, ${ctx.match}! Great choice`).catch((err) => console.log(err))
})

groupsMenu.action('back', (ctx) => ctx.scene.enter('mainMenu'))
groupsMenu.action('>', (ctx) => ctx.reply('\\(\'>\')/'))

module.exports = groupsMenu
