// const { EventEmitter } = require('events')
const CronJob = require('cron').CronJob
const LRU = require('lru-cache')
const { listStatuses } = require('../API')
const handleSendMessage = require('./handleSendMessage')
const getListQuery = require('./getListQuery')
const frequency = process.env.FREQUENCY || '*/60 * * * * *'

const lists = new LRU({ maxAge: 1000 * 60 * 5 })
/**
 *
 * handleListPolling - class for checking twitter list
 *
*/

class ListPolling {
  constructor (bot, db) {
    this.bot = bot
    this.db = db
    this.job = new CronJob(frequency, this.cronPolling, null, false, 'America/Los_Angeles', this)
    this.counter = 0
  }

  async getTwitters (posts) {
    const ids = [...new Set(posts.map((post) => post.user.id_str))]

    const twitters = await Promise.all(ids.map((id) => {
      return this.db.Twitter.findOne({ id })
        .populate('groups')
    }))

    return twitters.filter(e => e)
  }

  async cronPolling () {
    let ids = lists.get('list_ids')

    if (!ids) {
      ids = await getListQuery()
      lists.set('list_ids', ids)
    }

    this.list_id = ids[this.counter % ids.length]

    console.log('ListPolling: ', this.list_id, ` ${this.counter++}`, new Date().toLocaleTimeString('it-IT'))
    try {
      let posts = await listStatuses(this.list_id)
      const twitters = await this.getTwitters(posts)
      const newPosts = []

      posts = posts.reverse()

      twitters.map((twitter) => {
        const lastStatus = twitter.last_status

        for (const post of posts) {
          if (post.user.id_str === twitter.id) {
            if (Date.parse(post.created_at) > Date.parse(lastStatus.created_at)) {
              twitter.last_status = post
              newPosts.push({
                twitter,
                post,
                groups: twitter.groups.map(g => g.username), // number string???
                settings: twitter.groups.reduce((a, g) => { return { ...a, [g.group_id ? g.group_id : g.username]: g.settings } }, {})
              })
            }
          }
        }
      })

      if (newPosts.length > 0) {
        newPosts.map((newPost, i) => {
          setTimeout(() => handleSendMessage(this.bot, newPost), i * 2000)
        })
      }
    } catch (err) {
      console.log('List error', err)
    }
  }
}

module.exports = ListPolling
