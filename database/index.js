const collections = require('./models') //
const connection = require('./connection')
const { usersShow } = require('../API')
const parseLink = require('../helpers/parseLink')
const { handleAddToList } = require('../handlers')
let list_id = process.env.LIST_ID

const db = {
  connection
}


Object.keys(collections).forEach((collectionName) => {
  db[collectionName] = connection.model(collectionName, collections[collectionName])
})

// User methods

db.User.check = async (telegram_id) => {
  let user = await db.User.findOne({ telegram_id })
    .populate('twitters')
    .populate('groups')

  await db.User.populate(user, 'twitters.groups')

  return user
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

  await user.populate({ path: 'twitters.groups', model: db.Group})
  await user.populate({ path: 'groups.twitters', model: db.Twitter})

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
  .populate('groups')
  .catch((error) => console.log(error))

  if(!twitter) {
    user.error = true
    return user
  }

  return twitter
} //ratelimit

db.Twitter.upToDate = async (ctx) => {
  let fetched_tw = await db.Twitter.check(ctx)

  if(fetched_tw.error) {
    twitter = new db.Twitter()

    twitter.counter = 0
    twitter.screen_name = fetched_tw.screen_name
    twitter.name = fetched_tw.name
    twitter.id = fetched_tw.id_str
    twitter.last_status = fetched_tw.status
    twitter.users.addToSet(ctx.session.user)

    ctx.session.user.twitters.addToSet(twitter)

    await ctx.session.user.save().catch((error) => console.log(ctx.session.user.username, error))

    twitter = await twitter.save().catch((error) => console.log(ctx.session.user.username, error))

    return
  }

  // let findTwitter = await ctx.session.user.find({$elemMatch: {id: fetched_tw.id }})
  // console.log(findTwitter)

  // let findUser = await fetched_tw.find({'users': {$elemMatch: { telegram_id: ctx.session.user.telegram_id }}})
  // console.log(findUser)

  // let add_user = await fetched_tw.users.addToSet(ctx.session.user)
  // console.log('add user: ', add_user)

  // let tw_save = await fetched_tw.save().catch((error) => console.log(ctx.session.user.username, error))
  // console.log('tw_save: ', tw_save)

  let old_tw = ctx.session.user.twitters.reduce((a, v) => v.id === fetched_tw.id ? true : false, false)

  let add_twitter = !old_tw ? ctx.session.user.twitters.addToSet(fetched_tw) : null
  console.log('add twitter: ', add_twitter)

  let user_save = await ctx.session.user.save().catch((error) => console.log(ctx.session.user.username, error))
  console.log(user_save)

  return
}

db.Twitter.deactivate = async (twitter, group) => {
  await db.Twitter.findByIdAndUpdate(twitter._id, {
    $pull: {
      groups: group._id
    }
  }, { new: true }).catch((err) => err)

  await db.Group.findByIdAndUpdate(group._id, {
    $pull: {
      twitters: twitter._id
    }
  }, { new: true }).catch((err) => err)

  return null
}

db.Twitter.activate = async (twitter, group) => {
  await db.Twitter.findByIdAndUpdate(twitter._id, {
    $push: {
      groups: group
    }
  })

  await db.Group.findByIdAndUpdate(group._id, {
    $push: {
      twitters: twitter
    }
  })

  return await handleAddToList(list_id, twitter.id).catch((err) => console.log(err))
}

// Group methods

db.Group.check = async (username) => {
  if(!username) {
    throw 'Wrong username'
  }

  let group = await db.Group.findOne({ username })
  .populate('users')
  .populate('twitters')
  .catch((error) => console.log(error))

  if(!group) {
    return false
  }

  return group
}

db.Group.update = async (ctx) => { // first time
  let group = await db.Group.check(ctx.match[1])

  group.telegram_id = ctx.chat.id
  group.first_name = ctx.chat.title || ''
  group.locale = ctx.from.language_code || 'ru'
}

db.Group.add = async (ctx) => {
  let group = await db.Group.check(ctx.match[1])

  if(!group) {
    group = new db.Group()
    group.username = ctx.match[1]
    group.users.addToSet(ctx.session.user)

    await group.save().catch((err) => console.log(err))
  }

  let newbie = group.users.reduce((a, v) => v.id === group.id ? false : true, true)

  if (newbie) {
    group.users.addToSet(ctx.session.user)
    ctx.session.user.groups.addToSet(group)

    await group.save().catch((err) => console.log(err))
  }

  ctx.session.user = await ctx.session.user.save()

  return group
}

module.exports = {
  db
}
