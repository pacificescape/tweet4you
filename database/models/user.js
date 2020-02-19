const mongoose = require('mongoose')

const user = mongoose.Schema({
  telegram_id: {
    type: Number,
    index: true,
    unique: true,
    required: true,
  },
  tweeters: [{
    screen_name: String,
    name: String, // tweeter name
    id: {
      type: Number,
      index: true,
      unique: true,
      required: true,
    },
    settings: {
      retweets: Boolean,
      replies: Boolean,
      tweets: Boolean,
      images: Boolean
    },
    create: {
      type: Boolean,
      default: false
    }
  }],
  username: String, //tg
  locale: String,
}, {
  timestamps: true,
})

module.exports = user
