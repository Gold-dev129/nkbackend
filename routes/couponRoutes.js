const express = require('express');
const router = express.Router();
const { 
  validateCoupon, 
  getCoupons, 
  createCoupon, 
  deleteCoupon 
} = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/auth');

// Public route to validate a coupon
router.post('/validate', validateCoupon);

// Admin-only CRUD routes for coupons
router.get('/', protect, authorize('admin'), getCoupons);
router.post('/', protect, authorize('admin'), createCoupon);
router.delete('/:id', protect, authorize('admin'), deleteCoupon);

module.exports = router;
