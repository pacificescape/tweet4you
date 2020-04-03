const Markup = require('telegraf/markup')

const handleSendMessage = async (bot, message, groups, settings) => {
    let text = message.full_text
    let quoted_text = ''
    let retweeted = message.retweeted_status
    let quoted = message.quoted_status
    let medias
    let link //= `https://twitter.com/${message.user.screen_name}` //.replace('\\', '')
    let method = 'sendMessage'//(group, post.text)
    let extended_entities = message.is_quote_status ? message.quoted_status.extended_entities : message.extended_entities
    let entities = message.entities
    let retweeted_urls = {
        expanded_url: '',
        display_url: ''
    }

// ['text_link', ({ url }) => tag('a', { href: url })]

//     "entities":
// {
//     "hashtags":[],
//     "urls":[], //expanded_url
//     "user_mentions":[],
//     "media":[],
//     "symbols":[]
//     "polls":[]
// }

    let hashtags = entities.hashtags.map(hash => `#${hash.text}`).join(' ')
    let urls = entities.urls //.map(url => `${url.expanded_url}`).join(' ')



    // TEXT ONLY || ADD POLLINGS

    if (retweeted) {
        if (retweeted.entities.urls[0]) {
            // <a href="${retweeted_urls.expanded_url}">${retweeted_urls.display_url}</a>
            let url = retweeted.entities.urls[0]
            retweeted_urls = {
                expanded_url: url.expanded_url,
                display_url: url.display_url
            }
        }
        let tweetLink = `<a href="https://twitter.com/${retweeted.user.screen_name}/status/${retweeted.id_str}">${retweeted.user.name}</a>`

        text = `#retweet ${message.user.name} — from ${tweetLink}\n\n` + retweeted.full_text.replace(link, '')
    }

    if(quoted) {
        link = message.quoted_status_permalink.url
        if (quoted.entities.urls[0]) {
            // <a href="${retweeted_urls.expanded_url}">${retweeted_urls.display_url}</a>
            let url = quoted.entities.urls[0]
            retweeted_urls = {
                expanded_url: url.expanded_url,
                display_url: url.display_url
            }
        }
        text = text.replace(link, '') + '\n\n' + `<b>${quoted.user.name}</b>:\n` + `<i>${quoted.full_text}</i>`
    }

    if (extended_entities) {
        medias = extended_entities.media.map((media, i) => {
            let type = media.type
            link = media.url
            switch (type) {
                case 'animated_gif':
                    type = 'animation'
                case 'video':
                    media.video_info.variants.find((v) => {
                        if(v.content_type === "video/mp4") {
                            return media = v.url
                            // return true
                        }
                    })
                    break
                case 'photo':
                    media = media.media_url_https
                    break
                default:
                    console.log('extended default return')
                    return extended_entities.media[0]
            }
            text = text.replace(link, '')
            return {
                type,
                media,
                caption: i === 0 ? media : ''
            }
        })
        medias.filter(e => e)
    }

    if(!medias) {
        groups.forEach(group => {
            let options = settings[group][message.user.id_str] || {}
            if(options.link) {
                text = text + `\n\n<i>https://twitter.com/${message.user.screen_name}/status/${message.id_str}</i>`
            }

            if(options.name) {
                text = `Twitter <b>${message.user.name}</b>:\n\n` + text
            }

            bot.telegram[method](group, text, {
                parse_mode: 'HTML',
                disable_web_page_preview: link && !message.entities.urls[0]
            })
        })
        return
    }

    // >=1 MEDIA

    if(medias.length > 1) {
        method = 'sendMediaGroup' //(chatId, media, [extra])
    } else {
        medias = medias[0]

        switch (medias.type) {
            case 'photo':
                method = 'sendPhoto'//(chatId, photo, [extra])
                break
            case 'animation':
                method = 'sendAnimation'//(chatId, animation, [extra])
                break
            case 'video':
                method = 'sendVideo'//(chatId, question, options, [extra])
                break
        }
        medias = medias.media
    }

    // if(!link) {
    //     link = `https://twitter.com/${message.user.screen_name}`
    // }
    // let group = groups.shift()

    groups.forEach((group, i) => {
        let options = settings[group][message.user.id_str] || {}
        link = options.link ? link : false // fuu
        if(options.name) {
            text = `Twitter <b>${message.user.name}</b>:\n` + text
        }

        setTimeout(() => {
            medias[0].caption = `${text}${link && !retweeted ? `\n\n<a href="${link}">link</a>` : ''}`
            medias[0].parse_mode = 'HTML'

            bot.telegram[method](group, medias, {
                caption: `${text}\n\nTweet <a href="${link}">${message.user.name}</a>`,
                parse_mode: 'HTML',
                disable_web_page_preview: !link
            })
        }, i*1000)
    });

    // groups.map((group) => {
    //     method(group, )
    // })

}

module.exports = handleSendMessage


// вычесть из ответа quoted_status_permalink.url
