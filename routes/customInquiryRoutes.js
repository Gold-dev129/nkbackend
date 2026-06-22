const express = require('express');
const router = express.Router();
const { 
  createInquiry, 
  getInquiries, 
  updateInquiryStatus 
} = require('../controllers/customInquiryController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route to submit inquiry (supports single image upload)
router.post('/', upload.single('referenceImage'), createInquiry);

// Admin-only routes to fetch and manage inquiries
router.get('/', protect, authorize('admin'), getInquiries);
router.put('/:id/status', protect, authorize('admin'), updateInquiryStatus);

module.exports = router;
