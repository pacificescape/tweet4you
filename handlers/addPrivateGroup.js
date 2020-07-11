module.exports = async ctx => {
  await ctx.state.db.Group.addPrivate(ctx)
    .then(() => ctx.reply('succes'))
    .catch((err) => {
      console.log(err)
      ctx.reply('error')
    })
}
