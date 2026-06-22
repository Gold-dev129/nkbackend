const express = require('express');
const {
  createProductReview,
  getProductReviews,
  getAllReviews,
  approveReview,
  deleteReview
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/product/:productid', getProductReviews);

// Protected routes
router.use(protect);

router.post('/:productid', createProductReview);
router.delete('/:id', deleteReview);

// Admin-only routes
router.get('/', authorize('admin'), getAllReviews);
router.put('/:id/approve', authorize('admin'), approveReview);

module.exports = router;
