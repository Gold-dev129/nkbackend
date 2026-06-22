const CustomInquiry = require('../models/CustomInquiry');
const { uploadSingleImage } = require('../utils/cloudinary');

// @desc    Submit a custom bespoke jewelry inquiry
// @route   POST /api/custom-inquiries
// @access  Public
exports.createInquiry = async (req, res, next) => {
  try {
    const { name, email, phoneNumber, material, diamondSpecs, description } = req.body;

    let referenceImage = '';
    
    // If an image was uploaded, upload it to Cloudinary
    if (req.file) {
      const uploadResult = await uploadSingleImage(req.file.buffer, 'custom_inquiries');
      referenceImage = uploadResult.secure_url;
    }

    const inquiry = await CustomInquiry.create({
      name,
      email,
      phoneNumber,
      material,
      diamondSpecs,
      description,
      referenceImage
    });

    res.status(201).json({
      status: 'success',
      message: 'Your bespoke inquiry has been submitted. Our private concierge will contact you shortly.',
      inquiry
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all custom inquiries
// @route   GET /api/custom-inquiries
// @access  Private/Admin
exports.getInquiries = async (req, res, next) => {
  try {
    const inquiries = await CustomInquiry.find().sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: inquiries.length,
      inquiries
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update custom inquiry status
// @route   PUT /api/custom-inquiries/:id/status
// @access  Private/Admin
exports.updateInquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!status || !['pending', 'responded'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Please provide a valid status: pending or responded' });
    }

    const inquiry = await CustomInquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!inquiry) {
      return res.status(404).json({ status: 'error', message: 'Inquiry not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Inquiry status updated successfully',
      inquiry
    });
  } catch (err) {
    next(err);
  }
};
