const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')

const manageTwitter = new Scene('manageTwitter')

manageTwitter.enter((ctx) => {
  renderSettings(ctx)
})

manageTwitter.action('back', (ctx) => {
  ctx.scene.enter('choseTwitter')
})

manageTwitter.action(/setting=(.+)=(.+)/, (ctx) => {
  ctx.state.db.Twitter.settings(ctx.match[2], ctx.session.currentGroup, ctx.match[1])
    .then(() => {
      ctx.session.settings[ctx.match[1]] = !ctx.session.settings[ctx.match[1]]
      renderSettings(ctx)
    })
    .catch((err) => console.log(err))
})

// MANAGE

async function renderSettings (ctx) {
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
    ctx.editMessageText(ctx.i18n.t('error.message'),
      Markup.inlineKeyboard(buttons).extra({ parse_mode: 'HTML' })
    )
    return
  }

  ctx.editMessageText(ctx.i18n.t('twitter.edit', {
    group_name: ctx.session.user.groups[ctx.session.currentGroupIndex].username || ctx.session.user.groups[ctx.session.currentGroupIndex].group_id,
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

module.exports = manageTwitter
