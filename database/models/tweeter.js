const mongoose = require('mongoose')


const tweeterSchema = mongoose.Schema({
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


module.exports = tweeterSchema
