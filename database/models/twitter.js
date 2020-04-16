const mongoose = require('mongoose')

const twitterSchema = mongoose.Schema({
  screen_name: String,
  name: String,
  id: {
    type: String,
    required: true,
    unique: true
  },
  last_status: {
    type: Object
  },
  list: String,
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  posts: {
    type: Object
  },
  locale: String,
  counter: Number
}, {
  timestamps: true
})

module.exports = twitterSchema
