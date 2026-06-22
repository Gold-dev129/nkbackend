const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Category = require('../models/Category');

// @desc    Get admin dashboard stats & chart data
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getAdminStats = async (req, res, next) => {
  try {
    // 1. Core counters
    const usersCount = await User.countDocuments({ role: 'user' });
    const productsCount = await Product.countDocuments();
    const ordersCount = await Order.countDocuments();
    const categoriesCount = await Category.countDocuments();
    const reviewsCount = await Review.countDocuments();

    // 2. Financial statistics
    const paidOrders = await Order.find({ isPaid: true });
    const totalSales = paidOrders.reduce((acc, order) => acc + order.totalPrice, 0);

    // 3. Monthly performance charts (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlySalesAgg = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Format aggregate output for charts: e.g. [{ month: 'Jan', revenue: 500000, orders: 12 }]
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const salesData = monthlySalesAgg.map(item => {
      const monthIndex = item._id.month - 1;
      return {
        month: `${monthNames[monthIndex]} ${item._id.year.toString().slice(-2)}`,
        revenue: item.revenue,
        orders: item.orders
      };
    });

    // 4. Recent orders (limit 5)
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort('-createdAt')
      .limit(5);

    res.status(200).json({
      status: 'success',
      stats: {
        totalSales,
        ordersCount,
        usersCount,
        productsCount,
        categoriesCount,
        reviewsCount
      },
      salesData,
      recentOrders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' }).sort('-createdAt');
    res.status(200).json({
      status: 'success',
      count: users.length,
      users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Ban or unban user (Admin only)
// @route   PUT /api/admin/users/:id/ban
// @access  Private/Admin
exports.banUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ status: 'error', message: 'Admin users cannot be banned' });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: `User has been ${user.isBanned ? 'banned' : 'unbanned'} successfully`,
      user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user account (Admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ status: 'error', message: 'Admin users cannot be deleted' });
    }

    await user.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
