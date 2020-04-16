const { listMembersCreate } = require('../API')

module.exports = async (ctx, twitter) => {
  // ctx.state.db.List.findAll

  return listMembersCreate(twitter.list, twitter.id)
}
