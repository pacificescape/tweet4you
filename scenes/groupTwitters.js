const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
// const isAdmin = require('../helpers/isAdmin')
const groupTwitters = new Scene('groupTwitters')
const { finWord, paginator } = require('../helpers')
const pageLength = 10
let buttons

groupTwitters.enter((ctx) => {
    ctx.session.pages = Math.ceil(ctx.session.user.groups.length / pageLength)
    ctx.session.page = 0

    showTwitters(ctx)
})

groupTwitters.action('back', (ctx) => {
    ctx.scene.enter('groupsMenu')
})

groupTwitters.action(/^activate=(.+)/, async (ctx) => {
    const twitter = ctx.session.user.twitters[ctx.match[1]]
    const group = ctx.session.user.groups.find((gr) => gr.username === ctx.session.group)

    await ctx.state.db.Twitter.activate(ctx, twitter, group)

    ctx.session.user = await ctx.state.db.User.update(ctx)
    showTwitters(ctx)
})


groupTwitters.action(/deactivate=(.+)/, async (ctx) => {
    const twitter = ctx.session.user.twitters[ctx.match[1]]
    const group = ctx.session.user.groups.find((gr) => gr.username === ctx.session.group)

    const error = await ctx.state.db.Twitter.deactivate(twitter, group)

    if (error) {
        ctx.reply(error)
        return
    }

    const twitters = group.twitters

    const twitterIndex = twitters.reduce((a, c, i) => {
        return c.valueOf() === twitter._id.valueOf() ? i : a
    }, null)

    twitters.splice(twitterIndex, 1)

    ctx.session.user = await ctx.state.db.User.update(ctx)

    showTwitters(ctx)
})

groupTwitters.action(/>|<|\|/, (ctx) => {
    switch (ctx.match[0]) {
        case '<':
            if (ctx.session.page > 0) {
                ctx.session.page -= 1
            }
            break
        case '>':
            if (ctx.session.page < ctx.session.pages) {
                ctx.session.page += 1
            }
            break
        default:
            return
    }

    showTwitters(ctx)
})


async function showTwitters(ctx) {
    ctx.session.pages = Math.ceil(ctx.session.user.twitters.length / pageLength)

    // const { page, pages } = ctx.session

    // buttons = [
    //     Markup.callbackButton(ctx.i18n.t('back'), 'group'),
    //     page !== 0 ? Markup.callbackButton('<', 'tw-') : Markup.callbackButton('|', '|'),
    //     page !== pages - 1 ? Markup.callbackButton('>', 'tw+') : Markup.callbackButton('|', '|')
    // ].filter(e => e)

    const { buttons, page } = paginator(ctx, ctx.i18n.t('back'), 'back')

    const group = ctx.session.user.groups.find((gr) => gr.username === ctx.session.group)

    const getGroup = (v, u) => v.groups.reduce((a, c) => c.username === u ? true : a, false)

    await ctx.session.user.twitters.forEach(v => v.populate('groups'))

    const twitters = ctx.session.user.twitters.slice(page * pageLength, (page + 1) * pageLength).map((v, i) => {
        const enabled = getGroup(v, group.username)
        return Markup.callbackButton(`${v.screen_name} ${enabled ? '✅' : '❌'}`, `${enabled ? `deactivate=${i + page * pageLength}` : `activate=${i + page * pageLength}`}`)
    })

    ctx.editMessageText(ctx.i18n.t('group.toggle_posting', {
        username: group.username
    }),
        Markup.inlineKeyboard(twitters.concat(buttons), {
            wrap: (btn, i, currentRow) => {
                return (currentRow.length === 2 && i < twitters.length) || i === twitters.length
            }
        }).extra({ parse_mode: 'HTML' })
    )
}


module.exports = groupTwitters
