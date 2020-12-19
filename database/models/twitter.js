const mongoose = require('mongoose')

const twitterSchema = mongoose.Schema({
  screen_name: String,
  name: String,
  id: {
    type: String,
    required: true,
    unique: true,
    sparse: true
  },
  last_status: {
    type: Object
  },
  list: String,
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    unique: true,
    sparse: true
  }],
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  posts: {
    type: Object,
    default: {}
  },
  locale: String,
  counter: Number
}, {
  timestamps: true
})

module.exports = twitterSchema
