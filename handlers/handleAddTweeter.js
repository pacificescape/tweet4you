const list_id = process.env.LIST_ID
const {
    listMembersCreate,
    userShow
} = require('../API')

/**
 *
 * Function get screen_name from message, check it by userShow() and create/update field Tweet
 *
 */

module.exports = handleAddTweeter = async (ctx) => {
    let tweeter
    const screen_name = ctx.from.message.split('/').reverse()[0]

    const user = await userShow(screen_name)

    tweeter = await ctx.state.db.Tweet.findOne({
        user_id: user.id
      })

    if(!tweeter) {
        tweeter = new ctx.state.db.Tweet()

        tweeter.id = user.id
        tweeter.status = {
            id: user.status.id,
            text: user.status.text,
            entities: user.status.entities,
            created_at: user.status.created_at,
        }
        tweeter.screen_name = user.screen_name
        tweeter.description = user.description
        tweeter.name = user.name
        tweeter.list = list_id
    }

    listMembersCreate(tweeter.list, tweeter.id)
}
