const Product = require('../models/Product');
const Category = require('../models/Category');
const { uploadMultipleImages, deleteImage } = require('../utils/cloudinary');

// @desc    Get all products with filters, search, sorting and pagination
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      material,
      bestSeller,
      featured,
      newArrival,
      sort,
      page = 1,
      limit = 9
    } = req.query;

    const queryObj = {};

    // 1. Search filter
    if (search) {
      queryObj.name = { $regex: search, $options: 'i' };
    }

    // 2. Category filter
    if (category) {
      // Let's search simply by Category ID or slug
      let categoryId = category;
      if (category.match(/^[0-9a-fA-F]{24}$/) === null) {
        const cat = await Category.findOne({ slug: category });
        if (cat) {
          categoryId = cat._id;
        } else {
          // Fallback to a non-existent ObjectId to return an empty array of products
          categoryId = new (require('mongoose')).Types.ObjectId();
        }
      }
      queryObj.category = categoryId;
    }

    // 3. Price filter
    if (minPrice || maxPrice) {
      queryObj.price = {};
      if (minPrice) queryObj.price.$gte = Number(minPrice);
      if (maxPrice) queryObj.price.$lte = Number(maxPrice);
    }

    // 4. Material filter
    if (material) {
      queryObj.material = { $regex: material, $options: 'i' };
    }

    // 5. Status flags
    if (bestSeller === 'true') queryObj.bestSeller = true;
    if (featured === 'true') queryObj.featured = true;
    if (newArrival === 'true') queryObj.newArrival = true;

    // Build Query
    let query = Product.find(queryObj).populate('category', 'name slug');

    // 6. Sorting
    if (sort) {
      const sortBy = sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt'); // Default to newest
    }

    // 7. Pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    query = query.skip(skip).limit(limitNum);

    const products = await query;
    const total = await Product.countDocuments(queryObj);

    res.status(200).json({
      status: 'success',
      count: products.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      products
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single product by slug
// @route   GET /api/products/:slug
// @access  Public
exports.getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate('category', 'name slug');
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }
    res.status(200).json({
      status: 'success',
      product
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      shortDescription,
      category,
      price,
      discountPrice,
      stock,
      sku,
      material,
      weight,
      featured,
      bestSeller,
      newArrival,
      video,
      isCustom
    } = req.body;

    // Check SKU uniqueness
    const skuExists = await Product.findOne({ sku });
    if (skuExists) {
      return res.status(400).json({ status: 'error', message: 'Product with this SKU already exists' });
    }

    // Check name uniqueness
    const nameExists = await Product.findOne({ name });
    if (nameExists) {
      return res.status(400).json({ status: 'error', message: 'Product with this name already exists' });
    }

    // Upload multiple images to Cloudinary
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await uploadMultipleImages(req.files, 'products');
    } else {
      return res.status(400).json({ status: 'error', message: 'Please upload at least one product image' });
    }

    const product = await Product.create({
      name,
      description,
      shortDescription,
      category,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : 0,
      stock: Number(stock),
      sku,
      material,
      weight,
      featured: featured === 'true',
      bestSeller: bestSeller === 'true',
      newArrival: newArrival === 'true',
      isCustom: isCustom === 'true' || isCustom === true,
      images: imageUrls,
      video: video || ''
    });

    res.status(201).json({
      status: 'success',
      product
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    // Capture fields
    const updateData = { ...req.body };

    // Convert numeric fields if they exist
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.discountPrice) updateData.discountPrice = Number(updateData.discountPrice);
    if (updateData.stock) updateData.stock = Number(updateData.stock);

    // Convert booleans
    if (updateData.featured) updateData.featured = updateData.featured === 'true' || updateData.featured === true;
    if (updateData.bestSeller) updateData.bestSeller = updateData.bestSeller === 'true' || updateData.bestSeller === true;
    if (updateData.newArrival) updateData.newArrival = updateData.newArrival === 'true' || updateData.newArrival === true;
    if (updateData.isCustom !== undefined) updateData.isCustom = updateData.isCustom === 'true' || updateData.isCustom === true;

    // Handle Image uploads
    if (req.files && req.files.length > 0) {
      // Upload new images to Cloudinary
      const newUrls = await uploadMultipleImages(req.files, 'products');
      
      // If user wants to replace completely or append
      // By default, we will append them or replace if specified
      if (req.body.replaceImages === 'true') {
        // Delete all old images from Cloudinary
        const deletePromises = product.images.map(imgUrl => deleteImage(imgUrl));
        await Promise.all(deletePromises);
        updateData.images = newUrls;
      } else {
        updateData.images = [...product.images, ...newUrls];
      }
    }

    // If deleting specific images by URL
    if (req.body.deleteImageUrls) {
      let deleteUrls = req.body.deleteImageUrls;
      if (typeof deleteUrls === 'string') {
        deleteUrls = [deleteUrls];
      }
      
      // Filter out images to delete from Cloudinary
      const deletePromises = deleteUrls.map(url => deleteImage(url));
      await Promise.all(deletePromises);

      // Keep only images that are NOT in the delete list
      updateData.images = (updateData.images || product.images).filter(
        img => !deleteUrls.includes(img)
      );
    }

    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      product
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    // Delete all images from Cloudinary
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map(imgUrl => deleteImage(imgUrl));
      try {
        await Promise.all(deletePromises);
      } catch (delErr) {
        console.error(`Failed to delete product images: ${delErr.message}`);
      }
    }

    await product.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Product and all associated images deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get related products
// @route   GET /api/products/related/:id
// @access  Public
exports.getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    // Find products in same category excluding current product
    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    })
      .limit(4)
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      products: related
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all unique materials
// @route   GET /api/products/materials
// @access  Public
exports.getMaterials = async (req, res, next) => {
  try {
    const materials = await Product.distinct('material');
    const activeMaterials = materials.filter(Boolean);
    res.status(200).json({
      status: 'success',
      materials: activeMaterials
    });
  } catch (err) {
    next(err);
  }
};

