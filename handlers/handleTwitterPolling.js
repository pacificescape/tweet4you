const CronJob = require('cron').CronJob
const { user_timeline } = require('../API')

/**
 *
 * handleTwitterPolling - class for checking twitter account
 *
*/

function handleTwitterPolling(bot, twitter_name) {
    this.twitter_name = twitter_name || 'fkey123' // user_id
    this.counter = 0 // MongoDB
    this.last_id = 1232632992259960832 // MongoDB
    this.bot = bot
    this.job = new CronJob('*/60 * * * * *', this.cronPolling, null, false, 'America/Los_Angeles', this);
}

handleTwitterPolling.prototype.cronPolling = async function() {
    console.log('TwitterPolling: ', `${this.counter++}`)
    try {
        const posts = await user_timeline(this.twitter_name, 10)
        let newPosts = []

        for (const post of posts) {
            if (post.id == this.last_id) {
                this.last_id = posts[0].id
                break
            }
            if (post.id !== this.last_id) {
                newPosts.push(post)
            }
        }

        if (newPosts.length > 0) {
            for (const post of newPosts) {
                this.bot.telegram.sendMessage('@fkey124', post.text)
            }
            this.last_id = posts[0].id
        }

    } catch (err) {
        console.log('TwitterPolling error: ', err)
    }
}

module.exports = handleTwitterPolling

// сделать класс чтобы поллить разные списки
