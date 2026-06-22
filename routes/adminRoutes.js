const express = require('express');
const {
  getAdminStats,
  getUsers,
  banUser,
  deleteUser
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.put('/users/:id/ban', banUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
