const CronJob = require('cron').CronJob
const { user_timeline: userTimeline } = require('../API')

/**
 *
 * handleTwitterPolling - class for checking twitter account
 *
 *
*/

function handleTwitterPolling (bot, db, twitterName) {
  db.Twitter.findOne({ screen_name: twitterName })
    .then((twitter) => {
      if (!twitter) return

      this.twitter = twitter
      this.screen_name = twitter.screen_name || 'fkey123' // user_id
      this.counter = twitter.counter // MongoDB
      // this.last_id = twitter.last_status.last_id
      this.bot = bot
      this.job = new CronJob('*/60 * * * * *', this.cronPolling, null, false, 'America/Los_Angeles', this)
      this.save = handleTwitterPolling.prototype.save.bind(this)
    })
    .catch((error) => console.log(error))
}

handleTwitterPolling.prototype.cronPolling = async function () {
  try {
    const posts = await userTimeline(this.twitter.screen_name, 10)
    const newPosts = []

    for (const post of posts) {
      if (post.id === this.twitter.last_status.id) {
        // this.twitter.last_status.id = posts.id
        break
      }
      if (post.id !== this.twitter.last_id) {
        newPosts.push(post)
      }
    }

    // if (newPosts.length > 0) {
    //     for (const post of newPosts) {
    //         this.bot.telegram.sendMessage('@fkey124', post.text)
    //     }
    //     this.twitter.last_id = posts[0].id
    // }

    newPosts.forEach((post) => {
      this.bot.telegram.sendMessage('@fkey124', post.text)
    })

    this.twitter.last_id = posts[0].id

    console.log('TwitterPolling: ', `${this.twitter.counter++}`)
    this.save(this.twitter)
      .then((object) => console.log(object))
  } catch (err) {
    console.log('TwitterPolling error: ', err)
  }
}

handleTwitterPolling.prototype.save = async (twitter) => {
  await twitter.save() // вызов без аргументов
}

module.exports = handleTwitterPolling

// сделать класс чтобы поллить разные списки
