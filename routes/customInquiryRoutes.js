const express = require('express');
const router = express.Router();
const { 
  createInquiry, 
  getInquiries, 
  updateInquiryStatus 
} = require('../controllers/customInquiryController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route to submit inquiry (supports reference image and video upload)
router.post('/', upload.fields([
  { name: 'referenceImage', maxCount: 1 },
  { name: 'referenceVideo', maxCount: 1 }
]), createInquiry);

// Admin-only routes to fetch and manage inquiries
router.get('/', protect, authorize('admin'), getInquiries);
router.put('/:id/status', protect, authorize('admin'), updateInquiryStatus);

module.exports = router;
