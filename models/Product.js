const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    lowercase: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  shortDescription: {
    type: String,
    required: [true, 'Please add a short description']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please specify a category']
  },
  images: {
    type: [String],
    required: [true, 'Please upload at least one image']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price']
  },
  discountPrice: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    required: [true, 'Please add a stock count'],
    min: 0,
    default: 0
  },
  sku: {
    type: String,
    required: [true, 'Please add a SKU'],
    unique: true
  },
  material: {
    type: String,
    required: [true, 'Please add a material (e.g., Gold, Silver)'],
    trim: true
  },
  weight: {
    type: String,
    trim: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  bestSeller: {
    type: Boolean,
    default: false
  },
  newArrival: {
    type: Boolean,
    default: false
  },
  averageRating: {
    type: Number,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating must be at most 5'],
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  video: {
    type: String,
    default: ''
  },
  isCustom: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Create product slug before saving
ProductSchema.pre('save', function(next) {
  if (this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  if (typeof next === 'function') {
    next();
  }
});

module.exports = mongoose.model('Product', ProductSchema);
