const { Composer, Stage, Markup } = require('telegraf')
const Scene = require('telegraf/scenes/base')
const { match } = require('telegraf-i18n')
const { finWord, paginator, method, switchPage } = require('../../helpers')

const pageLength = 10

const channelMain = new Scene('channel.main')
const channelTwitters = new Scene('channel.twitter')

async function mainGroupsPage (ctx, addition) {
  ctx.session.pages = Math.ceil(ctx.session.user.groups.length / pageLength)
  addition = addition || ''
  const { buttons, page } = paginator(ctx, '')

  const groups = ctx.session.user.groups.slice(page * pageLength, (page + 1) * pageLength).map((v) => {
    return Markup.callbackButton(v.username ? v.username : v.group_id, `group=${v.username ? v.username : v.group_id}`)
  })

  ctx[method(ctx)](addition + ctx.i18n.t('groupsMenu', {
    groups: `<b>${ctx.session.user.groups.length}</b>`,
    fin: finWord(ctx.session.user.groups.length)
  }),
  Markup.inlineKeyboard(groups.concat(buttons), {
    wrap: (btn, i, currentRow) => (currentRow.length === 2 && i < groups.length) || i === groups.length
  }).extra({ parse_mode: 'HTML' })
  ).catch((error) => console.log(ctx.from.id, error))
}

channelMain.enter((ctx) => {
  ctx.session.pages = Math.ceil(ctx.session.user.groups.length / pageLength)
  ctx.session.page = 0

  mainGroupsPage(ctx)
})
channelMain.hears(/t.me\/(.+)|@(.+)/, async (ctx) => {
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
  const { buttons, page } = paginator(ctx, ctx.i18n.t('back'), 'back')

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
channelMain.action('group', (ctx) => {
  mainGroupsPage(ctx)
})
channelMain.action('|', (ctx) => {
  ctx.answerCbQuery()
})
channelMain.action('delete', async (ctx) => {
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
channelMain.action(/>|</, async (ctx) => {
  await switchPage(ctx)
  await mainGroupsPage(ctx) // switch
})

async function showTwitters (ctx) {
  ctx.session.pages = Math.ceil(ctx.session.user.twitters.length / pageLength)

  const { buttons, page } = paginator(ctx, 'channel.main')
  const group = ctx.session.user.groups.find((gr) => (gr.username ? gr.username : gr.group_id) === ctx.session.group)
  const getGroup = (v, u) => v.groups.reduce((a, c) => (c.username ? c.username : c.group_id) === u ? true : a, false)

  await ctx.session.user.twitters.forEach(v => v.populate('groups'))

  const twitters = ctx.session.user.twitters.slice(page * pageLength, (page + 1) * pageLength).map((v, i) => {
    const enabled = getGroup(v, group.username ? group.username : group.group_id)
    return Markup.callbackButton(`${v.screen_name} ${enabled ? '✅' : '❌'}`, `${enabled ? `deactivate=${i + page * pageLength}` : `activate=${i + page * pageLength}`}`)
  })

  ctx[method(ctx)](ctx.i18n.t('group.toggle_posting', {
    username: group.username ? group.username : group.group_id
  }),
  Markup.inlineKeyboard(twitters.concat(buttons), {
    wrap: (_, i, currentRow) => {
      return (currentRow.length === 2 && i < twitters.length) || i === twitters.length
    }
  }).extra({ parse_mode: 'HTML' })
  )
}

channelTwitters.enter((ctx) => {
  ctx.session.pages = Math.ceil(ctx.session.user.groups.length / pageLength)
  ctx.session.page = 0

  showTwitters(ctx)
})
channelTwitters.action(/^activate=(.+)/, async (ctx) => {
  const twitter = ctx.session.user.twitters[ctx.match[1]]
  const group = ctx.session.user.groups.find((gr) => (gr.username ? gr.username : gr.group_id) === ctx.session.group)

  await ctx.state.db.Twitter.activate(ctx, twitter, group)

  ctx.session.user = await ctx.state.db.User.update(ctx)
  showTwitters(ctx)
})
channelTwitters.action(/deactivate=(.+)/, async (ctx) => {
  const twitter = ctx.session.user.twitters[ctx.match[1]]
  const group = ctx.session.user.groups.find((gr) => (gr.username ? gr.username : gr.group_id) === ctx.session.group)
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
channelTwitters.action(/<|>/, async (ctx) => {
  await switchPage(ctx)
  await showTwitters(ctx)
})

const stage = new Stage([channelMain, channelTwitters])
stage.use((ctx, next) => {
  if (!ctx.session.scene) ctx.session.scene = {}
  return next()
})

const composer = new Composer()
// composer.use(async (ctx, next) => {
//   console.log(ctx.callbackQuery)
//   await next()
// })
composer.use(stage)
composer.hears(match('menu.channels'), ctx => ctx.scene.enter('channel.main'))
composer.action('channel.main', (ctx) => ctx.scene.enter('channel.main'))
composer.action('twitter:main', (ctx) => ctx.scene.enter('twitter.main'))
composer.action(/twitter:twitter:(.+)/, (ctx) => ctx.scene.enter('twitter.channels'))
composer.action(/twitter:channel:(.+)/, (ctx) => ctx.scene.enter('twitter.channel'))
composer.action(/group=(.+)/, (ctx) => {
  ctx.session.group = ctx.match[1]
  ctx.scene.enter('channel.twitter')
})
module.exports = composer
