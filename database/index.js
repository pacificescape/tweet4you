const collections = require('./models') //
const connection = require('./connection')
const usersShow = require('../API')
const parseLink = require('../helpers/parseLink')


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

db.Twitter.check = async (message) => {
  let link = parseLink(message)

  if(link) {
    let user = await usersShow(link)

    return user
  }
  return
} //ratelimit

db.Twitter.update = async (ctx) => {
  let twitter = await db.Twitter.check(ctx.text)

  if(!twitter) {
    let link = parseLink(message)
    if(!link) return null

    let user = await usersShow(link)
    if(!user.ok) return null

    twitter = new ctx.db.Twitter()

    twitter.counter = 0
    twitter.screen_name= user.screen_name
    twitter.name = user.name
    twitter.id = user.id
    twitter.last_status = user.
    twitter.last_status = user.status
    twitter.users = [].push(ctx.session.user)

    await twitter.save()
  }

  return twitter
}

// List methods

// Group methods

module.exports = {
  db
}
