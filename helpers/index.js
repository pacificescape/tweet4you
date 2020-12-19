const isAdmin = require('./isAdmin')
const finWord = require('./finWord')
const escapeHTMLChar = require('./escapeHTMLChar')
const paginator = require('./paginator')
const parseLink = require('./parseLink')

module.exports = {
  isAdmin,
  finWord,
  escapeHTMLChar,
  paginator,
  parseLink,
  method,
  switchPage
}

function method (ctx) {
  return ctx.callbackQuery ? 'editMessageText' : 'replyWithHTML'
}

async function switchPage (ctx) {
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
      await ctx.answerCbQuery()
  }
}
