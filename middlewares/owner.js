module.exports = (ctx, next) => {
  if (ctx.message.from.id === +process.env.OWNER_ID) {
    return next()
  }
  ctx.reply(ctx.i18n.t('no_owner'))
}
