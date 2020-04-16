const { statusesShow } = require('../API')

const handleSendMessage = (bot, { twitter, post, groups = [], settings }) => {
  const tweet = post
  const sendPromises = groups.map(async (group, i) => {
    const setting = settings[group][tweet.user.id_str] || {}

    let message = await new Message(tweet, setting, groups, twitter)

    if (message.trash) {
      return 'trash'
    }
    console.time(i)

    await (() => new Promise(resolve => setTimeout(resolve, i * 1500)))()

    let sendedMessage
    const replyToId = message.reply_ids[group]
    console.log(encodeURIComponent(group))
    console.log(message.reply_ids[group])
    console.timeEnd(i)

    try {
      if (message.method === 'sendMessage') {
        sendedMessage = await bot.telegram[message.method](group, message.text, {
          parse_mode: 'HTML',
          disable_web_page_preview: message.preview,
          reply_to_message_id: replyToId
        })
      } else {
        sendedMessage = await bot.telegram[message.method](group, message.media, {
          caption: message.text,
          parse_mode: 'HTML',
          disable_web_page_preview: message.preview,
          reply_to_message_id: replyToId // ???????
        })
      }
      if (!Array.isArray(sendedMessage)) {
        sendedMessage = [sendedMessage]
      }
      sendedMessage.forEach((msg) => {
        twitter.set({
          posts: {
            ...twitter.posts,
            [group]: {
              ...twitter.posts[group],
              [tweet.id_str]: msg.message_id
            }
          }
        })
        twitter.groups.forEach((g, i) => {
          if (g.username === group) {
            twitter.groups[i].group_id = msg.chat.id
            twitter.groups[i].title = msg.chat.title
          }
        })
      })
    } catch (error) {
      return console.log(error)
    }
    message = null
    return 'done'
  })

  Promise.all(sendPromises).then((array) => {
    console.log(array)
    twitter.save()
  })
}

class Message {
  constructor (tweet, settings, groups, twitter) {
    return (async () => {
      this.tweet = tweet
      this.preview = true
      this.reply_ids = {}
      this.groups = groups // !!!
      this.twitter = twitter // !!!
      this.settings = settings
      this.trash = this.isTrash()
      if (!this.trash) {
        this.text = settings.onlyMedia ? '' : await this.getText()
        this.media = this.getMedia()
        this.method = this.getMethod()
      }
      return this
    })()
  }

  isTrash () {
    if (!this.settings.replies && this.tweet.is_quote_status) {
      return true
    }
    if (!this.settings.retweets && this.tweet.retweeted_status) {
      return true
    }
    return false
  }

  deleteLinks (text) {
    const links = []
    const retweet = this.tweet.retweeted_status
    const quote = this.tweet.quoted_status

    if (this.tweet.entities.media) {
      this.tweet.entities.media.forEach(m => links.push(m.url))
    }

    if (this.reply && this.reply.entities && this.reply.entities.media) {
      this.reply.entities.media.forEach(m => links.push(m.url))
    }

    if (retweet && retweet.entities.media) {
      links.push(retweet.entities.media[0].url)
    }

    if (quote) {
      links.push(this.tweet.quoted_status_permalink.url)
    }

    if (quote && quote.quoted_status && quote.quoted_status.entities.media) {
      links.push(quote.quoted_status.entities.media[0].url)
    }

    links.filter(e => e).forEach(link => { text = text.replace(link, '') })

    return text.trim()
  }

  linkToUser (x) {
    return `https://twitter.com/${x}`
  }

  linkToCurrentPost () {
    return `https://twitter.com/${this.tweet.user.screen_name}/status/${this.tweet.id_str}`
  }

  async getText () {
    if (this.settings.onlyMedia) {
      return ''
    }

    if (this.tweet.in_reply_to_status_id_str) {
      if (this.tweet.in_reply_to_user_id_str !== this.tweet.user.id_str) {
        this.reply = await statusesShow(this.tweet.in_reply_to_status_id_str)
          .catch((error) => { console.log(error) })
      } else if (this.tweet.in_reply_to_user_id_str === this.tweet.user.id_str) {
        this.reply_ids = this.groups.reduce((a, gr) => {
          if (this.twitter.posts[gr]) {
            if (this.twitter.posts[gr][this.tweet.in_reply_to_status_id_str]) {
              return {
                ...a,
                [gr]: this.twitter.posts[gr][this.tweet.in_reply_to_status_id_str]
              }
            }
          }
          return a
        }, {})
      }
    }

    if (this.reply) {
      this.reply = {
        full_text: this.deleteLinks(this.reply.full_text),
        name: this.reply.user.name
      }
    }

    let text = []
    const textTw = this.deleteLinks(this.tweet.full_text)
    const textQuo = this.deleteLinks(this.tweet.quoted_status ? this.tweet.quoted_status.full_text : '') // this.tweet.is_quote_status &&
    const textRt = this.deleteLinks(this.tweet.retweeted_status ? this.tweet.retweeted_status.full_text : '')

    const linkMyself = this.linkToUser(this.tweet.user.screen_name)
    const linkToPost = this.linkToCurrentPost()

    text.push(`${this.reply ? `#reply\n<a href="${linkMyself}">${this.reply.name}:</a>${this.reply.full_text ? '\n' + this.reply.full_text : '🖼'}\n↓\n` : ''}`)

    if (this.tweet.quoted_status) {
      text.push(`${this.settings.name ? ` <a href="${linkMyself}">${this.tweet.user.name}:</a> ` : ''}`)
      text.push(`${textTw ? `\n${textTw}\n↓\n` : ''}`) // ${reply}
      text.push(`${textQuo ? `<a href="${linkMyself}">${this.tweet.quoted_status.user.name}:</a>\n<i>${textQuo} </i>\n\n` : ''}`)
      text.push(`${this.settings.link ? `<a href="${linkToPost}">Twitter</a>` : ''}`)
    } else if (this.tweet.retweeted_status) {
      text.push(`${this.settings.name ? `<a href="${linkMyself}">${this.tweet.user.name}</a>` + ' ' : ''}`)
      text.push('#retweet ')
      text.push(`${this.settings.from ? `from <a href="${this.linkToUser(this.tweet.retweeted_status.user.screen_name)}">${this.tweet.retweeted_status.user.name}</a>` : ''}`)
      text.push(`${textRt ? '\n' + textRt + '\n\n' : ''}`) // ${reply}
      text.push(`${this.settings.link ? `<a href="${linkToPost}">Twitter</a>` : ''}`)
    } else {
      text.push(`${(this.settings.name || this.reply) ? `<a href="${linkMyself}">${this.tweet.user.name}:</a> ` : ''}`)
      text.push(`${textTw ? `\n${textTw}\n\n` : '🖼\n'}`) // ${reply}
      text.push(`${this.settings.link ? `<a href="${linkToPost}">Twitter</a>` : ''}`)
    }

    text = text.join('').trim()
    this.preview = !(text.indexOf('https://t.co') > -1) // ???

    if (!this.preview) {
      const link = text.match(/https:\/\/t.co\/\S*/m)[0]
      text = `<a href="${link}">&#8288;</a>`.concat(text)
    }

    return text
  }

  getMedia () {
    let extendedEntities = this.tweet.quoted_status ? this.tweet.quoted_status.extended_entities : this.tweet.extended_entities
    extendedEntities = this.tweet.retweeted_status ? this.tweet.retweeted_status.extended_entities : extendedEntities
    extendedEntities = this.tweet.extended_entities ? this.tweet.extended_entities : extendedEntities
    let medias = ''

    if (extendedEntities) {
      medias = extendedEntities.media.map((media) => {
        const type = media.type
        switch (type) {
          case 'video' || 'animated_gif':
            media.video_info.variants.find((v) => {
              if (v.content_type === 'video/mp4') {
                media = v.url
              }
            })
            break
          case 'photo':
            media = media.media_url_https
            break
          default:
            console.log('extended default return')
            return extendedEntities.media[0]
        }
        return {
          type,
          media
        }
      }).filter(e => e)

      if (medias[0]) {
        medias[0].caption = this.text
        medias[0].parse_mode = 'HTML'
      }
    }

    if (medias.length === 1) {
      this.type = medias[0].type
      return medias[0].media
    }

    if (this.settings.onlyMedia && medias) { // ??
      this.text = this.settings.onlyMedia ? '' : this.text
    }

    return medias
  }

  getMethod () {
    let method = 'sendMessage'

    if (this.settings.onlyText) {
      this.media = ''
    }

    if (Array.isArray(this.media)) {
      method = 'sendMediaGroup' // (chatId, media, [extra])
    } else {
      switch (this.type) {
        case 'photo':
          method = 'sendPhoto'// (chatId, photo, [extra])
          break
        case 'animation':
          method = 'sendAnimation'// (chatId, animation, [extra])
          break
        case 'video':
          method = 'sendVideo'// (chatId, question, options, [extra])
          break
      }
    }
    return method
  }
}

module.exports = handleSendMessage
