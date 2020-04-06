const mongoose = require('mongoose')

const { Schema } = mongoose

const listSchema = Schema({
  list_id: {
    type: Number,
    unique: true,
    required: true
  },
  last_status: {
    type: Number,
    required: false
  },
  statuses: [{
    id: {
      type: String,
      required: true
    }
  }],
  twitters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Twitter'
  }],
  last_update: {
    type: Date,
    default: () => Date.now()
  }
}, {
  timestamps: true
})

module.exports = listSchema
