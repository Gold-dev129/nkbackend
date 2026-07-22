const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  orderId: {
    type: String,
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email address']
  },
  orderItems: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      image: { type: String, required: true },
      price: { type: Number, required: true },
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      }
    }
  ],
  shippingAddress: {
    name: { type: String, required: false },
    phone: { type: String, required: false },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: 'Nigeria' },
    zipCode: { type: String }
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Card', 'Bank Transfer', 'Pay on Delivery'],
    default: 'Card'
  },
  paymentResult: {
    id: { type: String },
    status: { type: String },
    reference: { type: String }
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  couponApplied: {
    type: String,
    default: ''
  },
  discountAmount: {
    type: Number,
    required: true,
    default: 0.0
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false
  },
  paidAt: {
    type: Date
  },
  isDelivered: {
    type: Boolean,
    required: true,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  }
}, { timestamps: true });

// Pre-save hook to generate unique Order ID (e.g. NKY-1789)
OrderSchema.pre('save', async function() {
  if (!this.orderId) {
    let unique = false;
    let attempts = 0;
    while (!unique && attempts < 100) {
      const randNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number
      const potentialId = `NKY-${randNum}`;
      const existing = await mongoose.models.Order.findOne({ orderId: potentialId });
      if (!existing) {
        this.orderId = potentialId;
        unique = true;
      }
      attempts++;
    }
  }
});

module.exports = mongoose.model('Order', OrderSchema);
