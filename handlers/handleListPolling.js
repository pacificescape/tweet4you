const { EventEmitter } = require('events')
const CronJob = require('cron').CronJob
const { listStatuses } = require('../API/')
const handleSendMessage = require('./handleSendMessage')

/**
 *
 * handleListPolling - class for checking twitter list
 *
*/

class handleListPolling {
    constructor(bot, db) {
        this.list_id = process.env.LIST_ID
        this.bot = bot
        this.db = db
        this.job = new CronJob('*/30 * * * * *', this.cronPolling, null, false, 'America/Los_Angeles', this);
        this.counter = 0
    }

    async getTwitters(posts) {
        let ids = [...new Set(posts.map((post) => post.user.id_str))]

        let twitters = await Promise.all(ids.map((id) => {
            return this.db.Twitter.findOne({ id })
                .populate('groups')
        }))

        return twitters.filter(e => e)
    }

    async cronPolling() {
        console.log('ListPolling: ', `${this.counter++}`, new Date().toLocaleTimeString('it-IT'))
        try {
            let posts = await listStatuses(this.list_id)
            let twitters = await this.getTwitters(posts)
            let newPosts = []

            posts = posts.reverse()

            twitters.map((twitter) => {
                let last_status = twitter.last_status

                for (const post of posts) {
                    if (post.user.id_str === twitter.id) {
                        if (Date.parse(post.created_at) > Date.parse(last_status.created_at)) {
                            twitter.last_status = post
                            newPosts.push({ post, groups: twitter.groups.map(g => g.group_id ? g.group_id : g.username) })
                        }
                    }
                }
                twitter.save()
            })

            if (newPosts.length > 0) {
                newPosts.map(({ post, groups = [] }, i) => {
                    setTimeout(() => handleSendMessage(this.bot, post, groups), i*1000)
                })
            }

        } catch (err) {
            console.log('List error', err)
        }
    }
}

module.exports = handleListPolling
