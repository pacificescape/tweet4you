const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
// const isAdmin = require('../helpers/isAdmin')
const groupsMenu = new Scene('groupsMenu')
const { finWord, paginator } = require('../helpers')
const pageLength = 10
let buttons

function mainGroupsPage (ctx, addition) {
  ctx.session.pages = Math.ceil(ctx.session.user.groups.length / pageLength)
  addition = addition || ''
  const { buttons, page } = paginator(ctx, ctx.i18n.t('back'), 'back')

  const groups = ctx.session.user.groups.slice(page * pageLength, (page + 1) * pageLength).map((v) => {
    return Markup.callbackButton(v.username ? v.username : v.group_id, `group=${v.username ? v.username : v.group_id}`)
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

// OPEN GROUP

groupsMenu.action(/group=(.+)/, (ctx) => {
  ctx.session.group = ctx.match[1]
  ctx.scene.enter('groupTwitters')
})

groupsMenu.action('main', (ctx) => ctx.scene.enter('mainMenu'))
groupsMenu.action('group', (ctx) => {
  mainGroupsPage(ctx)
})
groupsMenu.action('|', (ctx) => {
  ctx.answerCbQuery()
})
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

module.exports = groupsMenu
