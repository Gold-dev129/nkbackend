const Category = require('../models/Category');
const { uploadSingleImage, deleteImage } = require('../utils/cloudinary');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      count: categories.length,
      categories
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single category by slug
// @route   GET /api/categories/:slug
// @access  Public
exports.getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }
    res.status(200).json({
      status: 'success',
      category
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'Category already exists' });
    }

    let imageUrl = '';
    if (req.file) {
      const uploadRes = await uploadSingleImage(req.file.buffer, 'categories');
      imageUrl = uploadRes.secure_url;
    }

    const category = await Category.create({
      name,
      description,
      image: imageUrl
    });

    res.status(201).json({
      status: 'success',
      category
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }

    const fieldsToUpdate = { name, description };

    if (req.file) {
      // If category already has an image, delete the old one from Cloudinary
      if (category.image) {
        try {
          await deleteImage(category.image);
        } catch (delErr) {
          console.error(`Failed to delete old category image: ${delErr.message}`);
        }
      }
      
      const uploadRes = await uploadSingleImage(req.file.buffer, 'categories');
      fieldsToUpdate.image = uploadRes.secure_url;
    }

    category = await Category.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      category
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }

    // Delete image from Cloudinary
    if (category.image) {
      try {
        await deleteImage(category.image);
      } catch (delErr) {
        console.error(`Failed to delete category image: ${delErr.message}`);
      }
    }

    await category.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Category deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
