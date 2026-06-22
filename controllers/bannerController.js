const Banner = require('../models/Banner');
const { uploadSingleImage, deleteImage } = require('../utils/cloudinary');

// @desc    Get all active banners
// @route   GET /api/banners
// @access  Public
exports.getBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort('order');
    res.status(200).json({
      status: 'success',
      count: banners.length,
      banners
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all banners (Admin only)
// @route   GET /api/banners/admin
// @access  Private/Admin
exports.getAllBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort('order');
    res.status(200).json({
      status: 'success',
      count: banners.length,
      banners
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a banner
// @route   POST /api/banners
// @access  Private/Admin
exports.createBanner = async (req, res, next) => {
  try {
    const { title, subtitle, link, position, order, isActive } = req.body;

    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Please upload a banner image' });
    }

    const uploadRes = await uploadSingleImage(req.file.buffer, 'banners');

    const banner = await Banner.create({
      title,
      subtitle,
      link,
      position,
      order: order ? Number(order) : 0,
      isActive: isActive === 'true' || isActive === true || isActive === undefined,
      image: uploadRes.secure_url
    });

    res.status(201).json({
      status: 'success',
      banner
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
exports.updateBanner = async (req, res, next) => {
  try {
    const { title, subtitle, link, position, order, isActive } = req.body;
    let banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ status: 'error', message: 'Banner not found' });
    }

    const updateFields = {
      title,
      subtitle,
      link,
      position,
      order: order ? Number(order) : banner.order
    };

    if (isActive !== undefined) {
      updateFields.isActive = isActive === 'true' || isActive === true;
    }

    if (req.file) {
      // Delete old banner image from Cloudinary
      if (banner.image) {
        try {
          await deleteImage(banner.image);
        } catch (delErr) {
          console.error(`Failed to delete old banner image: ${delErr.message}`);
        }
      }

      const uploadRes = await uploadSingleImage(req.file.buffer, 'banners');
      updateFields.image = uploadRes.secure_url;
    }

    banner = await Banner.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      banner
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
exports.deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ status: 'error', message: 'Banner not found' });
    }

    // Delete image from Cloudinary
    if (banner.image) {
      try {
        await deleteImage(banner.image);
      } catch (delErr) {
        console.error(`Failed to delete banner image: ${delErr.message}`);
      }
    }

    await banner.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Banner deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
