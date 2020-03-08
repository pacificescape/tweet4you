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
  speed: Number,
  prime: {
    type: Boolean,
    default: false
  },
  primeEx: Date,
  onlyOwner: {
    type: Boolean,
    default: false
  },
  users: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    owner: Boolean
  }],
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
    twitter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Twitter'
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
}, {
  timestamps: true
})

module.exports = groupSchema
