const handleSendMessage = async (bot, tweet, groups, settings) => {
  groups.forEach((group, i) => {
    const setting = settings[group][tweet.user.id_str] || {}

    let message = new Message(tweet, setting)

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
    this.tweet = tweet
    this.preview = true
    this.settings = settings
    this.text = this.getText()
    this.media = this.getMedia()
    this.method = this.getMethod()
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

  getText () {
    if (this.settings.onlyMedia) {
      return ''
    }

    let text = []
    const textTw = this.deleteLinks(this.tweet.full_text)
    const textQuo = this.deleteLinks(this.tweet.is_quote_status ? this.tweet.quoted_status.full_text : '')
    const textRt = this.deleteLinks(this.tweet.retweeted_status ? this.tweet.retweeted_status.full_text : '')

    if (this.tweet.quoted_status) {
      text[0] = `${this.settings.name ? `<b> ${this.tweet.user.name}</b>: ` : ''}`
      text[1] = `${textTw ? `\n\n${textTw}\n\n` : ''}`
      text[2] = `${textQuo ? `${this.tweet.quoted_status.user.name}:\n\n<i>${textQuo}</i>\n` : ''}`
      text[3] = `${this.settings.link ? `<a href="${this.linkMyself()}">${this.linkMyself()}</a>` : ''}`
    } else if (this.tweet.retweeted_status) {
      text[0] = `${this.settings.name ? this.tweet.user.name + ' ' : ''}`
      text[1] = '#retweet '
      text[2] = `${this.settings.from ? `from ${this.tweet.retweeted_status.user.name}` : ''}`
      text[3] = `${textRt ? '\n\n' + textRt + '\n' : ''}`
      text[4] = `${this.settings.link ? `<a href="${this.linkMyself()}">${this.linkMyself()}</a>` : ''}`
    } else {
      text[0] = `${this.settings.name ? `<b> ${this.tweet.user.name}</b>: ` : ''}`
      text[1] = `${textTw ? `\n\n${textTw}\n\n` : ''}`
      text[2] = `${this.settings.link ? `<a href="${this.linkMyself()}">${this.linkMyself()}</a>` : ''}`
    }

    text = text.join('')
    this.preview = !text.indexOf(/https:\/\/t.co/) > -1 // ???

    return text
  }

  getMedia () {
    const extendedEntities = this.tweet.is_quote_status ? this.tweet.quoted_status.extended_entities : this.tweet.extended_entities
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
