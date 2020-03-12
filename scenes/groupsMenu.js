const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const isAdmin = require('../helpers/isAdmin')
const groupsMenu = new Scene('groupsMenu')
let buttons

groupsMenu.enter((ctx) => {
    buttons = [
        Markup.callbackButton(ctx.i18n.t('back'), `back`),
        Markup.callbackButton('\\\'>\'/', '>')
    ]

    let groups = ctx.session.user.groups.map((v) => {
        Markup.callbackButton(v.screen_name, `manage=${v.id}`)
    })

    ctx.editMessageText(ctx.i18n.t('groupsMenu', {
        groups: groups.length
    }),
        Markup.inlineKeyboard(groups.concat(buttons), {
            wrap: (btn, index, currentRow) => {
                return currentRow.length ===  2 || index === groups.length
            }
          }).extra({ parse_mode: 'HTML' })
    )
    .then((message) => ctx.scene.state.message_id = message.message_id)
    .catch((error) => console.log(ctx.from.id, error))
})

// groupsMenu.action('>', async (ctx) => {
//     console.log(ctx.match)

//     ctx.editMessageText('new text',
//     Markup.inlineKeyboard(buttons.concat(buttons), {
//         wrap: (btn, index, currentRow) => {
//             return currentRow.length ===  2 || index === buttons.length
//         }
//       }).extra()
//         ).catch((err) => console.log(err))

//     // await ctx.answerCbQuery(`Oh, ${ctx.match}! Great choice`).catch((err) => console.log(err))
// })

groupsMenu.hears(/(@.+)/, async (ctx) => {
    console.log(ctx.match)
    let ad = await isAdmin(ctx, ctx.match[1])
    let chat = await ctx.getChat(ctx.match[1])

    if(ad) {
        console.log(chat)
        console.log('is admin')
    }

    ctx.state.db.Group.update(chat)
        .then((g) => {
            ctx.reply(`${g} Успешно добавлен.`, { reply_to_message_id: ctx.message.message_id })
    })
        .catch((err) => {
            ctx.reply(`Ошибка: ${err}.`, { reply_to_message_id: ctx.message.message_id })
    })
})

groupsMenu.action('back', (ctx) => ctx.scene.enter('mainMenu'))
// groupsMenu.action('>', (ctx) => ctx.reply('\\(\'>\')/'))

module.exports = groupsMenu
