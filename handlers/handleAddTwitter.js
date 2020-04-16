const listId = process.env.LIST_ID
const addToList = require('./addToList')
const {
  // listMembersCreate,
  userShow
} = require('../API')

/**
 *
 * Function get screen_name from message, check it by userShow() and create/update field Tweet
 *
 */

module.exports = async (ctx) => {
  let twitter
  const screenName = ctx.from.message.split('/').reverse()[0]

  const user = await userShow(screenName)

  twitter = await ctx.state.db.Tweet.findOne({
    user_id: user.id
  })

  if (!twitter) {
    twitter = new ctx.state.db.Tweet()

    twitter.id = user.id
    twitter.status = {
      id: user.status.id,
      text: user.status.text,
      entities: user.status.entities,
      created_at: user.status.created_at
    }
    twitter.screen_name = user.screen_name
    twitter.description = user.description
    twitter.name = user.name
    twitter.list = listId
  }

  // listMembersCreate(twitter.list, twitter.id)

  addToList(ctx, twitter)
}
