const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')

const twitterMenu = new Scene('twitterMenu')
let buttons
let editTwitterButtons

twitterMenu.enter((ctx) => {
    buttons = [
        Markup.callbackButton(ctx.i18n.t('back'), `back`),
        Markup.callbackButton('>', '>')
    ]

    editTwitterButtons = [
        Markup.callbackButton(ctx.i18n.t('twitter.addTo'), 'twitterAddTo'),
        Markup.callbackButton(ctx.i18n.t('twitter.delete'), 'twitterDelete')
    ]

    let twitters = ctx.session.user.twitters.map((v) => {
        return Markup.callbackButton(v.screen_name, `manage=${v.id}`)
    })

    ctx.editMessageText(ctx.i18n.t('twitterMenu', {
        twitters: twitters.length
    }),
        Markup.inlineKeyboard(twitters.concat(buttons), {
            wrap: (btn, index, currentRow) => currentRow.length === 2 || index === twitters.length
        }).extra({ parse_mode: 'HTML' })
    ).catch((error) => console.log(ctx.from.id, error))
})

twitterMenu.action(/manage=(.+)/, async (ctx) => {
    ctx.answerCbQuery(`Oh, ${ctx.match[1]}! Great choice`).catch((err) => console.log(err))
    let twitter = await ctx.state.db.Twitter.findOne({ id: ctx.match[1] })

    if (!twitter) {
        ctx.editMessageText(ctx.i18n.t('error'),
            Markup.inlineKeyboard(buttons).extra({ parse_mode: 'HTML' })
        )
    }

    ctx.editMessageText(ctx.i18n.t('twitter.edit', {
        screen_name: twitter.screen_name
    }),
        Markup.inlineKeyboard(editTwitterButtons.concat([
            Markup.callbackButton(ctx.i18n.t('back'), `reenter`),
            Markup.callbackButton('>', '>')
        ]), {
            wrap: (btn, index, currentRow) => currentRow.length === 2 || index === editTwitterButtons.length
        }).extra({ parse_mode: 'HTML' })
        )
})

twitterMenu.hears(/twitter.com/, (ctx) => {
    ctx.state.db.Twitter.update(ctx)
        .then((t) => {
            ctx.reply(`${t.name} Успешно добавлен.`,
            Markup.inlineKeyboard(editTwitterButtons.concat([
                Markup.callbackButton(ctx.i18n.t('back'), `reenter`),
                Markup.callbackButton('>', '>')
            ]), {
                wrap: (btn, index, currentRow) => currentRow.length === 2 || index === editTwitterButtons.length
            }).extra({ parse_mode: 'HTML', reply_to_message_id: ctx.message.message_id }))
        })
        .catch((err) => {
            ctx.reply(`Ошибка: ${err}.`, { reply_to_message_id: ctx.message.message_id })
        })
})

twitterMenu.action('back', (ctx) => ctx.scene.enter('mainMenu'))
twitterMenu.action('reenter', (ctx) => ctx.scene.enter('twitterMenu'))
twitterMenu.action('>', (ctx) => ctx.reply('\\(\'>\')/'))

module.exports = twitterMenu
