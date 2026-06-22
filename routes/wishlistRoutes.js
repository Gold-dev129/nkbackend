const express = require('express');
const {
  getWishlist,
  toggleWishlistItem
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getWishlist);

router.route('/:productid')
  .post(toggleWishlistItem);

module.exports = router;
