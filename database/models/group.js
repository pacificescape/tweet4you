const mongoose = require('mongoose')

const groupSchema = mongoose.Schema({
  group_id: {
    type: Number,
    index: true,
    unique: true,
    required: true
  },
  title: String,
  username: String,
  invite_link: String,
  stats: {
    tweetsCount: {
      type: Number,
      default: 0
    },
    textTotal: {
      type: Number,
      default: 0
    }
  },
  twitters: [{
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
  }]
}, {
  timestamps: true
})

module.exports = groupSchema
