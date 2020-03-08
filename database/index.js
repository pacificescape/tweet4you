const collections = require('./models') //
const connection = require('./connection')


const db = {
  connection
}


Object.keys(collections).forEach((collectionName) => {
  db[collectionName] = connection.model(collectionName, collections[collectionName])
})

// User methods

db.User.check = async (telegram_id) => {
  return await db.User.findOne({ telegram_id })
    .populate('twitters')
    .populate('groups')
}

db.User.update = async (ctx) => {
  let user = await db.User.check(ctx.from.id)

  if(!user) {
    user = new db.User()

    user.telegram_id = ctx.from.id
    user.username = ctx.from.username
    user.first_name = ctx.from.first_name || ''
    user.last_name = ctx.from.last_name || ''
    user.locale = ctx.from.language_code || 'ru'
    await user.save()
  }

  return user
}

// Twitter methods

// List methods

// Group methods

module.exports = {
  db
}
