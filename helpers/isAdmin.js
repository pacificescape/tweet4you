module.exports = async (ctx, next) => {
  let admins = await ctx.getChatAdministrators(ctx.chat.id).catch(() => [])
  admins = admins.map((v) => v.user.id)

  if (admins && admins.includes(ctx.message.from.id)) {
    return await next()
  }
}
