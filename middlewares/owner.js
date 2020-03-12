module.exports = async (ctx, next) => {
    if(ctx.message.from.id === +process.env.OWNER_ID) {
        return await next()
    }
    ctx.reply(ctx.i18n.t('no_owner'))
}
