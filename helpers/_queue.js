const SENDER_INTERVAL = 3500
const handleSendMessage = require('./Message')

function createQueue () {
  return new Queue()
}

class Queue {
  constructor () {
    this.collection = {}
    // this._i = 0
    this.renderer()
  }

  renderer () {
    setInterval(() => {
      this.sender()
    }, SENDER_INTERVAL)
  }

  sender () {
    let n = 0
    for (const key in this.collection) {
      n += 500
      handleSendMessage(this.collection[key][0], n)
      this.dequeue(key)
    }
  }

  enqueue (tweet) {
    tweet.twitter.groups.forEach((group) => {
      const message = {
        twitter: tweet.twitter,
        post: tweet.post,
        settings: tweet.settings
      }

      if (!this.collection[group]) {
        this.collection[group] = []
      }

      this.collection[group].push(message)
    })
  }

  dequeue (group) {
    if (!this.collection[group]) {
      return
    }
    this.collection[group].shift()

    if (this.collection[group].length === 0) {
      delete this.collection[group]
    }
  }
}

module.exports = createQueue
