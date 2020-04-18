const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
// const isAdmin = require('../helpers/isAdmin')
const groupsMenu = new Scene('groupsMenu')
const { finWord } = require('../helpers')
const pageLength = 10
let buttons

function paginator (ctx, yaml, cbq) {
  const { page, pages } = ctx.session

  buttons = [
    Markup.callbackButton(yaml, cbq),
    page !== 0 ? Markup.callbackButton('<', '<') : null,
    page !== pages - 1 ? Markup.callbackButton('>', '>') : null
  ].filter(e => e)

  return { page, pages }
}

function mainGroupsPage (ctx, addition) {
  ctx.session.pages = Math.ceil(ctx.session.user.groups.length / pageLength)
  addition = addition || ''
  const { page } = paginator(ctx, ctx.i18n.t('back'), 'back')

  const groups = ctx.session.user.groups.slice(page * pageLength, (page + 1) * pageLength).map((v) => {
    return Markup.callbackButton(v.username, `group=${v.username}`)
  })

  ctx.editMessageText(addition + ctx.i18n.t('groupsMenu', {
    groups: `<b>${ctx.session.user.groups.length}</b>`,
    fin: finWord(ctx.session.user.groups.length)
  }),
  Markup.inlineKeyboard(groups.concat(buttons), {
    wrap: (btn, i, currentRow) => (currentRow.length === 2 && i < groups.length) || i === groups.length
  }).extra({ parse_mode: 'HTML' })
  ).catch((error) => console.log(ctx.from.id, error))
}

groupsMenu.enter((ctx) => {
  ctx.session.pages = Math.ceil(ctx.session.user.groups.length / pageLength)
  ctx.session.page = 0

  mainGroupsPage(ctx)
})

groupsMenu.hears(/t.me\/(.+)|@(.+)/, async (ctx) => {
  ctx.match = ctx.match.filter(e => e)
  let addition = ''

  await ctx.state.db.Group.add(ctx)
    .then((g) => {
      addition = `@${g.username} Успешно добавлен(а)\n\n`
    })
    .catch((err) => {
      addition = `<b>Ошибка: ${err.message}.</b>\n\n`
    })

  // mainGroupsPage(ctx, addition)
  const { page } = paginator(ctx, ctx.i18n.t('back'), 'back')

  const groups = ctx.session.user.groups.slice(page * pageLength, (page + 1) * pageLength).map((v) => {
    return Markup.callbackButton(v.username, `group=${v.username}`)
  })

  ctx.reply(addition + ctx.i18n.t('groupsMenu', {
    groups: `<b>${ctx.session.user.groups.length}</b>`,
    fin: finWord(ctx.session.user.groups.length)
  }),
  Markup.inlineKeyboard(groups.concat(buttons), {
    wrap: (btn, i, currentRow) => (currentRow.length === 2 && i < groups.length) || i === groups.length
  }).extra({ parse_mode: 'HTML' })
  ).catch((error) => console.log(ctx.from.id, error))
})

// OPEN GROUP

groupsMenu.action(/group=(.+)/, (ctx) => {
  ctx.session.group = ctx.match[1]
  showTwitters(ctx)
})

groupsMenu.action(/deactivate=(.+)/, async (ctx) => {
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

groupsMenu.action(/activate=(.+)/, async (ctx) => {
  const twitter = ctx.session.user.twitters[ctx.match[1]]
  const group = ctx.session.user.groups.find((gr) => gr.username === ctx.session.group)

  await ctx.state.db.Twitter.activate(ctx, twitter, group)

  ctx.session.user = await ctx.state.db.User.update(ctx)
  ctx.session.page = 0
  showTwitters(ctx)
})

groupsMenu.action('main', (ctx) => ctx.scene.enter('mainMenu'))
groupsMenu.action('group', (ctx) => mainGroupsPage(ctx))
groupsMenu.action('delete', async (ctx) => {
  let addition

  await ctx.state.db.Group.delete(ctx)
    .then((g) => {
      addition = `${g.username} Успешно удален(а)\n\n`
    })
    .catch((err) => {
      addition = `<b>Ошибка: ${err.message}.</b>\n\n`
      console.log(ctx.session.user.username, err)
    })

  mainGroupsPage(ctx, addition)
})

groupsMenu.action(/>|</, (ctx) => {
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

  mainGroupsPage(ctx) // switch
})

groupsMenu.action(/tw\+|tw-/, (ctx) => {
  switch (ctx.match[0]) {
    case 'tw-':
      if (ctx.session.page > 0) {
        ctx.session.page -= 1
      }
      break
    case 'tw+':
      if (ctx.session.page < ctx.session.pages) {
        ctx.session.page += 1
      }
      break
    default:
      return
  }

  showTwitters(ctx) // switch
})

async function showTwitters (ctx) {
  // const buttons = [
  //   Markup.callbackButton(ctx.i18n.t('back'), 'group'),
  //   Markup.callbackButton(ctx.i18n.t('delete'), 'delete')
  // ]
  ctx.session.pages = Math.ceil(ctx.session.user.twitters.length / pageLength)

  const { page, pages } = ctx.session

  buttons = [
    Markup.callbackButton(ctx.i18n.t('back'), 'group'),
    Markup.callbackButton(ctx.i18n.t('delete'), 'delete'),
    page !== 0 ? Markup.callbackButton('<', 'tw-') : null,
    page !== pages - 1 ? Markup.callbackButton('>', 'tw+') : null
  ].filter(e => e)

  const group = ctx.session.user.groups.find((gr) => gr.username === ctx.session.group)

  const getGroup = (v, u) => v.groups.reduce((a, c) => c.username === u ? true : a, false)

  await ctx.session.user.twitters.forEach(v => v.populate('groups'))

  const twitters = ctx.session.user.twitters.slice(page * pageLength, (page + 1) * pageLength).map((v, i) => {
    const enabled = getGroup(v, group.username)
    return Markup.callbackButton(`${v.screen_name} ${enabled ? '✅' : '❌'}`, `${enabled ? `deactivate=${i}` : `activate=${i}`}`)
  })

  ctx.editMessageText(ctx.i18n.t('group.toggle_posting', {
    username: group.username
  }),
  Markup.inlineKeyboard(twitters.concat(buttons), {
    wrap: (btn, index, currentRow) => {
      return currentRow.length === 2 || index === twitters.length
    }
  }).extra({ parse_mode: 'HTML' })
  )
}
module.exports = groupsMenu
