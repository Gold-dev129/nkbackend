const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { sendOrderConfirmationEmail } = require('../utils/email');

// Helper to find order by Mongo ObjectId or custom orderId (NKY-XXXX)
const findOrder = async (id, populateUser = false) => {
  let query;
  if (id && id.startsWith('NKY-')) {
    query = Order.findOne({ orderId: id });
  } else if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
    query = Order.findById(id);
  } else {
    query = Order.findOne({ orderId: id });
  }
  if (populateUser) {
    query = query.populate('user', 'name email');
  }
  return await query;
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.addOrderItems = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
      email,
      couponCode
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No order items' });
    }

    // Verify stock and update inventory
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ status: 'error', message: `Product ${item.name} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          status: 'error',
          message: `Insufficient stock for ${product.name}. Only ${product.stock} items left.`
        });
      }
    }

    // Determine target email and user link
    const orderEmail = req.user ? req.user.email : email;
    if (!orderEmail) {
      return res.status(400).json({ status: 'error', message: 'An email address is required to place an order.' });
    }

    const orderUser = req.user ? req.user._id : null;

    let discount = 0;
    let appliedCode = '';

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (!coupon || !coupon.isValid()) {
        return res.status(400).json({ status: 'error', message: 'Applied coupon is invalid or has expired' });
      }
      
      if (coupon.discountType === 'percentage') {
        discount = (itemsPrice * coupon.discountAmount) / 100;
      } else {
        discount = Math.min(coupon.discountAmount, itemsPrice);
      }
      appliedCode = coupon.code;
      
      // Update coupon usage count
      coupon.usedCount += 1;
      await coupon.save();
    }

    const finalTotalPrice = itemsPrice + shippingPrice - discount;

    // Create order in database
    const order = new Order({
      user: orderUser,
      email: orderEmail.toLowerCase(),
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice: finalTotalPrice,
      couponApplied: appliedCode,
      discountAmount: discount
    });

    const createdOrder = await order.save();

    // Deduct stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // Send confirmation email asynchronously (non-blocking)
    const customerName = req.user ? req.user.name : (shippingAddress.name || 'Valued Client');
    sendOrderConfirmationEmail(orderEmail.toLowerCase(), customerName, createdOrder)
      .catch(emailErr => {
        console.error(`Order confirmation email failed: ${emailErr.message}`);
      });

    res.status(201).json({
      status: 'success',
      order: createdOrder
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    // Auto-link any guest orders matching this user's email dynamically on request
    if (req.user && req.user.email) {
      await Order.updateMany(
        { email: req.user.email.toLowerCase(), user: null },
        { user: req.user._id }
      );
    }

    const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
    res.status(200).json({
      status: 'success',
      count: orders.length,
      orders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await findOrder(req.params.id, true);

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    // Auth validations
    if (order.user) {
      // If order has an owner user account, only let the owner or admin read it
      if (!req.user || (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin')) {
        return res.status(403).json({ status: 'error', message: 'Not authorized to view this order' });
      }
    } else {
      // Guest order: auto-link if a matching logged-in user requests it, else allow read access
      if (req.user && req.user.email.toLowerCase() === order.email.toLowerCase()) {
        order.user = req.user._id;
        await order.save();
      }
    }

    res.status(200).json({
      status: 'success',
      order
    });
  } catch (err) {
    next(err);
  }
};

exports.updateOrderToPaid = async (req, res, next) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ status: 'error', message: 'Paystack transaction reference is required' });
    }

    const order = await findOrder(req.params.id);

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      // Mock mode for local testing if no Paystack key is set in .env
      console.warn('PAYSTACK_SECRET_KEY is not defined in env. Processing in MOCK mode.');
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: reference,
        status: 'success',
        reference: reference
      };
      const updatedOrder = await order.save();
      return res.status(200).json({
        status: 'success',
        order: updatedOrder,
        mock: true
      });
    }

    // Call Paystack Transaction Verification Endpoint
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json'
      }
    });

    const body = await response.json();

    if (!body.status || body.data.status !== 'success') {
      return res.status(400).json({ status: 'error', message: 'Paystack transaction verification failed' });
    }

    // Verify amount matches (Paystack amount is in kobo, order.totalPrice in Naira)
    const expectedAmountKobo = order.totalPrice * 100;
    if (body.data.amount < expectedAmountKobo) {
      return res.status(400).json({
        status: 'error',
        message: `Payment amount mismatch. Expected: NGN ${order.totalPrice}, Received: NGN ${body.data.amount / 100}`
      });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: body.data.id.toString(),
      status: body.data.status,
      reference: reference,
      email: body.data.customer.email
    };

    const updatedOrder = await order.save();

    res.status(200).json({
      status: 'success',
      order: updatedOrder
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Paystack public key configuration
// @route   GET /api/orders/config/paystack
// @access  Private
exports.getPaystackPublicKey = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      publicKey: process.env.PAYSTACK_PUBLIC_KEY || ''
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res, next) => {
  try {
    // Migration: ensure all legacy orders have an orderId
    const withoutId = await Order.find({ orderId: { $exists: false } });
    if (withoutId.length > 0) {
      for (const order of withoutId) {
        let unique = false;
        let attempts = 0;
        while (!unique && attempts < 100) {
          const randNum = Math.floor(1000 + Math.random() * 9000);
          const potentialId = `NKY-${randNum}`;
          const existing = await Order.findOne({ orderId: potentialId });
          if (!existing) {
            order.orderId = potentialId;
            await order.save();
            unique = true;
          }
          attempts++;
        }
      }
    }

    const orders = await Order.find()
      .populate('user', 'id name email')
      .sort('-createdAt');
      
    res.status(200).json({
      status: 'success',
      count: orders.length,
      orders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await findOrder(req.params.id);

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    if (!['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid order status' });
    }

    order.status = status;

    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();

    res.status(200).json({
      status: 'success',
      order: updatedOrder
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel / Delete order (Admin only)
// @route   DELETE /api/orders/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await findOrder(req.params.id);

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    // Revert stock changes if order is cancelled
    if (order.status !== 'Cancelled') {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    await order.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Order deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
