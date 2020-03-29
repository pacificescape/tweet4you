const { EventEmitter } = require('events')
const CronJob = require('cron').CronJob
const { listStatuses } = require('../API/')

/**
 *
 * handleListPolling - class for checking twitter list
 *
*/

function handleListPolling(bot, db) {
    this.list_id = process.env.LIST_ID
    this.counter = 0 // MongoDB
    // this.last_id = 1233924941755621376 // MongoDB
    this.bot = bot
    this.job = new CronJob('*/60 * * * * *', this.cronPolling, null, false, 'America/Los_Angeles', this);
    this.db = db
    this.shouldPost = async (posts, twitters) => {
        if (twitter.last_status.id_str === post.id_str) {
            return null
        }

        twitter.last_status = post

        await twitter.save()

        groups.forEach((group) => {
            id = group.group_id ? group.group_id : group.username
            this.bot.telegram.sendMessage(id, post.text)
        })

        return { post, groups: twitter.groups }
    }
    this.getTwitters = async (posts) => {
        let ids = [...new Set(posts.map((post) => post.user.id_str))]

        let twitters = await Promise.all(ids.map((id) => {
            return this.db.Twitter.findOne({ id })
                .populate('groups')
        }))

        return twitters.filter(e => e)
    }
}

handleListPolling.prototype.cronPolling = async function () {
    console.log('ListPolling: ', `${this.counter++}`)
    try {
        let posts = await listStatuses(this.list_id)
        let twitters = await this.getTwitters(posts)
        let newPosts = []

        posts = posts.reverse()

        // for (const twitter of twitters) {
        //     for (const post of posts) {
        //         if(post.user.id_str !== twitter.id) {
        //             if(post.id === twitter.last_status.id) {
        //                 break
        //             }
        //             newPosts.push(post)
        //         }
        //         twitter.last_status = newPosts.reverse()[0]
        //         twitter.save()
        //         break
        //     }
        // }

        twitters.map((twitter) => {
            // let last_status_index = posts.reduce((a, p, i) => p.id === twitter.last_status.id ? i : posts.length)
            let last_status = twitter.last_status

            for(const post of posts) {
                if(post.user.id_str === twitter.id) {
                    if(Date.parse(post.created_at) > Date.parse(last_status.created_at)) {
                        twitter.last_status = post
                        newPosts.push({post, groups: twitter.groups.map(g => g.group_id ? g.group_id : g.username) })
                    }
                }
            }
            twitter.save()
        })

        if(newPosts.length > 0) {
            newPosts.map(({ post, groups = []}) => {
                groups.forEach((group) => {
                    this.bot.telegram.sendMessage(group, post.text)
                })
            })
        }

        // Promise.all(newPosts)
        //     .then((statuses) => {
        //         newPosts = statuses.filter(e => e)
        //     })
        //     .then(() => {
                // newPosts.map(({ post, groups }) => {
                //     groups.forEach((group) => {
                //         id = group.group_id ? group.group_id : group.username
                //         this.bot.telegram.sendMessage(id, post.text)
                //     })
                // })
        //     })

        // if (newPosts.length > 0) {
        //     for (const post of newPosts) {
        //         this.bot.telegram.sendMessage('@fkey124', post.text)
        //     }
        //     this.last_id = posts[0].id
        // }

    } catch (err) {
        console.log('List error', err)
    }
}

module.exports = handleListPolling
