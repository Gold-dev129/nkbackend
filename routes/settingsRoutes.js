const express = require('express');
const { getSettings, updateSettings, submitContactForm } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getSettings);
router.post('/contact', submitContactForm);

// Admin-only route
router.put('/', protect, authorize('admin'), upload.single('image'), updateSettings);

module.exports = router;
