const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
// const isAdmin = require('../helpers/isAdmin')
const groupsMenu = new Scene('groupsMenu')

groupsMenu.enter((ctx) => {
  const buttons = [
    Markup.callbackButton(ctx.i18n.t('back'), 'main'),
    Markup.callbackButton('\\\'>\'/', '>')
  ]

  const groups = ctx.session.user.groups.map((v, i) => {
    return Markup.callbackButton(v.username, `group=${i}`)
  })

  ctx.editMessageText(ctx.i18n.t('groupsMenu', {
    groups: `<b>${groups.length}</b>`
  }),
  Markup.inlineKeyboard(groups.concat(buttons), {
    wrap: (btn, index, currentRow) => {
      return currentRow.length === 2 || index === groups.length
    }
  }).extra({ parse_mode: 'HTML' })
  )
    .then((message) => { ctx.scene.state.message_id = message.message_id })
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

groupsMenu.hears(/t.me\/(.+)|@(.+)/, async (ctx) => {
  console.log('match: ', ctx.match)

  ctx.match = ctx.match.filter(e => e)

  ctx.state.db.Group.add(ctx)
    .then((g) => {
      ctx.reply(`${g.username} Успешно добавлен.`, { reply_to_message_id: ctx.message.message_id })
    })
    .then(() => ctx.scene.enter('groupsMenu'))
    .catch((err) => {
      ctx.reply(`Ошибка: ${err}.`, { reply_to_message_id: ctx.message.message_id })
    })
})

// OPEN GROUP

groupsMenu.action(/group=(.+)/, (ctx) => {
  ctx.session.group = ctx.match[1]
  showTwitters(ctx)
})

groupsMenu.action(/deactivate=(.+)/, async (ctx) => {
  const twitter = ctx.session.user.twitters[ctx.match[1]]
  const group = ctx.session.user.groups[ctx.session.group]

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
  const group = ctx.session.user.groups[ctx.session.group]

  await ctx.state.db.Twitter.activate(twitter, group)

  ctx.session.user = await ctx.state.db.User.update(ctx)

  showTwitters(ctx)
})

groupsMenu.action('main', (ctx) => ctx.scene.enter('mainMenu'))
groupsMenu.action('group', (ctx) => ctx.scene.enter('groupsMenu'))
groupsMenu.action('delete', (ctx) => ctx.reply('\\(\'>\')/'))

async function showTwitters (ctx) {
  const buttons = [
    Markup.callbackButton(ctx.i18n.t('back'), 'group'),
    Markup.callbackButton(ctx.i18n.t('delete'), 'delete')
  ]

  const group = ctx.session.user.groups[ctx.session.group]

  const getGroup = (v, u) => v.groups.reduce((a, c) => c.username === u ? true : a, false)

  await ctx.session.user.twitters.forEach(v => v.populate('groups'))

  const twitters = ctx.session.user.twitters.map((v, i) => {
    const enabled = getGroup(v, group.username)
    return Markup.callbackButton(`${v.screen_name} ${enabled ? '✅' : '❌'}`, `${enabled ? `deactivate=${i}` : `activate=${i}`}`)
  })

  ctx.editMessageText(ctx.i18n.t('toggle_posting', {
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
