module.exports = async (ctx, next) => {
  const ms = new Date()

  if (ctx.from) {
    if (!ctx.session.user) {
      ctx.session.user = await ctx.state.db.User.update(ctx)
      console.log('new session: ', new Date().toLocaleTimeString())
    }
  }
  // if (ctx.session.user && ctx.session.user.locale) console.log(ctx.session.user.locale)
  if (ctx.callbackQuery) ctx.state.answerCbQuery = []
  return next(ctx).then(() => {
    if (ctx.callbackQuery) ctx.answerCbQuery(...ctx.state.answerCbQuery).catch((err) => console.log(err))
    console.log('Response time %sms', new Date() - ms)
  })
}
