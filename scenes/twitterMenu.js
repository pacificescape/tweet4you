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

    ctx.editMessageText(ctx.i18n.t('twitterMenu', {
        twitters: twitters.length
    }),
        Markup.inlineKeyboard(twitters.concat(buttons), {
            wrap: (btn, index, currentRow) => {
                return currentRow.length ===  2 || index === twitters.length
            }
          }).extra()
    ).catch((error) => console.log(ctx.from.id, error))
})

twitterMenu.action(/manage=(.+)/, (ctx) => {
    ctx.answerCbQuery(`Oh, ${ctx.match}! Great choice`).catch((err) => console.log(err))
})

twitterMenu.hears(/twitter.com/, (ctx) => {
    ctx.state.db.Twitter.update(ctx)
        .then((t) => {
            ctx.reply(`${t.name} Успешно добавлен.`, { reply_to_message_id: ctx.message.message_id })
    })
        .catch((err) => {
            ctx.reply(`Ошибка: ${err}.`, { reply_to_message_id: ctx.message.message_id })
    })
})

twitterMenu.action('back', (ctx) => ctx.scene.enter('mainMenu'))
twitterMenu.action('>', (ctx) => ctx.reply('\\(\'>\')/'))

module.exports = twitterMenu
