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
  last_status: {
    type: Object
  },
  list: Number,
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true
  }],
  locale: String,
  counter: Number
}, {
  timestamps: true,
})


module.exports = twitterSchema
