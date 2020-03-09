const mongoose = require('mongoose')


const twitterSchema = mongoose.Schema({
  screen_name: String,
  name: String,
  id: {
    type: Number,
    index: true,
    unique: true,
    required: true,
  },
  last_status: [{
    id: Number,
    text: String
  }],
  list: Number,
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  locale: String,
  counter: Number
}, {
  timestamps: true,
})


module.exports = twitterSchema
