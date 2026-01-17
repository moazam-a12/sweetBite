const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// @route   GET /api/delivery/ready
// @desc    Get all ready orders (for dashboard)
router.get('/ready', auth, role('delivery', 'manager', 'admin'), async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: 'Ready'
    }).sort({ updatedAt: 1 }); // Oldest ready first
    
    res.json(orders);
  } catch (error) {
    console.error('Get ready orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/delivery/active
// @desc    Get all active delivery orders (Ready, Picked Up, Out for Delivery)
router.get('/active', auth, role('delivery', 'manager', 'admin'), async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: { $in: ['Ready', 'Picked Up', 'Out for Delivery'] } 
    }).sort({ updatedAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Get active delivery orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/delivery/history
// @desc    Get delivered orders history
router.get('/history', auth, role('delivery', 'manager', 'admin'), async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: 'Delivered'
    }).sort({ updatedAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Get delivery history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/delivery/order/:id
// @desc    Get single order details
router.get('/order/:id', auth, role('delivery', 'manager', 'admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/delivery/order/:id/status
// @desc    Update order status (delivery can only set: Picked Up, Out for Delivery, Delivered)
router.patch('/order/:id/status', auth, role('delivery', 'manager', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    
    // Delivery can only set these statuses
    const allowedStatuses = ['Picked Up', 'Out for Delivery', 'Delivered'];
    if (!allowedStatuses.includes(status)) {
      return res.status(403).json({ 
        message: 'Delivery can only set status to: Picked Up, Out for Delivery, or Delivered' 
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
    console.error('Update delivery status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/delivery/stats
// @desc    Get delivery dashboard statistics
router.get('/stats', auth, role('delivery', 'manager', 'admin'), async (req, res) => {
  try {
    const ready = await Order.countDocuments({ status: 'Ready' });
    const pickedUp = await Order.countDocuments({ status: 'Picked Up' });
    const outForDelivery = await Order.countDocuments({ status: 'Out for Delivery' });

    res.json({
      ready,
      pickedUp,
      outForDelivery,
      total: ready + pickedUp + outForDelivery
    });
  } catch (error) {
    console.error('Get delivery stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;