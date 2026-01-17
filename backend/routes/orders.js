const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const PurchaseStats = require('../models/PurchaseStats');
const auth = require('../middleware/auth');

// @route   GET /api/orders
// @desc    Get all orders (or user's orders)
router.get('/', auth, async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'customer') {
      orders = await Order.find({ customerId: req.user.id }).sort({ createdAt: -1 });
    } else {
      orders = await Order.find().sort({ createdAt: -1 });
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders
// @desc    Create new order (with stock deduction + purchase tracking)
router.post('/', auth, async (req, res) => {
  try {
    const { items, shipping, total } = req.body;

    // Validate stock availability for all items
    for (const item of items) {
      if (item.productId) {
        const stock = await Stock.findOne({ productId: item.productId });
        
        if (!stock || stock.quantity < item.qty) {
          const product = await Product.findById(item.productId);
          return res.status(400).json({ 
            message: `Insufficient stock for ${product ? product.name : 'product'}` 
          });
        }
      }
    }

    // Create order
    const orderId = 'ORD' + Date.now().toString().slice(-6);

    const order = new Order({
      orderId,
      customerId: req.user.id,
      items: items.map(item => ({
        name: item.name,
        price: item.price,
        qty: item.qty,
        productId: item.productId || null
      })),
      shipping,
      total,
      status: 'Pending'
    });

    await order.save();

    // Deduct stock + track purchases for each item
    for (const item of items) {
      if (item.productId) {
        // Deduct stock
        const stock = await Stock.findOne({ productId: item.productId });
        if (stock) {
          stock.quantity -= item.qty;
          await stock.save();

          // Deactivate product if out of stock
          if (stock.quantity === 0) {
            await Product.findByIdAndUpdate(item.productId, { isActive: false });
          }
        }

        // Track purchase statistics
        let stats = await PurchaseStats.findOne({ productId: item.productId });
        if (stats) {
          await stats.recordPurchase(item.qty);
        } else {
          // Create new stats entry
          stats = new PurchaseStats({
            productId: item.productId,
            totalPurchases: item.qty,
            lastMonthPurchases: item.qty,
            lastPurchaseDate: new Date()
          });
          await stats.save();
        }
      }
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/orders/:id/status
// @desc    Update order status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;