// const listId = process.env.LIST_ID
const collections = require('./models')
const connection = require('./connection')
const parseLink = require('../helpers/parseLink')
const { addToList } = require('../handlers')
const {
  usersShow,
  listsCreate
} = require('../API')
const {
  escapeHTMLChar
} = require('../handlers')

const db = {
  connection
}

Object.keys(collections).forEach((collectionName) => {
  db[collectionName] = connection.model(collectionName, collections[collectionName])
})

// User methods

db.User.check = async (telegramId) => {
  const user = await db.User.findOne({ telegram_id: telegramId })
    .populate('twitters')
    .populate('groups')

  await db.User.populate(user, 'twitters.groups')

  return user
}

db.User.update = async (ctx) => {
  let user = await db.User.check(ctx.from.id)

  if (!user) {
    user = new db.User()

    user.telegram_id = ctx.from.id
    user.username = ctx.from.username
    user.first_name = escapeHTMLChar(ctx.from.first_name) || ''
    user.last_name = escapeHTMLChar(ctx.from.last_name) || ''
    user.locale = ctx.from.language_code || 'ru'

    await user.save().catch((err) => console.log(err))
  }

  await user.populate({ path: 'twitters.groups', model: db.Group })
  await user.populate({ path: 'groups.twitters', model: db.Twitter })

  return user
}

// Twitter methods

db.Twitter.check = async (ctx) => {
  const link = parseLink(ctx.message.text)

  if (!link) {
    throw new Error('Wrong link')
  }
  const user = await usersShow(link)

  const twitter = await db.Twitter.findOne({ id: user.id_str })
    .populate('users')
    .populate('groups')
    .catch((error) => console.log(error))

  if (!twitter) {
    user.error = true
    return user
  }

  return twitter
}

db.Twitter.upToDate = async (ctx) => {
  const fetchedTw = await db.Twitter.check(ctx)

  if (fetchedTw.error) {
    let twitter = new db.Twitter()

    twitter.counter = 0
    twitter.screen_name = fetchedTw.screen_name
    twitter.name = fetchedTw.name
    twitter.id = fetchedTw.id_str
    twitter.last_status = fetchedTw.status
    twitter.users.addToSet(ctx.session.user)

    ctx.session.user.twitters.addToSet(twitter)

    await ctx.session.user.save().catch((error) => console.log(ctx.session.user.username, error))

    twitter = await twitter.save().catch((error) => console.log(ctx.session.user.username, error))

    return twitter
  }

  const oldTw = ctx.session.user.twitters.reduce((a, v) => v.id === fetchedTw.id, false)

  const addTwitter = !oldTw ? ctx.session.user.twitters.addToSet(fetchedTw) : null
  console.log('add twitter: ', addTwitter)

  const userSave = await ctx.session.user.save().catch((error) => console.log(ctx.session.user.username, error))
  return userSave ? fetchedTw : new Error('Didn\'t added. Error')
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

db.Twitter.settings = async (twitterId, groupId, option) => {
  const group = await db.Group.findOne({ username: groupId })

  group.set({
    settings: {
      ...group.settings,
      [twitterId]: {
        ...group.settings[twitterId],
        [option]: !group.settings[twitterId][option]
      }
    }
  })

  group.save().then(g => console.log(g))
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
    },
    $set: {
      ['settings.' + twitter.id]: {
        link: true,
        name: true,
        retweets: true,
        from: true,
        replies: true,
        images: true,
        videos: true,
        onlyText: false,
        onlyMedia: false,
        clearMedia: false
      }
    }
  })

  if (!twitter.list) {
    const list = await db.List.getIncomplete()
    return await addToList(list.id_str, twitter.id).catch((err) => console.log(err))
  }
}

db.Twitter.delete = async (ctx) => {
  const twitter = await db.Twitter.findOne({ id: ctx.match[1] })
    .populate('users')
    .populate('groups')

    const groups = [...new Set(posts.map((post) => post.user.id_str))]

  await db.Twitter.deleteOne({
    _id: ctx.session.user.groups[ctx.session.group].id
  })
  const title = ctx.session.user.groups[ctx.session.group].title
  ctx.session.user = await db.User.update(ctx)
  return title
}

// Group methods

db.Group.check = async (username) => {
  if (!username) {
    throw new Error('Wrong username')
  }

  const group = await db.Group.findOne({ username })
    .populate('users')
    .populate('twitters')
    .catch((error) => console.log(error))

  if (!group) {
    return false
  }

  return group
}

db.Group.update = async (ctx) => { // first time
  const group = await db.Group.check(ctx.match[1])

  group.telegram_id = ctx.chat.id
  group.first_name = ctx.chat.title || ''
  group.locale = ctx.from.language_code || 'ru'
}

db.Group.add = async (ctx) => {
  const info = await ctx.telegram.getChatAdministrators(`@${ctx.match[1]}`).catch(err => err) // перехват выше ?

  if (info.code) {
    throw new Error('Бот не имеет доступа к группе/каналу')
  }

  if (Array.isArray(info)) {
    const score = info.reduce((a, v) => (v.user.id === ctx.from.id) || (v.user.id === global.botId) ? a + 1
      : a, 0)

    if (score < 2) {
      throw new Error('Бот или вы не являетесь администратором')
    }
  }

  let group = await db.Group.check(`@${ctx.match[1]}`)

  if (!group) {
    group = new db.Group()
    group.username = `@${ctx.match[1]}`
    // group.users.addToSet(ctx.session.user)

    await group.save().catch((err) => console.log(err))
  }

  const newbie = group.users.reduce((a, v) => v.id !== ctx.session.user.id, true)

  if (newbie) {
    group.users.addToSet(ctx.session.user)
    ctx.session.user.groups.addToSet(group)

    await group.save().catch((err) => console.log(err))
  }

  ctx.session.user = await ctx.session.user.save()

  return group
}

db.Group.delete = async (ctx) => {
  await db.Group.deleteOne({
    _id: ctx.session.user.groups[ctx.session.group].id
  })
  const title = ctx.session.user.groups[ctx.session.group].title
  ctx.session.user = await db.User.update(ctx)
  return title
}

// List methods

db.List.create = async () => {
  const list = new db.List()
  const newList = await listsCreate()

  list.list_id = newList.id_str
  list.full_name = newList.full_name
  list.name = newList.name
  list.member_count = 0
  list.created = newList.created_at

  return await list.save()
}

db.List.getIncomplete = async () => {
  let list = db.List.findOne({ member_count: { $lt: 100 } })

  if (!list) {
    const date = new Date()
    list = await db.List.create(`retweet4bot-${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`)
  }

  return list
}

module.exports = {
  db
}

// const updateSettings = async () => {
//   const groups = await db.Group.find().populate('twitters')

//   groups.forEach((group) => {
//     for (const twitter of group.twitters) {
//       group.set({
//         ['settings.' + [twitter.id]]: {
//           clearMedia: false,
//           name: true,
//           from: true,
//           link: true,
//           retweets: true,
//           replies: true,
//           images: true,
//           videos: true,
//           onlyText: false,
//           onlyMedia: false
//         }
//       }
//       )
//     }

//     group.save().then((data) => {
//       console.log(data)
//     })
//   })
// }

// updateSettings()

// const updateSettings = async () => {
//   const twitters = await db.Twitter.find()

//   twitters.forEach((twitter) => {
//     twitter.list = process.env.LIST_ID

//     twitter.save().then((data) => {
//       console.log(data)
//     })
//   })
// }

// updateSettings()
