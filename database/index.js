const collections = require('./models') //
const connection = require('./connection')
const { usersShow } = require('../API')
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

db.Twitter.check = async (ctx) => {
  let link = parseLink(ctx.message.text)

  if(!link) {
    throw 'Wrong link'
  }
  let user = await usersShow(link)

  let twitter = await db.Twitter.findOne({ id: user.id })
  .populate('users')
  .catch((error) => console.log(error))

  if(!twitter) {
    user.error = true
    return user
  }

  return twitter
} //ratelimit

db.Twitter.update = async (ctx) => {
  let account = await db.Twitter.check(ctx)

  if(account.error) {
    twitter = new db.Twitter()

    twitter.counter = 0
    twitter.screen_name = account.screen_name
    twitter.name = account.name
    twitter.id = account.id
    twitter.last_status = account.status
    twitter.users.push(ctx.session.user)

    await twitter.save()

    ctx.session.user.twitters.push(twitter)
    await ctx.session.user.save()

    return twitter
  }

  account.users.push(ctx.session.user)
  ctx.session.user.twitters.push(account)
  await ctx.session.user.save()

  return account
}

// List methods

// Group methods

module.exports = {
  db
}
