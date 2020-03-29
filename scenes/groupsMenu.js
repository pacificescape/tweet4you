const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const isAdmin = require('../helpers/isAdmin')
const groupsMenu = new Scene('groupsMenu')


groupsMenu.enter((ctx) => {
    let buttons = [
        Markup.callbackButton(ctx.i18n.t('back'), `main`),
        Markup.callbackButton('\\\'>\'/', '>')
    ]

    let groups = ctx.session.user.groups.map((v, i) => {
        return Markup.callbackButton(v.username, `group=${i}`)
    })

    ctx.editMessageText(ctx.i18n.t('groupsMenu', {
        groups: groups.length
    }),
        Markup.inlineKeyboard(groups.concat(buttons), {
            wrap: (btn, index, currentRow) => {
                return currentRow.length === 2 || index === groups.length
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

    ctx.state.db.Group.add(ctx)
        .then((g) => {
            ctx.reply(`${g.username} Успешно добавлен.`, { reply_to_message_id: ctx.message.message_id })
        })
        .catch((err) => {
            ctx.reply(`Ошибка: ${err}.`, { reply_to_message_id: ctx.message.message_id })
        })
})

// Open group

groupsMenu.action(/group=(.+)/, async (ctx) => {
    let buttons = [
        Markup.callbackButton(ctx.i18n.t('back'), `group`),
        Markup.callbackButton(ctx.i18n.t('delete'), 'delete')
    ]

    let group = ctx.session.user.groups[ctx.match[1]]

    ctx.session.group = ctx.match[1]

    let getGroup = (v, u) => v.groups.reduce((a, c) => c.username === u ? true : a, false)

    await ctx.session.user.twitters.forEach(v => v.populate('groups'))

    let twitters = ctx.session.user.twitters.map((v, i) => {
        let enabled = getGroup(v, group.username)
        return Markup.callbackButton(`${v.screen_name} ${enabled ? '✅' : '❎'}`, `${enabled ? `deactivate=${i}` : `activate=${i}`}`)
    })

    // let manage = group.twitters.map((v) => Markup.callbackButton(v.screen_name, `manage=${v.screen_name}`))
    // `Канал ${group.username}, включить постинг:`
    ctx.editMessageText(ctx.i18n.t('toggle_posting', {
        username: group.username
    }),
        Markup.inlineKeyboard(twitters.concat(buttons), {
            wrap: (btn, index, currentRow) => {
                return currentRow.length === 2 || index === twitters.length
            }
        }).extra({ parse_mode: 'HTML' })
    )
})

groupsMenu.action(/deactivate=(.+)/, async (ctx) => {
    let twitter = ctx.session.user.twitters[ctx.match[1]]
    let group = ctx.session.user.groups[ctx.session.group]

    let error = await ctx.state.db.Twitter.deactivate(twitter, group)

    if(error) {
        ctx.reply(error)
        return
    }

    let twitters = group.twitters

    let twitterIndex = twitters.reduce((a, c, i) => {
        c.valueOf() === twitter._id.valueOf() ? i : a
    }, null)

    twitters.splice(twitterIndex, 1)

    ctx.session.user = await ctx.state.db.User.update(ctx)

    ctx.scene.enter('groupsMenu')
})

groupsMenu.action(/activate=(.+)/, async (ctx) => {
    let twitter = ctx.session.user.twitters[ctx.match[1]]
    let group = ctx.session.user.groups[ctx.session.group]

    await ctx.state.db.Twitter.activate(twitter, group)

    ctx.session.user = await ctx.state.db.User.update(ctx)

    ctx.scene.enter('groupsMenu')
})

groupsMenu.action('main', (ctx) => ctx.scene.enter('mainMenu'))
groupsMenu.action('group', (ctx) => ctx.scene.enter('groupsMenu'))
groupsMenu.action('delete', (ctx) => ctx.reply('\\(\'>\')/'))

module.exports = groupsMenu
