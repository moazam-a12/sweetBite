const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// @route   GET /api/chef/pending
// @desc    Get all pending orders (for dashboard)
router.get('/pending', auth, role('chef', 'manager', 'admin'), async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: { $in: ['Pending', 'Preparing'] } 
    }).sort({ createdAt: 1 }); // Oldest first
    
    res.json(orders);
  } catch (error) {
    console.error('Get pending orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chef/active
// @desc    Get all active orders (Pending, Preparing, Ready)
router.get('/active', auth, role('chef', 'manager', 'admin'), async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: { $in: ['Pending', 'Preparing', 'Ready'] } 
    }).sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Get active orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chef/history
// @desc    Get order history (Ready, Picked Up, Out for Delivery, Delivered)
router.get('/history', auth, role('chef', 'manager', 'admin'), async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: { $in: ['Ready', 'Picked Up', 'Out for Delivery', 'Delivered'] } 
    }).sort({ updatedAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/chef/order/:id/status
// @desc    Update order status (chef can only set: Pending, Preparing, Ready)
router.patch('/order/:id/status', auth, role('chef', 'manager', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    
    // Chef can only set these statuses
    const allowedStatuses = ['Pending', 'Preparing', 'Ready'];
    if (!allowedStatuses.includes(status)) {
      return res.status(403).json({ 
        message: 'Chefs can only set status to: Pending, Preparing, or Ready' 
      });
    }

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

// @route   GET /api/chef/stats
// @desc    Get chef dashboard statistics
router.get('/stats', auth, role('chef', 'manager', 'admin'), async (req, res) => {
  try {
    const pending = await Order.countDocuments({ status: 'Pending' });
    const preparing = await Order.countDocuments({ status: 'Preparing' });
    const ready = await Order.countDocuments({ status: 'Ready' });

    res.json({
      pending,
      preparing,
      ready,
      total: pending + preparing + ready
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;