const { EventEmitter } = require('events')
const CronJob = require('cron').CronJob

const { listStatuses } = require('../API/')

/**
 *
 * handleListPolling - class for checking twitter list
 *
*/

function handleListPolling(bot, list_id) {
    this.list_id = process.env.LIST_ID
    this.counter = 0 // MongoDB
    this.last_id = 1233924941755621376 // MongoDB
    this.bot = bot
    this.job = new CronJob('*/60 * * * * *', this.cronPolling, null, false, 'America/Los_Angeles', this);
}

handleListPolling.prototype.cronPolling = async function() {
    console.log('ListPolling: ', `${this.counter++}`)
    try {
        const posts = await listStatuses(this.list_id)
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
        console.log('List error', err)
    }
}

module.exports = handleListPolling
