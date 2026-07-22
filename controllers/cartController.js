const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper to get or create cart
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

// Helper to populate and remove deleted/null products
const populateAndCleanCart = async (cart) => {
  await cart.populate({
    path: 'items.product',
    select: 'name slug price discountPrice images stock sku material'
  });

  const originalLength = cart.items.length;
  cart.items = cart.items.filter(item => item.product !== null);
  if (cart.items.length !== originalLength) {
    await cart.save();
  }
  return cart;
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const cleanedCart = await populateAndCleanCart(cart);

    res.status(200).json({
      status: 'success',
      cart: cleanedCart
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add or update item in cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res, next) => {
  try {
    const { product: productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ status: 'error', message: `Only ${product.stock} items left in stock` });
    }

    const cart = await getOrCreateCart(req.user._id);

    // Check if item is already in cart
    const itemIndex = cart.items.findIndex(item => item.product && item.product.toString() === productId);

    if (itemIndex > -1) {
      // Item exists, update quantity
      cart.items[itemIndex].quantity = Number(quantity);
    } else {
      // Item does not exist, add it
      cart.items.push({ product: productId, quantity: Number(quantity) });
    }

    await cart.save();
    const cleanedCart = await populateAndCleanCart(cart);

    res.status(200).json({
      status: 'success',
      cart: cleanedCart
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/item/:productid
// @access  Private
exports.updateCartItemQuantity = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.productid;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ status: 'error', message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ status: 'error', message: `Only ${product.stock} items left in stock` });
    }

    const cart = await getOrCreateCart(req.user._id);

    const itemIndex = cart.items.findIndex(item => item.product && item.product.toString() === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'Item not found in cart' });
    }

    cart.items[itemIndex].quantity = Number(quantity);
    await cart.save();
    
    const cleanedCart = await populateAndCleanCart(cart);

    res.status(200).json({
      status: 'success',
      cart: cleanedCart
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/item/:productid
// @access  Private
exports.removeFromCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    
    cart.items = cart.items.filter(
      item => item.product && item.product.toString() !== req.params.productid
    );

    await cart.save();
    const cleanedCart = await populateAndCleanCart(cart);

    res.status(200).json({
      status: 'success',
      cart: cleanedCart
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();

    res.status(200).json({
      status: 'success',
      cart
    });
  } catch (err) {
    next(err);
  }
};
