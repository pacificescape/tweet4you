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
  screen_name: String,
  locale: String,
}, {
  timestamps: true,
})


module.exports = twitterSchema
