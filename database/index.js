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

    await user.save().catch((err) => console.log(err))
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
  let fetched_tw = await db.Twitter.check(ctx)

  if(fetched_tw.error) {
    twitter = new db.Twitter()

    twitter.counter = 0
    twitter.screen_name = fetched_tw.screen_name
    twitter.name = fetched_tw.name
    twitter.id = fetched_tw.id
    twitter.last_status = fetched_tw.status
    twitter.users.addToSet(ctx.session.user)

    ctx.session.user.twitters.addToSet(twitter)

    await ctx.session.user.save().catch((error) => console.log(ctx.session.user.username, error))

    return await twitter.save().catch((error) => console.log(ctx.session.user.username, error))
  }

  let add_user = await fetched_tw.users.addToSet(ctx.session.user)
  console.log('add user: ', add_user)

  let tw_save = await fetched_tw.save().catch((error) => console.log(ctx.session.user.username, error))
  console.log('tw_save: ', tw_save)

  let old_tw = ctx.session.user.twitters.reduce((a, v) => v.id === fetched_tw.id ? true : false, false)

  let add_twitter = !old_tw ? ctx.session.user.twitters.addToSet(fetched_tw) : null
  console.log('add twitter: ', add_twitter)

  let user_save = await ctx.session.user.save().catch((error) => console.log(ctx.session.user.username, error))
  console.log(user_save)

  return tw_save
}

// List methods

db.Group.update = async (ctx) => {
  let username = ctx.match[1]



  console.log(username)
}

module.exports = {
  db
}
