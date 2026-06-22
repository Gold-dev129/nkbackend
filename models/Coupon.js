const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please add a coupon code'],
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    required: [true, 'Please specify discount type (percentage or flat)'],
    enum: ['percentage', 'flat']
  },
  discountAmount: {
    type: Number,
    required: [true, 'Please add a discount amount/percentage value']
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an expiration date']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxUses: {
    type: Number,
    default: null // null means unlimited uses
  },
  usedCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Check if coupon is expired or inactive
CouponSchema.methods.isValid = function() {
  const now = new Date();
  const dateValid = now >= this.startDate && now <= this.endDate;
  const activeValid = this.isActive;
  const usesValid = this.maxUses === null || this.usedCount < this.maxUses;
  
  return dateValid && activeValid && usesValid;
};

module.exports = mongoose.model('Coupon', CouponSchema);
