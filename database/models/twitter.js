const mongoose = require('mongoose')


const twitterSchema = mongoose.Schema({
  screen_name: String,
  name: String,
  id: {
    type: Number,
    required: true,
    unique: true
  },
  last_status: {
    type: Object
  },
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
