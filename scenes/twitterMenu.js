const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const { finWord } = require('../helpers')
// const Extra = require('telegraf/extra')

const twitterMenu = new Scene('twitterMenu')
let buttons
let editTwitterButtons

function paginator (ctx, yaml, cbq) {
  const { page, pages } = ctx.session

  buttons = [
    Markup.callbackButton(yaml, cbq),
    page !== 0 ? Markup.callbackButton('<', '<') : null,
    page !== pages - 1 ? Markup.callbackButton('>', '>') : null
  ].filter(e => e)

  return { page, pages }
}

function mainTwitterPage (ctx) {
  const { page } = paginator(ctx, ctx.i18n.t('back'), 'back')

  const twitters = ctx.session.user.twitters.slice(page * 6, (page + 1) * 6).map((v) => {
    return Markup.callbackButton(v.screen_name, `choseTwitter=${v.id}`)
  })

  ctx.editMessageText(ctx.i18n.t('twitterMenu', {
    twitters: `<b>${ctx.session.user.twitters.length}</b>`,
    fin: finWord(ctx.session.user.twitters.length)
  }),
  Markup.inlineKeyboard(twitters.concat(buttons), {
    wrap: (btn, index, currentRow) => currentRow.length === 2 || index === twitters.length
  }).extra({ parse_mode: 'HTML', disable_web_page_preview: true })
  ).catch((error) => console.log(ctx.from.id, error))
}

// ENTER

twitterMenu.enter((ctx) => {
  ctx.session.pages = Math.ceil(ctx.session.user.twitters.length / 6)
  ctx.session.page = 0

  mainTwitterPage(ctx)
})

// choseTwitter

twitterMenu.action(/choseTwitter=(.+)/, (ctx) => {
  ctx.session.twitter = ctx.match[1]
  const twitter = ctx.session.user.twitters.find((tw) => tw.id === ctx.match[1])
  let groups = []

  twitter.groups.forEach((g) => {
    const i = ctx.session.user.groups.findIndex((grUser) => grUser.username === g.username)
    groups.push(i)
  })
  groups.filter(e => e)

  ctx.session.pages = Math.ceil(ctx.session.user.twitters.length / 6)
  ctx.session.page = 0

  const { page } = paginator(ctx, ctx.i18n.t('back'), 'backToMain')

  groups = groups.slice(page * 6, (page + 1) * 6).map((I) => {
    return Markup.callbackButton(ctx.session.user.groups[I].username, `choseGroup=${I}`)
  })

  ctx.editMessageText(ctx.i18n.t('twitter.choseGroup', { // новый текст
    twitter: `<b>${twitter.screen_name}</b>`,
    groups: `<b>${groups.length}</b>`,
    fin: (groups.length === 11 || groups.length % 10 !== 1) ? ctx.i18n.t('twitter.x2-9') : ctx.i18n.t('twitter.x1')
  }),
  Markup.inlineKeyboard(groups.concat(buttons), {
    wrap: (btn, index, currentRow) => {
      return currentRow.length === 2 || index === groups.length
    }
  }).extra({ parse_mode: 'HTML' })
  )
    .then((message) => { ctx.session.message_id = message.message_id }) /// ??????
    .catch((error) => console.log(ctx.from.id, error))
})

// MANAGE

async function manageTwitter (ctx) {
  ctx.session.settings = ctx.session.user.groups[ctx.session.currentGroupIndex].settings[ctx.session.twitter]
  const settings = ctx.session.settings

  const twitter = await ctx.state.db.Twitter.findOne({ id: ctx.session.twitter })

  editTwitterButtons = (id = '') => {
    const buttons = []

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
    group_name: ctx.session.user.groups[ctx.session.currentGroupIndex].username,
    screen_name: twitter.screen_name
  }),
  Markup.inlineKeyboard(editTwitterButtons(twitter.id).concat([
    Markup.callbackButton(ctx.i18n.t('back'), 'reenter'),
    Markup.callbackButton('>', '><') // ???
  ]), {
    wrap: (btn, index, currentRow) => currentRow.length === 2 || index === editTwitterButtons().length
  }).extra({ parse_mode: 'HTML' })
  )
}

twitterMenu.action(/choseGroup=(.+)/, async (ctx) => {
  ctx.session.currentGroupIndex = ctx.match[1]
  ctx.session.currentGroup = ctx.session.user.groups[ctx.match[1]].username
  manageTwitter(ctx)
})

// UTILS

twitterMenu.action(/setting=(.+)=(.+)/, (ctx) => {
  ctx.state.db.Twitter.settings(ctx.match[2], ctx.session.currentGroup, ctx.match[1])
    .then(() => {
      ctx.session.settings[ctx.match[1]] = !ctx.session.settings[ctx.match[1]]
      manageTwitter(ctx)
    })
    .catch((err) => console.log(err))
})

twitterMenu.action('back', (ctx) => ctx.scene.enter('mainMenu'))
twitterMenu.action('reenter', (ctx) => mainTwitterPage(ctx))

// объединить

twitterMenu.action(/>|</, (ctx) => {
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

  mainTwitterPage(ctx) // switch
})

// HEARS TWITTER

twitterMenu.hears(/twitter.com/, (ctx) => {
  editTwitterButtons = (id = '') => [
    Markup.callbackButton(`${ctx.i18n.t('twitter.addTo')}`, `AddTo=${id}`),
    Markup.callbackButton(`${ctx.i18n.t('twitter.delete')}`, `Delete=${id}`)
  ]

  ctx.state.db.Twitter.upToDate(ctx)
    .then((t) => {
      ctx.reply(`${t.name} Успешно добавлен.`,
        Markup.inlineKeyboard(editTwitterButtons(t.id).concat([
          Markup.callbackButton(ctx.i18n.t('back'), 'reenter'),
          Markup.callbackButton('>', '>')
        ]), {
          wrap: (btn, index, currentRow) => (currentRow.length === 2 && index < 6) // || index === editTwitterButtons().length
        }).extra({ parse_mode: 'HTML', reply_to_message_id: ctx.message.message_id, disable_web_page_preview: true }))
    })
    .catch((err) => {
      ctx.reply(`Ошибка: ${err}.`, { reply_to_message_id: ctx.message.message_id })
    })
})

module.exports = twitterMenu
