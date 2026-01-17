// backend/routes/manager.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const PurchaseStats = require('../models/PurchaseStats');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

/* =========================
   USER MANAGEMENT
========================= */

// @route   GET /api/manager/users
// @desc    Get all users
router.get('/users', auth, role('manager', 'admin'), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/manager/user
// @desc    Create new user
router.post('/user', auth, role('manager', 'admin'), async (req, res) => {
  try {
    const { name, email, password, role: userRole } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: userRole || 'pending'
    });

    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/manager/user/:id
// @desc    Update user
router.put('/user/:id', auth, role('manager', 'admin'), async (req, res) => {
  try {
    const { name, email, password, role: userRole } = req.body;
    
    const updateData = {
      name,
      email,
      role: userRole
    };

    // Only update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/manager/user/:id
// @desc    Delete user
router.delete('/user/:id', auth, role('manager', 'admin'), async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* =========================
   ANALYTICS & REPORTS
========================= */

// @route   GET /api/manager/analytics/overview
// @desc    Get business overview analytics
router.get('/analytics/overview', auth, role('manager', 'admin'), async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const completedOrders = await Order.countDocuments({ status: 'Delivered' });
    
    const lowStockItems = await Stock.countDocuments({ status: 'Low Stock' });
    const outOfStockItems = await Stock.countDocuments({ status: 'Out of Stock' });

    res.json({
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders
      },
      revenue: {
        total: totalRevenue[0]?.total || 0
      },
      products: {
        total: totalProducts,
        lowStock: lowStockItems,
        outOfStock: outOfStockItems
      },
      customers: {
        total: totalCustomers
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/manager/analytics/sales
// @desc    Get sales data by date range
router.get('/analytics/sales', auth, role('manager', 'admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const salesByDate = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(salesByDate);
  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/manager/analytics/popular-products
// @desc    Get most popular products
router.get('/analytics/popular-products', auth, role('manager', 'admin'), async (req, res) => {
  try {
    const popularProducts = await PurchaseStats.find()
      .sort({ totalPurchases: -1 })
      .limit(10)
      .populate('productId', 'name price category');

    const formattedData = popularProducts
      .filter(stat => stat.productId)
      .map(stat => ({
        product: stat.productId.name,
        totalSales: stat.totalPurchases,
        monthlySales: stat.lastMonthPurchases,
        category: stat.productId.category,
        price: stat.productId.price,
        revenue: stat.totalPurchases * stat.productId.price
      }));

    res.json(formattedData);
  } catch (error) {
    console.error('Popular products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/manager/analytics/customer-insights
// @desc    Get customer purchase insights
router.get('/analytics/customer-insights', auth, role('manager', 'admin'), async (req, res) => {
  try {
    const customerData = await Order.aggregate([
      {
        $group: {
          _id: '$customerId',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          lastOrder: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      { $sort: { totalSpent: -1 } },
      { $limit: 20 }
    ]);

    const formattedData = customerData.map(item => ({
      name: item.customer.name,
      email: item.customer.email,
      orderCount: item.orderCount,
      totalSpent: item.totalSpent,
      lastOrder: item.lastOrder,
      avgOrderValue: item.totalSpent / item.orderCount
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Customer insights error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* =========================
   ORDER MANAGEMENT (All orders)
========================= */

// @route   GET /api/manager/orders/all
// @desc    Get all orders with filters
router.get('/orders/all', auth, role('manager', 'admin'), async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find(query)
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(orders);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/manager/order/:id/status
// @desc    Update any order status (manager has full control)
router.patch('/order/:id/status', auth, role('manager', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/manager/order/:id
// @desc    Delete order (manager only - for corrections)
router.delete('/order/:id', auth, role('manager', 'admin'), async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADD THIS ROUTE TO backend/routes/manager.js
// Place it after the existing order routes

// @route   PUT /api/manager/order/:id
// @desc    Update entire order (items, shipping, status, payment)
router.put('/order/:id', auth, role('manager', 'admin'), async (req, res) => {
  try {
    const { items, total, status, paymentCollected, shipping } = req.body;
    
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one item' });
    }
    
    // Update order
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        items,
        total,
        status,
        paymentCollected,
        shipping,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('customerId', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;