const { listMembersCreate } = require('../API')

module.exports = (list_id, user_id) => {
    return listMembersCreate(list_id, user_id)
}
