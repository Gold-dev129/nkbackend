const Review = require('../models/Review');
const Product = require('../models/Product');

// Helper to manually trigger rating calculation (failsafe for Mongoose hooks)
const recalculateRating = async (productId) => {
  try {
    const ReviewModel = require('../models/Review');
    await ReviewModel.getAverageRating(productId);
  } catch (err) {
    console.error(`Failsafe rating update failed: ${err.message}`);
  }
};

// @desc    Create a product review
// @route   POST /api/reviews/:productid
// @access  Private
exports.createProductReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.productid;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const alreadyReviewed = await Review.findOne({
      product: productId,
      user: req.user._id
    });

    if (alreadyReviewed) {
      return res.status(400).json({ status: 'error', message: 'Product already reviewed by you' });
    }

    const review = await Review.create({
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
      product: productId,
      isApproved: false // Requires admin moderation
    });

    res.status(201).json({
      status: 'success',
      message: 'Review submitted successfully. It will display after admin approval.',
      review
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get approved reviews for a product
// @route   GET /api/reviews/product/:productid
// @access  Public
exports.getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      product: req.params.productid,
      isApproved: true
    }).sort('-createdAt');

    res.status(200).json({
      status: 'success',
      count: reviews.length,
      reviews
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all reviews (Admin only)
// @route   GET /api/reviews
// @access  Private/Admin
exports.getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('product', 'name slug')
      .populate('user', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      count: reviews.length,
      reviews
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve a review (Admin only)
// @route   PUT /api/reviews/:id/approve
// @access  Private/Admin
exports.approveReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ status: 'error', message: 'Review not found' });
    }

    review.isApproved = true;
    await review.save();
    
    // Explicit failsafe update
    await recalculateRating(review.product);

    res.status(200).json({
      status: 'success',
      message: 'Review approved successfully',
      review
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (Owner or Admin)
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ status: 'error', message: 'Review not found' });
    }

    // Check ownership or admin status
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Not authorized to delete this review' });
    }

    const productId = review.product;
    await review.deleteOne();
    
    // Explicit failsafe update
    await recalculateRating(productId);

    res.status(200).json({
      status: 'success',
      message: 'Review deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
