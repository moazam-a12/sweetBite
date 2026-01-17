const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const PurchaseStats = require('../models/PurchaseStats');

// @route   GET /api/customer/featured
// @desc    Get featured products (popular + recently added)
router.get('/featured', async (req, res) => {
  try {
    // Get popular products (lastMonthPurchases > 5)
    const popularStats = await PurchaseStats.find({
      lastMonthPurchases: { $gt: 5 }
    })
      .populate('productId')
      .limit(6);

    let featuredProducts = [];

    // Add popular products that are active and in stock
    for (const stat of popularStats) {
      if (stat.productId && stat.productId.isActive) {
        const stock = await Stock.findOne({ productId: stat.productId._id });
        if (stock && stock.quantity > 0) {
          featuredProducts.push({
            ...stat.productId.toObject(),
            quantity: stock.quantity,
            inStock: true
          });
        }
      }
    }

    // If not enough popular products, add recently added ones
    if (featuredProducts.length < 6) {
      const needed = 6 - featuredProducts.length;
      const existingIds = featuredProducts.map(p => p._id.toString());
      
      const recentProducts = await Product.find({
        isActive: true,
        _id: { $nin: existingIds }
      })
        .sort({ createdAt: -1 })
        .limit(needed);

      for (const product of recentProducts) {
        const stock = await Stock.findOne({ productId: product._id });
        if (stock && stock.quantity > 0) {
          featuredProducts.push({
            ...product.toObject(),
            quantity: stock.quantity,
            inStock: true
          });
        }
      }
    }

    res.json(featuredProducts);
  } catch (error) {
    console.error('Featured products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/customer/cart
// @desc    Get user's cart (placeholder)
router.get('/cart', async (req, res) => {
  try {
    res.json({ items: [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;