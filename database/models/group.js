const mongoose = require('mongoose')

const groupSchema = mongoose.Schema({
  group_id: Number,
  title: String,
  username: {
    type: String,
    index: true,
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
}, {
  timestamps: true
})

module.exports = groupSchema

// settings: {
//   retweets: Boolean,
//   replies: Boolean,
//   tweets: Boolean,
//   images: Boolean
// },
// create: {
//   type: Boolean,
//   default: false
// }
