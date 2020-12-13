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

  const twitters = ctx.session.user.twitters.slice(page * pageLength, (page + 1) * pageLength).map((v) => {
    return Markup.callbackButton(v.screen_name, `twitter:twitter:${v.id}`)
  })

  ctx[method(ctx)](ctx.i18n.t('twitterMenu', {
    twitters: `<b>${ctx.session.user.twitters.length}</b>`,
    fin: finWord(ctx.session.user.twitters.length)
  }),
  Markup.inlineKeyboard(twitters.concat(buttons), {
    wrap: (btn, i, currentRow) => (currentRow.length === 2 && i < twitters.length) || i === twitters.length
  }).extra({ parse_mode: 'HTML', disable_web_page_preview: true })
  ).catch((error) => console.log(ctx.from.id, error))
}

twitterMain.enter(async (ctx) => {
  ctx.session.pages = Math.ceil(ctx.session.user.twitters.length / pageLength)
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
twitterMain.action(/>|<|\|/, async (ctx) => {
  await switchPage(ctx)
  await showTwitters(ctx)
})
twitterMain.hears(/twitter.com/, async (ctx) => {
  const editTwitterButtons = (id = '') => [
    Markup.callbackButton(`${ctx.i18n.t('twitter.addTo')}`, `AddTo=${id}`),
    Markup.callbackButton(`${ctx.i18n.t('twitter.delete')}`, `Delete=${id}`)
  ]

  await ctx.state.db.Twitter.upToDate(ctx)
    .then((t) => {
      ctx.reply(`${t.name} Успешно добавлен.`,
        Markup.inlineKeyboard(editTwitterButtons(t.id).concat([
          Markup.callbackButton(ctx.i18n.t('back'), 'twitter:main')
        ]), {
          wrap: (_, index, currentRow) => (currentRow.length === 2 && index < pageLength) // || index === editTwitterButtons().length
        }).extra({ parse_mode: 'HTML', reply_to_message_id: ctx.message.message_id, disable_web_page_preview: true }))
    })
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

  await ctx[method(ctx)](ctx.i18n.t('twitter.choseGroup', { // новый текст
    twitter: `<b>${twitter.screen_name}</b>`,
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

twitterChannels.enter((ctx) => {
  ctx.session.twitter = ctx.match[1]
  twitter = ctx.session.user.twitters.find((tw) => tw.id === ctx.session.twitter)
  ctx.session.scene.twitter = twitter
  const groups = []
  if (!twitter) return // fix

  twitter.groups.forEach((g) => {
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

async function renderSettings (ctx) {
  // const twitterId = ctx.session.scene.twitter
  // const channelId = ctx.session.scene.channel
  ctx.session.settings = ctx.session.user.groups[ctx.session.currentGroupIndex].settings[ctx.session.twitter]
  const settings = ctx.session.settings

  const twitter = await ctx.state.db.Twitter.findOne({ id: ctx.session.twitter })

  const buttons = []
  const editTwitterButtons = (id = '') => {

    if (!settings.onlyMedia) {
      buttons.push(
        Markup.callbackButton(`${ctx.i18n.t('twitter.link')} ${settings.link ? '✅' : '❌'}`, `setting=link=${id}`),
        Markup.callbackButton(`${ctx.i18n.t('twitter.name')} ${settings.name ? '✅' : '❌'}`, `setting=name=${id}`)
      )
    }

    if (!settings.onlyText) {
      buttons.push(
        Markup.callbackButton(`${ctx.i18n.t('twitter.images')} ${settings.images ? '✅' : '❌'}`, `setting=images=${id}`),
        Markup.callbackButton(`${ctx.i18n.t('twitter.videos')} ${settings.videos ? '✅' : '❌'}`, `setting=videos=${id}`)
      )
    }

    buttons.push(
      Markup.callbackButton(`${ctx.i18n.t('twitter.retweets')} ${settings.retweets ? '✅' : '❌'}`, `setting=retweets=${id}`),
      Markup.callbackButton(`${ctx.i18n.t('twitter.replies')} ${settings.replies ? '✅' : '❌'}`, `setting=replies=${id}`),
      Markup.callbackButton(`${ctx.i18n.t('twitter.from')} ${settings.from ? '✅' : '❌'}`, `setting=from=${id}`),
      Markup.callbackButton(`${ctx.i18n.t('twitter.onlyText')} ${settings.onlyText ? '✅' : '❌'}`, `setting=onlyText=${id}`),
      Markup.callbackButton(`${ctx.i18n.t('twitter.onlyMedia')} ${settings.onlyMedia ? '✅' : '❌'}`, `setting=onlyMedia=${id}`),
      Markup.callbackButton(`${ctx.i18n.t('twitter.clearMedia')} ${settings.clearMedia ? '✅' : '❌'}`, `setting=clearMedia=${id}`),
      Markup.callbackButton(`${ctx.i18n.t('twitter.addTo')}`, `AddTo=${id}`),
      Markup.callbackButton(`${ctx.i18n.t('twitter.delete')}`, `Delete=${id}`)
    )

    return buttons
  }

  if (!settings) {
    ctx.editMessageText(ctx.i18n.t('error'),
      Markup.inlineKeyboard(buttons).extra({ parse_mode: 'HTML' })
    )
    return
  }

  ctx.editMessageText(ctx.i18n.t('twitter.edit', {
    group_name: ctx.session.user.groups[ctx.session.currentGroupIndex].username || ctx.session.user.groups[ctx.session.currentGroupIndex].group_id,
    screen_name: twitter.screen_name
  }),
  Markup.inlineKeyboard(editTwitterButtons(twitter.id).concat([
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

  renderSettings(ctx)
})
twitterChannelSettings.action('back', (ctx) => {
  ctx.scene.enter('choseTwitter')
})
twitterChannelSettings.action(/setting=(.+)=(.+)/, (ctx) => {
  ctx.state.db.Twitter.settings(ctx.match[2], ctx.session.currentGroup, ctx.match[1])
    .then(() => {
      ctx.session.settings[ctx.match[1]] = !ctx.session.settings[ctx.match[1]]
      renderSettings(ctx)
    })
    .catch((err) => console.log(err))
})

const stage = new Stage([twitterMain, twitterChannels, twitterChannelSettings])
stage.use((ctx, next) => {
  if (!ctx.session.scene) ctx.session.scene = {}
  return next()
})

const composer = new Composer()
composer.use(async (ctx, next) => {
  console.log(ctx.callbackQuery)
  await next()
})
composer.use(stage)
composer.hears(match('menu.twitters'), ctx => ctx.scene.enter('twitter.main'))
composer.hears(match('menu.channels'), ctx => ctx.scene.enter('twitter.channels'))
composer.action('twitter:main', ctx => ctx.scene.enter('twitter.main'))
composer.action(/twitter:twitter:(.+)/, (ctx) => ctx.scene.enter('twitter.channels'))
composer.action(/twitter:channel:(.+)/, (ctx) => ctx.scene.enter('twitter.channel'))

module.exports = composer
