const Markup = require('telegraf/markup')

const handleSendMessage = async (bot, message, groups) => {
    let text = message.text
    let medias
    let link //.replace('\\', '')
    let method = 'sendMessage'//(group, post.text)
    let extended_entities = message.extended_entities || undefined
    let entities = message.entities

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
    let urls = entities.urls.map(url => `${url.expanded_url}`).join(' ')

    if (extended_entities) {
        medias = extended_entities.media.map((media) => {
            let type = media.type
            switch (type) {
                case 'animated_gif':
                    type = 'animation'
                case 'video':
                    media = media.variants[1].url.replace('\\', '')
                    break
                case 'photo':
                    media = media.media_url_https.replace('\\', '')
                    break
                default:
                    console.log('extended default return')
                    return extended_entities.media[0]
            }
            text = text.replace(media.url, '')
            return {
                type,
                media,
                caption: media.url
            }
        })
        medias.filter(e => e)
    }

    if(!medias) {
        groups.forEach(group => {
            bot.telegram[method](group, `${text} \n ${hashtags}`, {
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });
        return
    }

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
                method = 'sendPoll'//(chatId, question, options, [extra])
                break
        }

        medias = medias.media
    }

    // let group = groups.shift()
    groups.forEach(group => {
        bot.telegram[method](group, medias, {
            caption: `${text} \n ${hashtags}`,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        })
    });

    // groups.map((group) => {
    //     method(group, )
    // })

}

module.exports = handleSendMessage
