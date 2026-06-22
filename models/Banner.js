const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title']
  },
  subtitle: {
    type: String
  },
  image: {
    type: String,
    required: [true, 'Please add a banner image URL']
  },
  link: {
    type: String,
    default: '/shop'
  },
  position: {
    type: String,
    enum: ['hero', 'promotional', 'middle'],
    default: 'hero'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Banner', BannerSchema);
