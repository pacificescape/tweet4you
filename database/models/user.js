const mongoose = require('mongoose')


const user = mongoose.Schema({
  telegram_id: {
    type: Number,
    index: true,
    unique: true,
    required: true,
  },
  groups: [{
    name: String,
    id: Number,
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
  username: String,
  locale: String,
}, {
  timestamps: true,
})


module.exports = user
