const { statusesShow } = require('../API')

const handleSendMessage = async (bot, tweet, groups, settings) => {
  groups.forEach(async (group, i) => {
    const setting = settings[group][tweet.user.id_str] || {}

    let message = await new Message(tweet, setting)

    if (message.trash) {
      return
    }

    setTimeout(() => {
      try {
        if (message.method === 'sendMessage') {
          bot.telegram[message.method](group, message.text, {
            parse_mode: 'HTML',
            disable_web_page_preview: message.preview
          })
        } else {
          bot.telegram[message.method](group, message.media, {
            caption: message.text,
            parse_mode: 'HTML',
            disable_web_page_preview: message.preview
          })
        }
      } catch (error) {
        console.log(error)
      }
      message = null
    }, i * 1000)
  })
}

class Message {
  constructor (tweet, settings) {
    return (async () => {
      this.tweet = tweet
      this.preview = true
      this.settings = settings
      this.text = await this.getText()
      this.media = this.getMedia()
      this.method = this.getMethod()
      this.trash = false
      return this
    })()
  }

  deleteLinks (text) {
    const links = []
    const retweet = this.tweet.retweeted_status
    const quote = this.tweet.quoted_status

    if (this.tweet.entities.media) {
      this.tweet.entities.media.forEach(m => links.push(m.url))
    }

    if (retweet && retweet.entities.media) {
      links.push(retweet.entities.media[0].url)
    }

    if (quote) {
      links.push(this.tweet.quoted_status_permalink.url)
    }

    if (quote && quote.quoted_status.entities.media) {
      links.push(quote.quoted_status.entities.media[0].url)
    }

    links.filter(e => e).forEach(link => { text = text.replace(link, '') })

    return text.trim()
  }

  linkMyself () {
    return `https://twitter.com/${this.tweet.user.screen_name}/status/${this.tweet.id_str}`
  }

  async getText () {
    if (this.settings.onlyMedia) {
      return ''
    }

    if (this.tweet.in_reply_to_status_id_str) {
      this.reply = await statusesShow(this.tweet.in_reply_to_status_id_str)
        .then((tw) => {
          return {
            full_text: tw.full_text,
            name: tw.user.name
          }
        }).catch((error) => { console.log(error) })
    }

    let text = []
    const textTw = this.deleteLinks(this.tweet.full_text)
    const textQuo = this.deleteLinks(this.tweet.is_quote_status ? this.tweet.quoted_status.full_text : '')
    const textRt = this.deleteLinks(this.tweet.retweeted_status ? this.tweet.retweeted_status.full_text : '')

    text.push(`${this.reply ? `#reply\n<b>${this.reply.name}</b>:\n${this.reply.full_text}\n\n⬇\n\n` : ''}`)

    const reply = this.reply ? '' : '\n' // ???????
    const linkToPost = this.linkMyself()

    if (this.tweet.quoted_status) {
      text.push(`${this.settings.name ? `<b> ${this.tweet.user.name}</b>: ` : ''}`)
      text.push(`${textTw ? `${reply}\n${textTw}\n\n` : ''}`)
      text.push(`${textQuo ? `${this.tweet.quoted_status.user.name}:\n\n<i>${textQuo}</i>\n` : ''}`)
      text.push(`${this.settings.link ? `<a href="${linkToPost}">${linkToPost}...</a>` : ''}`)
    } else if (this.tweet.retweeted_status) {
      text.push(`${this.settings.name ? this.tweet.user.name + ' ' : ''}`)
      text.push('#retweet ')
      text.push(`${this.settings.from ? `from ${this.tweet.retweeted_status.user.name}` : ''}`)
      text.push(`${textRt ? `${reply}\n` + textRt + '\n' : ''}`)
      text.push(`${this.settings.link ? `<a href="${linkToPost}">${linkToPost}</a>` : ''}`)
    } else {
      text.push(`${this.settings.name ? `<b>${this.tweet.user.name}</b>: ` : ''}`)
      text.push(`${textTw ? `${reply}\n${textTw}\n\n` : ''}`)
      text.push(`${this.settings.link ? `<a href="${linkToPost}">${linkToPost}</a>` : ''}`)
    }

    text = text.join('')
    this.preview = !(text.indexOf('https://t.co') > -1) // ???

    return text
  }

  getMedia () {
    let extendedEntities = this.tweet.is_quote_status ? this.tweet.quoted_status.extended_entities : this.tweet.extended_entities
    extendedEntities = this.tweet.retweeted_status ? this.tweet.retweeted_status.extended_entities : extendedEntities
    extendedEntities = this.tweet.extended_entities ? this.tweet.extended_entities : extendedEntities
    let medias = ''

    if (extendedEntities) {
      medias = extendedEntities.media.map((media, i) => {
        let type = media.type
        switch (type) {
          case 'animated_gif':
            type = 'animation'
            break
          case 'video':
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

    return medias
  }

  getMethod () {
    let method = 'sendMessage'
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
