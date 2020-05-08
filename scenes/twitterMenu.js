const Scene = require('telegraf/scenes/base')
// const WizardScene = require('telegraf/scenes/wizard')
// const { Composer } = require('@telegraf/core')
const Markup = require('telegraf/markup')
const { finWord, paginator } = require('../helpers')
// const Extra = require('telegraf/extra')

// const composer = new Composer()

const twitterMenu = new Scene('twitterMenu')
const pageLength = 10
let buttons
let editTwitterButtons

function mainTwitterPage (ctx) {
  const { buttons, page } = paginator(ctx, ctx.i18n.t('back'), 'back')

  const twitters = ctx.session.user.twitters.slice(page * pageLength, (page + 1) * pageLength).map((v) => {
    return Markup.callbackButton(v.screen_name, `choseTwitter=${v.id}`)
  })

  ctx.editMessageText(ctx.i18n.t('twitterMenu', {
    twitters: `<b>${ctx.session.user.twitters.length}</b>`,
    fin: finWord(ctx.session.user.twitters.length)
  }),
  Markup.inlineKeyboard(twitters.concat(buttons), {
    wrap: (btn, i, currentRow) => (currentRow.length === 2 && i < twitters.length) || i === twitters.length
  }).extra({ parse_mode: 'HTML', disable_web_page_preview: true })
  ).catch((error) => console.log(ctx.from.id, error))
}

// ENTER

twitterMenu.enter((ctx) => {
  ctx.session.pages = Math.ceil(ctx.session.user.twitters.length / pageLength)
  ctx.session.page = 0

  mainTwitterPage(ctx)
})

// choseTwitter

twitterMenu.action(/choseTwitter=(.+)/, (ctx) => {
  ctx.scene.enter('choseTwitter')
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
twitterMenu.action('|', (ctx) => {
  ctx.answerCbQuery()
})

twitterMenu.action(/Delete=(.+)/, async (ctx) => {
  let addition = ''

  await ctx.state.db.Twitter.delete(ctx)
    .then((t) => {
      addition = `${t.username} Удалён`
    })
    .catch((err) => {
      addition = `<b>Ошибка:</b> ${err.message}.`
      console.log(err)
    })

  const { buttons, page } = paginator(ctx, ctx.i18n.t('back'), 'back')

  const twitters = ctx.session.user.twitters.slice(page * pageLength, (page + 1) * pageLength).map((v) => {
    return Markup.callbackButton(v.screen_name, `choseTwitter=${v.id}`)
  })

  ctx.reply(addition + ctx.i18n.t('twitterMenu', {
    twitters: `<b>${ctx.session.user.twitters.length}</b>`,
    fin: finWord(ctx.session.user.twitters.length)
  }),
  Markup.inlineKeyboard(twitters.concat(buttons), {
    wrap: (btn, i, currentRow) => (currentRow.length === 2 && i < twitters.length) || i === twitters.length
  }).extra({ parse_mode: 'HTML', disable_web_page_preview: true })
  ).catch((error) => console.log(ctx.from.id, error))
})

// < >

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
          wrap: (btn, index, currentRow) => (currentRow.length === 2 && index < pageLength) // || index === editTwitterButtons().length
        }).extra({ parse_mode: 'HTML', reply_to_message_id: ctx.message.message_id, disable_web_page_preview: true }))
    })
    .catch((err) => {
      ctx.reply(`Ошибка: ${err}.`, { reply_to_message_id: ctx.message.message_id })
    })
})

module.exports = twitterMenu
