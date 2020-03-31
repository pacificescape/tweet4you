const mongoose = require('mongoose')

const groupSchema = mongoose.Schema({
  group_id: Number,
  title: String,
  username: {
    type: String,
    // index: true,
    unique: true,
    required: true
  },
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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Twitter'
  }],
  settings: [{
    twitter_id: String,
    link: { type: Boolean, default: true },
    retweets: { type: Boolean, default: true },
    replies: { type: Boolean, default: true },
    images: { type: Boolean, default: true },
    videos: { type: Boolean, default: true },
    onlyText: { type: Boolean, default: false },
    onlyMedia: { type: Boolean, default: false }
  }]
}, {
  timestamps: true
})

module.exports = groupSchema


// create: {
//   type: Boolean,
//   default: false
// }
