const { Composer, Stage, Markup } = require('telegraf')
const Scene = require('telegraf/scenes/base')
const { match } = require('telegraf-i18n')
const { finWord, paginator, method, switchPage } = require('../../helpers')

const twitterMain = new Scene('twitter.main')
const twitterChannels = new Scene('twitter.channels')
const twitterChannelSettings = new Scene('twitter.channel')

const pageLength = 10
let twitter

async function showTwitters (ctx) {
  const { buttons, page } = paginator(ctx)

  const twittersCount = ctx.session.user?.twitters?.length

  // const twittersUnique = await ctx.state.db.Twitter
  //   .find({ users: { $in: ctx.session.user } })
  // console.log(twittersUnique)

  // ctx.session.user.twitters = twittersUnique.map(v => v._id)
  // await ctx.session.user.save()
  // console.time('twitters')

  // let twitters = await ctx.state.db.Twitter
  //   .find({ users: { $in: ctx.session.user._id } })
  //   // .sort({ createdAt: -1 })
  //   .skip(page * pageLength)
  //   .limit(pageLength)
  // console.timeEnd('twitters')

  const twitters = ctx.session.user.twitters
    .slice(page * pageLength, (page + 1) * pageLength)
    .map((v) => Markup.callbackButton(v.screen_name, `twitter:twitter:${v.id}`))

  ctx[method(ctx)](ctx.i18n.t('twitterMenu', {
    twitters: twittersCount,
    fin: finWord(twittersCount)
  }),
  Markup.inlineKeyboard(twitters.concat(buttons), {
    wrap: (_, i, currentRow) => (currentRow.length === 2 && i < twitters.length) || i === twitters.length
  }).extra({
    parse_mode: 'HTML',
    disable_web_page_preview: true
  })
  ).catch((error) => console.log(ctx.from.id, error))
}

twitterMain.enter(async (ctx) => {
  const twittersCount = ctx.session.user.twitters.length

  ctx.session.pages = Math.ceil(twittersCount / pageLength)
  ctx.session.page = 0

  await showTwitters(ctx)
})

twitterMain.action(/twitter:(.+):(.+):settings/, async (ctx) => {
  try {
    await ctx.state.db.Twitter.settings(ctx.match[2], ctx.session.currentGroup, ctx.match[1])
  } catch (error) {
    console.log(error)
    return
  }

  ctx.session.settings[ctx.match[1]] = !ctx.session.settings[ctx.match[1]]
  // await manageTwitter(ctx)
})
twitterMain.action(/>|</, async (ctx) => {
  await switchPage(ctx)
  await showTwitters(ctx)
})
twitterMain.hears(/twitter.com/, async (ctx) => {
  const addBtn = (id = '') => [
    Markup.callbackButton(`${ctx.i18n.t('twitter.addTo')}`, `AddTo=${id}`),
    Markup.callbackButton(`${ctx.i18n.t('twitter.delete')}`, `Delete=${id}`)
  ]

  const addedTwitter = await ctx.state.db.Twitter.upToDate(ctx)

  await ctx.reply(`${addedTwitter.name} Успешно добавлен.`,
    Markup.inlineKeyboard(addBtn(addedTwitter.id).concat([
      Markup.callbackButton(ctx.i18n.t('back'), 'twitter:main')
    ]), {
      parse_mode: 'HTML',
      reply_to_message_id: ctx.message.message_id,
      disable_web_page_preview: true,
      wrap: (_, i, row) => (row.length === 2 && i < pageLength)
    }))
    .catch((err) => {
      ctx.reply(`Ошибка: ${err}.`, { reply_to_message_id: ctx.message.message_id })
    })
})

async function showTwitterChannels (ctx) {
  let groups = ctx.session.groups

  const { buttons, page } = paginator(ctx, 'twitter:main')

  groups = groups.slice(page * pageLength, (page + 1) * pageLength).map((I) => {
    const name = ctx.session.user.groups[I].username ? ctx.session.user.groups[I].username : ctx.session.user.groups[I].group_id
    return Markup.callbackButton(name, `twitter:channel:${I}`)
  })

  await ctx[method(ctx)](ctx.i18n.t('twitter.choseGroup', {
    twitter: `<b>${ctx.session.scene.twitter.screen_name}</b>`,
    groups: `<b>${groups.length}</b>`,
    fin: (groups.length === 11 || groups.length % 10 !== 1) ? ctx.i18n.t('twitter.x2-9') : ctx.i18n.t('twitter.x1')
  }),
  Markup.inlineKeyboard(groups.concat(buttons), {
    wrap: (_, i, currentRow) => {
      return (currentRow.length === 2 && i < groups.length) || i === groups.length
    }
  }).extra({ parse_mode: 'HTML' })
  )
    .then((message) => { ctx.session.message_id = message.message_id })
    .catch((error) => console.log(ctx.from.id, error))
}

twitterChannels.enter(async (ctx) => {
  ctx.session.scene.twitter = await ctx.state.db.Twitter
    .findOne({ id: ctx.match[1], users: { $in: ctx.session.user } })
    .populate('groups')
    // const twitter = ctx.session.user.twitters.find((tw) => tw.id === ctx.session.twitter)
    // ctx.session.scene.twitter = twitter

  const groups = []
  if (!ctx.session.scene.twitter) return // fix

  ctx.session.scene.twitter.groups.forEach((g) => {
    const i = ctx.session.user.groups.findIndex((grUser) => (grUser.username ? grUser.username : grUser.group_id) === (g.username ? g.username : g.group_id))
    if (i !== -1) {
      groups.push(i)
    }
  })
  groups.filter(e => e)

  ctx.session.groups = groups
  ctx.session.pages = Math.ceil(groups.length / pageLength)
  ctx.session.page = 0

  showTwitterChannels(ctx)
})
twitterChannels.action(/>|</, async (ctx) => {
  await switchPage(ctx)
  await showTwitterChannels(ctx)
})
twitterChannels.action('twitterMenu', (ctx) => ctx.scene.enter('twitter.main'))

async function showSettings (ctx) {
  if (!ctx.session.scene.twitter || !ctx.session.scene.channel) return

  const settings = await ctx.state.db.Settings
    .findOne({ group: ctx.session.scene.channel, twitter: ctx.session.scene.twitter })

  const twitter = await ctx.state.db.Twitter
    .findOne({ id: ctx.session.scene.twitter.id })

  if (!settings) {
    ctx.editMessageText(ctx.i18n.t('error.message', {
      admin: process.env.OWNER_ID
    }),
      Markup.inlineKeyboard(buttons).extra({ parse_mode: 'HTML' })
    )
    return
  }

  ctx.session.scene.settings = settings

  const buttons = []
  const editTwitterButtons = (id = '') => {
    if (!settings.onlyMedia) {
      buttons.push(
        Markup.callbackButton(`${ctx.i18n.t('twitter.link')} ${settings.link ? '✅' : '❌'}`, `twitter:settings:link:${id}`),
        Markup.callbackButton(`${ctx.i18n.t('twitter.name')} ${settings.name ? '✅' : '❌'}`, `twitter:settings:name:${id}`)
      )
    }

    if (!settings.onlyText) {
      buttons.push(
        Markup.callbackButton(`${ctx.i18n.t('twitter.images')} ${settings.images ? '✅' : '❌'}`, `twitter:settings:images:${id}`),
        Markup.callbackButton(`${ctx.i18n.t('twitter.videos')} ${settings.videos ? '✅' : '❌'}`, `twitter:settings:videos:${id}`)
      )
    }

    buttons.push(
      Markup.callbackButton(`${ctx.i18n.t('twitter.retweets')} ${settings.retweets ? '✅' : '❌'}`, `twitter:settings:retweets:${id}`),
      Markup.callbackButton(`${ctx.i18n.t('twitter.replies')} ${settings.replies ? '✅' : '❌'}`, `twitter:settings:replies:${id}`),
      Markup.callbackButton(`${ctx.i18n.t('twitter.from')} ${settings.from ? '✅' : '❌'}`, `twitter:settings:from:${id}`),
      Markup.callbackButton(`${ctx.i18n.t('twitter.onlyText')} ${settings.onlyText ? '✅' : '❌'}`, `twitter:settings:onlyText:${id}`),
      Markup.callbackButton(`${ctx.i18n.t('twitter.onlyMedia')} ${settings.onlyMedia ? '✅' : '❌'}`, `twitter:settings:onlyMedia:${id}`),
      Markup.callbackButton(`${ctx.i18n.t('twitter.clearMedia')} ${settings.clearMedia ? '✅' : '❌'}`, `twitter:settings:clearMedia:${id}`),
      Markup.callbackButton(`${ctx.i18n.t('twitter.addTo')}`, `AddTo:${id}`),
      Markup.callbackButton(`${ctx.i18n.t('twitter.delete')}`, `Delete:${id}`)
    )

    return buttons
  }

  ctx.editMessageText(ctx.i18n.t('twitter.edit', {
    group_name: ctx.session.user.groups[ctx.session.currentGroupIndex].username || ctx.session.user.groups[ctx.session.currentGroupIndex].group_id,
    screen_name: twitter.screen_name
  }),
  Markup.inlineKeyboard(editTwitterButtons(settings._id).concat([
    Markup.callbackButton(ctx.i18n.t('back'), `twitter:twitter:${ctx.session.scene.twitter.id}`)
  ]), {
    wrap: (_, index, currentRow) => currentRow.length === 2 || index === editTwitterButtons().length
  }).extra({ parse_mode: 'HTML' })
  )
}

twitterChannelSettings.enter((ctx) => {
  ctx.session.scene.channel = ctx.session.user.groups[ctx.match[1]]
  ctx.session.currentGroupIndex = ctx.match[1]
  ctx.session.currentGroup = ctx.session.user.groups[ctx.match[1]].username ? ctx.session.user.groups[ctx.match[1]].username : ctx.session.user.groups[ctx.match[1]].group_id

  showSettings(ctx)
})
twitterChannelSettings.action('back', (ctx) => {
  ctx.scene.enter('choseTwitter')
})
twitterChannelSettings.action(/twitter:settings:(.+):(.+)/, async (ctx) => {
  const settings = ctx.session.scene.settings
  const type = ctx.match[1]
  const _id = ctx.match[2]

  if (settings._id.toString() !== _id) {
    console.log('settings error') // task: delete this block
  }

  if (typeof settings[type] === 'boolean') {
    settings[type] = !settings[type]
  } else {
    console.log(type)
  }

  const updatedSetings = await settings.save()

  ctx.session.scene.settings = updatedSetings
  await showSettings(ctx)
  // ctx.state.db.Twitter.settings(ctx.match[2], ctx.session.currentGroup, ctx.match[1])
  //   .then(() => {
  //     ctx.session.settings[ctx.match[1]] = !ctx.session.settings[ctx.match[1]]
  //     showSettings(ctx)
  //   })
  //   .catch((err) => console.log(err))
})

const stage = new Stage([twitterMain, twitterChannels, twitterChannelSettings])
stage.use((ctx, next) => {
  if (!ctx.session.scene) ctx.session.scene = {}
  return next()
})

const composer = new Composer()
composer.use(stage)
composer.hears(match('menu.twitters'), ctx => ctx.scene.enter('twitter.main'))
composer.action('twitter:main', ctx => ctx.scene.enter('twitter.main'))
composer.action(/twitter:twitter:(.+)/, (ctx) => ctx.scene.enter('twitter.channels'))
composer.action(/twitter:channel:(.+)/, (ctx) => ctx.scene.enter('twitter.channel'))
composer.action(/twitter/, ctx => ctx.scene.enter('twitter.main'))

module.exports = composer
