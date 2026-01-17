const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// @route   GET /api/products
// @desc    Get all active products (for customers)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    
    const productsWithStock = await Promise.all(
      products.map(async (product) => {
        const stock = await Stock.findOne({ productId: product._id });
        return {
          ...product.toObject(),
          inStock: stock && stock.quantity > 0,
          quantity: stock ? stock.quantity : 0
        };
      })
    );
    
    const inStockProducts = productsWithStock.filter(p => p.inStock);
    
    res.json(inStockProducts);
  } catch (error) {
    console.error('❌ Error in GET /api/products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/all
// @desc    Get all products (for manager)
router.get('/all', auth, role('manager', 'admin'), async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    
    const productsWithStock = await Promise.all(
      products.map(async (product) => {
        const stock = await Stock.findOne({ productId: product._id });
        return {
          ...product.toObject(),
          stock: stock || null,
          quantity: stock ? stock.quantity : 0
        };
      })
    );
    
    res.json(productsWithStock);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/products
// @desc    Create new product (manager only)
router.post('/', auth, role('manager', 'admin'), async (req, res) => {
  try {
    const { name, price, description, category } = req.body;

    const product = new Product({
      name,
      price,
      description,
      category,
      isActive: false
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product details (manager only)
router.put('/:id', auth, role('manager', 'admin'), async (req, res) => {
  try {
    const { name, price, description, category, isActive } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, description, category, isActive, updatedAt: Date.now() },
      { new: true }
    );
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (manager only)
router.delete('/:id', auth, role('manager', 'admin'), async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    await Stock.findOneAndDelete({ productId: req.params.id });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;