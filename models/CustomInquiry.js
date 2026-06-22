const mongoose = require('mongoose');

const CustomInquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please add a phone number']
  },
  material: {
    type: String,
    required: [true, 'Please select a material choice'],
    enum: ['18K Yellow Gold', '18K White Gold', '24K Solid Gold', 'Platinum', 'Sterling Silver', 'Other']
  },
  diamondSpecs: {
    type: String,
    required: [true, 'Please specify diamond cut/clarity'],
    enum: ['VVS1/VVS2 Brilliant Cut', 'VS1/VS2 Fine Quality', 'SI1/SI2 Commercial', 'No Diamonds / Gemstones Only', 'Other']
  },
  description: {
    type: String,
    required: [true, 'Please provide design instructions']
  },
  referenceImage: {
    type: String,
    default: ''
  },
  referenceVideo: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'responded'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('CustomInquiry', CustomInquirySchema);
