const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const { paginator } = require('../helpers')

const choseTwitter = new Scene('choseTwitter')
const pageLength = 10
let twitter

function choseTwitterPage (ctx) {
  let groups = ctx.session.groups

  const { buttons, page } = paginator(ctx, ctx.i18n.t('back'), 'twitterMenu')

  groups = groups.slice(page * pageLength, (page + 1) * pageLength).map((I) => {
    const name = ctx.session.user.groups[I].username ? ctx.session.user.groups[I].username : ctx.session.user.groups[I].group_id
    return Markup.callbackButton(name, `choseGroup=${I}`)
  })

  ctx.editMessageText(ctx.i18n.t('twitter.choseGroup', { // новый текст
    twitter: `<b>${twitter.screen_name}</b>`,
    groups: `<b>${groups.length}</b>`,
    fin: (groups.length === 11 || groups.length % 10 !== 1) ? ctx.i18n.t('twitter.x2-9') : ctx.i18n.t('twitter.x1')
  }),
  Markup.inlineKeyboard(groups.concat(buttons), {
    wrap: (btn, i, currentRow) => {
      return (currentRow.length === 2 && i < groups.length) || i === groups.length
    }
  }).extra({ parse_mode: 'HTML' })
  )
    .then((message) => { ctx.session.message_id = message.message_id }) /// ??????
    .catch((error) => console.log(ctx.from.id, error))
}

// ENTER

choseTwitter.enter((ctx) => {
  ctx.session.twitter = ctx.match[1]
  twitter = ctx.session.user.twitters.find((tw) => tw.id === ctx.session.twitter)
  const groups = []

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

  choseTwitterPage(ctx)
})

// < >

choseTwitter.action(/>|</, (ctx) => {
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

  choseTwitterPage(ctx) // switch
})

choseTwitter.action('twitterMenu', (ctx) => ctx.scene.enter('twitterMenu'))

choseTwitter.action(/choseGroup=(.+)/, async (ctx) => {
  ctx.session.currentGroupIndex = ctx.match[1]
  ctx.session.currentGroup = ctx.session.user.groups[ctx.match[1]].username ? ctx.session.user.groups[ctx.match[1]].username : ctx.session.user.groups[ctx.match[1]].group_id
  ctx.scene.enter('manageTwitter')
})

module.exports = choseTwitter
