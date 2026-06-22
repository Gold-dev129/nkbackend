const Coupon = require('../models/Coupon');

// @desc    Validate a promo code for a given subtotal
// @route   POST /api/coupons/validate
// @access  Public
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;

    if (!code || subtotal === undefined) {
      return res.status(400).json({ status: 'error', message: 'Please provide code and cart subtotal' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ status: 'error', message: 'Invalid coupon code' });
    }

    if (!coupon.isValid()) {
      return res.status(400).json({ status: 'error', message: 'Coupon has expired, is inactive, or has reached its usage limit' });
    }

    // Calculate discount amount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.discountAmount) / 100;
    } else {
      // Flat discount
      discount = Math.min(coupon.discountAmount, subtotal); // Cannot discount more than subtotal
    }

    res.status(200).json({
      status: 'success',
      message: 'Coupon code applied successfully!',
      code: coupon.code,
      discountType: coupon.discountType,
      discountAmount: coupon.discountAmount,
      discountCalculated: discount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: coupons.length,
      coupons
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Admin
exports.createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountAmount, endDate, maxUses } = req.body;

    if (!code || !discountType || !discountAmount || !endDate) {
      return res.status(400).json({ status: 'error', message: 'Please provide code, type, amount, and expiry date' });
    }

    // Check if code exists
    const codeExists = await Coupon.findOne({ code: code.toUpperCase() });
    if (codeExists) {
      return res.status(400).json({ status: 'error', message: 'A coupon with this code already exists' });
    }

    const coupon = await Coupon.create({
      code,
      discountType,
      discountAmount,
      endDate: new Date(endDate),
      maxUses: maxUses || null
    });

    res.status(201).json({
      status: 'success',
      message: `Coupon ${coupon.code} created successfully`,
      coupon
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({ status: 'error', message: 'Coupon not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Coupon deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
