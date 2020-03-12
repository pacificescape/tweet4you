module.exports = async (ctx, chat) => {
    let chat_member = await ctx.getChatAdministrators(chat).catch(() => 'private')
    console.log(chat_member)

    return chat_member
    // if(ctx.message.from.id === +process.env.OWNER_ID) {
    //     return await next()
    // }
    ctx.reply(ctx.i18n.t('no_admin'))
}
