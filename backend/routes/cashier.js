const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const PurchaseStats = require('../models/PurchaseStats');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// @route   GET /api/cashier/customers/search
// @desc    Search customers by name or email
router.get('/customers/search', auth, role('cashier', 'manager', 'admin'), async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const customers = await User.find({
      role: 'customer',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('name email').limit(10);

    res.json(customers);
  } catch (error) {
    console.error('Customer search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/cashier/customer/:id
// @desc    Get customer details with orders
router.get('/customer/:id', auth, role('cashier', 'manager', 'admin'), async (req, res) => {
  try {
    const customer = await User.findById(req.params.id).select('name email');
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const orders = await Order.find({ customerId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      customer,
      orders
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/cashier/customer
// @desc    Create new customer with full details (auto-approved as customer)
router.post('/customer', auth, role('cashier', 'manager', 'admin'), async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Check if customer exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Customer with this email already exists' });
    }

    // Validate password is provided
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const customer = new User({
      name,
      email,
      password: hashedPassword,
      role: 'customer', // Auto-approved, no pending status
      phone: phone || '',
      address: address || {
        addr1: '',
        addr2: '',
        city: '',
        postal: ''
      }
    });

    await customer.save();

    res.status(201).json({
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address
      }
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/cashier/products
// @desc    Get all available products for checkout
router.get('/products', auth, role('cashier', 'manager', 'admin'), async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    
    const productsWithStock = await Promise.all(
      products.map(async (product) => {
        const stock = await Stock.findOne({ productId: product._id });
        return {
          ...product.toObject(),
          stock: stock ? stock.quantity : 0
        };
      })
    );

    res.json(productsWithStock.filter(p => p.stock > 0));
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/cashier/order
// @desc    Create order for customer (with payment status)
router.post('/order', auth, role('cashier', 'manager', 'admin'), async (req, res) => {
  try {
    const { customerId, items, total, paymentCollected } = req.body;

    // Validate stock
    for (const item of items) {
      const stock = await Stock.findOne({ productId: item.productId });
      if (!stock || stock.quantity < item.qty) {
        const product = await Product.findById(item.productId);
        return res.status(400).json({ 
          message: `Insufficient stock for ${product ? product.name : 'product'}` 
        });
      }
    }

    // Create order
    const orderId = 'ORD' + Date.now().toString().slice(-6);

    const order = new Order({
      orderId,
      customerId,
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        qty: item.qty
      })),
      shipping: {
        name: '',
        phone: '',
        addr1: 'In-store pickup',
        addr2: '',
        city: '',
        postal: '',
        shipping: 'pickup',
        notes: paymentCollected ? 'Payment collected at checkout' : 'Payment pending'
      },
      total,
      status: 'Pending',
      paymentCollected: paymentCollected || false
    });

    await order.save();

    // Deduct stock
    for (const item of items) {
      const stock = await Stock.findOne({ productId: item.productId });
      if (stock) {
        stock.quantity -= item.qty;
        await stock.save();

        if (stock.quantity === 0) {
          await Product.findByIdAndUpdate(item.productId, { isActive: false });
        }
      }

      // Track purchase stats
      let stats = await PurchaseStats.findOne({ productId: item.productId });
      if (stats) {
        await stats.recordPurchase(item.qty);
      } else {
        stats = new PurchaseStats({
          productId: item.productId,
          totalPurchases: item.qty,
          lastMonthPurchases: item.qty,
          lastPurchaseDate: new Date()
        });
        await stats.save();
      }
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/cashier/orders
// @desc    Get all orders (for history)
router.get('/orders', auth, role('cashier', 'manager', 'admin'), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;