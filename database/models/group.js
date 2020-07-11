const mongoose = require('mongoose')

const groupSchema = mongoose.Schema({
  group_id: String,
  title: String,
  username: {
    type: String
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
  settings: {
    type: Object
  }
}, {
  timestamps: true
})

module.exports = groupSchema
