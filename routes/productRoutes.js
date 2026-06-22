const express = require('express');
const {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getRelatedProducts,
  getMaterials
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getProducts);
router.get('/materials', getMaterials);
router.get('/related/:id', getRelatedProducts);
router.get('/:slug', getProductBySlug);

// Admin-only routes
router.use(protect);
router.use(authorize('admin'));

router.post('/', upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'videoFile', maxCount: 1 }
]), createProduct);
router.put('/:id', upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'videoFile', maxCount: 1 }
]), updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
