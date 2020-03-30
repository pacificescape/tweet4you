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

    getTwitters = async (posts) => {
        let ids = [...new Set(posts.map((post) => post.user.id_str))]

        let twitters = await Promise.all(ids.map((id) => {
            return this.db.Twitter.findOne({ id })
                .populate('groups')
        }))

        return twitters.filter(e => e)
    }

    cronPolling = async function () {
        console.log('ListPolling: ', `${this.counter++}`)
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
                newPosts.map(({ post, groups = [] }) => {
                    handleSendMessage(this.bot, post, groups)
                    // groups.forEach((group) => {
                    //     this.bot.telegram.sendMessage(group, post.text)
                    // })
                })
            }

        } catch (err) {
            console.log('List error', err)
        }
    }
}

module.exports = handleListPolling
