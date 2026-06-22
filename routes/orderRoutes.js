const express = require('express');
const {
  addOrderItems,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  getPaystackPublicKey,
  getOrders,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/orderController');
const { protect, authorize, optionalProtect } = require('../middleware/auth');

const router = express.Router();

// Protected customer routes
router.get('/myorders', protect, getMyOrders);

// Public/Optional/Parametrizied routes
router.get('/config/paystack', getPaystackPublicKey);
router.get('/:id', optionalProtect, getOrderById);
router.put('/:id/pay', optionalProtect, updateOrderToPaid);
router.post('/', optionalProtect, addOrderItems);

// Admin-only routes
router.get('/', protect, authorize('admin'), getOrders);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);
router.delete('/:id', protect, authorize('admin'), deleteOrder);

module.exports = router;
