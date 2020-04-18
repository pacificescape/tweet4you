const { listMembersCreate } = require('../API')

module.exports = async (listId, twitterId) => {
  // ctx.state.db.List.findAll

  return listMembersCreate(listId, twitterId)
}
