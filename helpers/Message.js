const { statusesShow } = require('../API')

class Message {
  constructor (tweet, settings, twitter) {
    return (async () => {
      this.tweet = tweet
      this.preview = true
      this.reply_ids = {}
      this.groups = twitter.groups.map(g => g.group_id ? g.group_id : g.username).filter(Boolean)
      this.twitter = twitter
      this.settings = settings
      this.trash = this.isTrash()
      if (!this.trash) {
        this.text = settings.onlyMedia ? '' : await this.getText()
        this.media = settings.onlyText ? '' : this.getMedia()
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
        this.reply_ids = this.groups.reduce((a, gr) => { // task: uint8 array for ids
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

    if (this.tweet.quoted_status) { // quoted_status
      text.push(`${this.settings.name ? ` <a href="${linkMyself}">${this.tweet.user.name}:</a> ` : ''}`)
      text.push(`${textTw ? `\n${textTw}\n↓\n` : ''}`) // ${reply}
      text.push(`${textQuo ? `<a href="${linkMyself}">${this.tweet.quoted_status.user.name}:</a>\n<i>${textQuo} </i>\n\n` : ''}`)
      text.push(`${this.settings.link ? `<a href="${linkToPost}">Twitter</a>` : ''}`)
    } else if (this.tweet.retweeted_status) { // retweeted_status
      text.push(`${this.settings.name ? `<a href="${linkMyself}">${this.tweet.user.name}</a>` + ' ' : ''}`)
      text.push('#retweet ')
      text.push(`${this.settings.from ? `from <a href="${this.linkToUser(this.tweet.retweeted_status.user.screen_name)}">${this.tweet.retweeted_status.user.name}</a> ` : ''}`)
      text.push(`${textRt ? '\n' + textRt + '\n\n' : ''}`) // ${reply}
      text.push(`${this.settings.link ? `<a href="${linkToPost}">Twitter</a>` : ''}`)
    } else { // simple tweet
      text.push(`${(this.settings.name || this.reply) ? `<a href="${linkMyself}">${this.tweet.user.name}:</a> ` : ''}`)
      text.push(`${textTw ? `\n${textTw}\n\n` : this.reply ? '🖼\n' : '\n'}`) // ${reply}
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
    let extendedEntities
    if (!this.settings.onlyMedia) {
      extendedEntities = this.tweet.quoted_status ? this.tweet.quoted_status.extended_entities : this.tweet.extended_entities
    }
    if (this.settings.retweets) {
      extendedEntities = this.tweet.retweeted_status ? this.tweet.retweeted_status.extended_entities : extendedEntities
    }
    extendedEntities = this.tweet.extended_entities ? this.tweet.extended_entities : extendedEntities
    let medias = ''

    if (extendedEntities) {
      medias = extendedEntities.media.map((media) => {
        return {
          type: media.type,
          media: getMediaByType(media) || extendedEntities.media[0]
        }
      }).filter(e => e)

      if (medias[0]) {
        medias[0].caption = this.text
        medias[0].parse_mode = 'HTML'
      }
    }

    if (medias.length === 1) {
      this.type = medias[0].type
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
      return method
    }

    if (this.media.length > 1) {
      method = 'sendMediaGroup'
    } else {
      this.media = this.media[0] ? this.media[0].media : ''
      switch (this.type) {
        case 'photo':
          method = 'sendPhoto'
          break
        case 'animated_gif':
        case 'video':
          method = 'sendVideo'
          break
      }
    }
    return method
  }
}

function getMediaByType (media) {
  function getVideo (media) {
    const variants = media.video_info.variants.filter(v => v.bitrate).sort((a,b) => b.bitrate - a.bitrate)
    return variants[0].url || ''
  }

  function getPhoto (media) {
    return media.media_url_https
  }

  const mediaTypes = {
    video: getVideo,
    animated_gif: getVideo,
    photo: getPhoto,
    default: () => {}
  }

  const MediaExtractor = mediaTypes[media.type] || mediaTypes.default

  return MediaExtractor(media)
}

module.exports = Message
