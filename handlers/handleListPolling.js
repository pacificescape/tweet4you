const CronJob = require('cron').CronJob
const {
    handleGetTweets
} = require('../handlers')

const checking = async () => {
    bot.telegram.sendMessage('@fkey124', `${counter}`)
    try {
        const posts = await handleGetTweets()
        let newPosts = []

        for (const post of posts) {
            if (post.id == last_id) {
                last_id = posts[0].id
                break
            }
            if (post.id !== last_id) {
                newPosts.push(post)
            }
        }

        if (newPosts.length > 0) {
            for (const post of newPosts) {
                bot.telegram.sendMessage('@fkey124', post.text)
            }
        }

    } catch (err) {
        bot.telegram.sendMessage('@fkey124', err)
    }
}

var job = new CronJob('*/30 * * * * *', checking, null, false, 'America/Los_Angeles', null);

// сделать класс чтобы поллить разные списки
