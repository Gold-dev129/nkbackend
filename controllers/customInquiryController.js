const CustomInquiry = require('../models/CustomInquiry');
const { uploadSingleImage, uploadSingleVideo } = require('../utils/cloudinary');

// @desc    Submit a custom bespoke jewelry inquiry
// @route   POST /api/custom-inquiries
// @access  Public
exports.createInquiry = async (req, res, next) => {
  try {
    const { name, email, phoneNumber, material, diamondSpecs, description } = req.body;

    let referenceImage = '';
    let referenceVideo = '';
    
    // Check if files are uploaded
    if (req.files) {
      if (req.files.referenceImage && req.files.referenceImage[0]) {
        const imgResult = await uploadSingleImage(req.files.referenceImage[0].buffer, 'custom_inquiries');
        referenceImage = imgResult.secure_url;
      }
      if (req.files.referenceVideo && req.files.referenceVideo[0]) {
        const vidResult = await uploadSingleVideo(req.files.referenceVideo[0].buffer, 'custom_inquiries');
        referenceVideo = vidResult.secure_url;
      }
    }

    const inquiry = await CustomInquiry.create({
      name,
      email,
      phoneNumber,
      material,
      diamondSpecs,
      description,
      referenceImage,
      referenceVideo
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
