const mongoose = require('mongoose')


const tweeterSchema = mongoose.Schema({
  tweeter_id: {
    type: Number,
    index: true,
    unique: true,
    required: true,
  },
  last_status: [{

    }],
  tweetername: String,
  locale: String,
}, {
  timestamps: true,
})


module.exports = tweeterSchema
