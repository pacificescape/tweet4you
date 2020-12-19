const Queue = require('bull')
const Message = require('./Message')

const createQueue = (channel) => {
  console.log(channel)
  const channelUsername = channel.group_id || channel.username

  const queue = new Queue(channelUsername, {
    limiter: {
      max: process.env.QUEUE_LIMIT_MAX || 10,
      duration: process.env.QUEUE_LIMIT_DURATION || 1e3
    }
  })

  queue.process(async (job, done) => {
    const { bot } = require('../bot')
    const { db } = require('../database')
    const { twitter: tw, post } = job.data

    try {
      const twitter = await db.Twitter.findOne({ _id: tw._id })

      let settings = await db.Settings
        .findOne({ twitter, group: channel })
        .catch(() => ({}))

      if (!settings) settings = {}

      let message = await new Message(post, settings, twitter)

      if (message.trash) return 'trash'

      let sendedMessage
      // const replyToId = message.reply_ids[channel]
      const replyToId = message.reply_ids[channelUsername]

      if (!channelUsername.includes('@')) {
        channelUsername = -channelUsername
      }

      try {
        if (message.method === 'sendMessage') {
          if (!message.text) return

          sendedMessage = await bot.telegram[message.method](channelUsername, message.text, {
            parse_mode: 'HTML',
            disable_web_page_preview: message.preview,
            reply_to_message_id: replyToId
          })
        } else {
          sendedMessage = await bot.telegram[message.method](channelUsername, message.media, {
            caption: message.text,
            parse_mode: 'HTML',
            disable_web_page_preview: message.preview,
            reply_to_message_id: replyToId
          })
        }

        twitter.set({
          posts: {
            ...twitter.posts,
            [channelUsername]: {
              ...twitter.posts[channelUsername],
              [post.id_str]: sendedMessage.message_id
            }
          }
        })
        twitter.groups.forEach((g, i) => {
          if (g.username === channelUsername) {
            twitter.groups[i].group_id = sendedMessage.chat.id
            twitter.groups[i].title = sendedMessage.chat.title
          }
        })

        message = null
        await twitter.save()
        done()
      } catch (error) {
        switch (error.message) {
          case '403: Forbidden: bot is not a member of the channel chat':
            console.log('bot is not admin error')
            // task: deactivate if not admin
            break;
          default:
            break;
        }
        throw new Error(error)
      }
    } catch (error) {
      console.log(error)
    }
  })
  return queue
}

module.exports = createQueue
