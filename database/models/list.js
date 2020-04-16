const mongoose = require('mongoose')

const { Schema } = mongoose

const listSchema = Schema({
  list_id: {
    type: String,
    unique: true,
    required: true
  },
  full_name: String,
  name: String,
  member_count: Number,
  twitters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Twitter'
  }],
  full: {
    type: Boolean,
    default: false
  },
  last_update: {
    type: Date,
    default: () => Date.now()
  }
}, {
  timestamps: true
})

module.exports = listSchema
