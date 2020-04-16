const { listsList } = require('../API')

module.exports = async () => {
  const lists = await listsList()

  return lists.map(list => list.id_str)
}
