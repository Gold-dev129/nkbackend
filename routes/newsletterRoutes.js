const express = require('express');
const {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getSubscribers,
  sendBroadcast
} = require('../controllers/newsletterController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/subscribe', subscribeNewsletter);
router.post('/unsubscribe', unsubscribeNewsletter);

// Admin-only routes
router.use(protect);
router.use(authorize('admin'));

router.get('/', getSubscribers);
router.post('/broadcast', sendBroadcast);

module.exports = router;
