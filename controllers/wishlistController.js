const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// Helper to get or create wishlist
const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }
  return wishlist;
};

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res, next) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user._id);
    await wishlist.populate({
      path: 'products',
      select: 'name slug price discountPrice images stock'
    });

    res.status(200).json({
      status: 'success',
      wishlist
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle wishlist item (add if absent, remove if present)
// @route   POST /api/wishlist/:productid
// @access  Private
exports.toggleWishlistItem = async (req, res, next) => {
  try {
    const productId = req.params.productid;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    const wishlist = await getOrCreateWishlist(req.user._id);

    const isAdded = wishlist.products.includes(productId);

    if (isAdded) {
      // Remove item
      wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
    } else {
      // Add item
      wishlist.products.push(productId);
    }

    await wishlist.save();
    await wishlist.populate({
      path: 'products',
      select: 'name slug price discountPrice images stock'
    });

    res.status(200).json({
      status: 'success',
      message: isAdded ? 'Product removed from wishlist' : 'Product added to wishlist',
      wishlist
    });
  } catch (err) {
    next(err);
  }
};
