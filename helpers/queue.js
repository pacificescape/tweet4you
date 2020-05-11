const SENDER_INTERVAL = 3000
const handleSendMessage = require('../handlers/handleSendMessage')

class Queue {
  constructor() {
    this.collection = {}
    // this._i = 0
    this.renderer()
  }

  renderer = () => {
    setInterval(() => {
      // this._i += 1
      // console.log(this._i, Object.keys(this.collection))
      this.sender()
    }, SENDER_INTERVAL)
  }

  sender () {
    for (let key in this.collection) {
      handleSendMessage(this.collection[key][0])
      this.dequeue(key)
    }
  }

  enqueue (tweet) {
    tweet.groups.forEach((group) => {
      let message = {
        groups: [group],
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

module.exports = Queue
