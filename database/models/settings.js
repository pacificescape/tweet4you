const mongoose = require('mongoose')

const settingsSchema = mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    index: true
  },
  twitter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Twitter',
    index: true
  },
  link: {
    type: Boolean,
    default: true
  },
  name: {
    type: Boolean,
    default: true
  },
  retweets: {
    type: Boolean,
    default: true
  },
  from: {
    type: Boolean,
    default: true
  },
  replies: {
    type: Boolean,
    default: true
  },
  images: {
    type: Boolean,
    default: true
  },
  videos: {
    type: Boolean,
    default: true
  },
  onlyText: {
    type: Boolean,
    default: false
  },
  onlyMedia: {
    type: Boolean,
    default: false
  },
  clearMedia: {
    type: Boolean,
    default: false
  },
  banMatch: [{
    type: String
  }],
  allowMatch: [{
    type: String
  }],
  enabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

module.exports = settingsSchema
