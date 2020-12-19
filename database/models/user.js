const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
  telegram_id: {
    type: Number,
    index: true,
    unique: true,
    required: true
  },
  username: String,
  first_name: String,
  last_name: String,
  twitters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Twitter',
    unique: true,
    index: true
  }],
  create: {
    type: Boolean,
    default: false
  },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  tree: Object,
  locale: {
    type: String,
    default: 'ru'
  }
}, {
  timestamps: true
})

module.exports = userSchema

// settings: [{
//   id: Number,
//   retweets: {
//     type: Boolean,
//     default: true
//   },
//   replies: {
//     type: Boolean,
//     default: true
//   },
//   tweets: {
//     type: Boolean,
//     default: true
//   },
//   images: {
//     type: Boolean,
//     default: true
//   },
//   links: {
//     type: Boolean,
//     default: true
//   },
//   privateMesages: {
//     type: Boolean,
//     default: false
//   }
// }],
