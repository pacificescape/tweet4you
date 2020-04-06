const { listMembersCreate } = require('../API')

module.exports = (listId, userId) => {
  return listMembersCreate(listId, userId)
}
