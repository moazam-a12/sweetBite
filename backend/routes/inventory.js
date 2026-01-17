const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const upload = require('../middleware/upload');
const { uploadImageToDrive, deleteImageFromDrive } = require('../config/cloudinary');

// @route   GET /api/inventory
// @desc    Get all products with stock (unified view)
router.get('/', auth, role('inventory', 'manager', 'admin'), async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    const productsWithStock = await Promise.all(
      products.map(async (product) => {
        const stock = await Stock.findOne({ productId: product._id });
        return {
          _id: product._id,
          name: product.name,
          price: product.price,
          description: product.description,
          category: product.category,
          image: product.image, // ✅ ADD THIS
          stock: stock ? {
            _id: stock._id,
            quantity: stock.quantity,
            unit: stock.unit,
            expiry: stock.expiry,
            status: stock.status
          } : null,
          createdAt: product.createdAt
        };
      })
    );

    res.json(productsWithStock);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/inventory
// @desc    Add new product WITH stock and optional image
router.post('/', auth, role('inventory', 'manager', 'admin'), upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, category, quantity, unit, expiry } = req.body;

    console.log('📦 Adding product:', name);
    console.log('📁 Image file:', req.file ? req.file.originalname : 'No image');

    // Upload image to Drive if provided
    let imageUrl = '';
    if (req.file) {
      console.log('📤 Uploading to Google Drive...');
      imageUrl = await uploadImageToDrive(req.file.buffer, req.file.originalname);
      console.log('✅ Image uploaded:', imageUrl);
    }

    const product = new Product({
      name,
      price,
      description: description || '',
      category: category || 'Dessert',
      image: imageUrl,
      isActive: true
    });

    await product.save();

    const stock = new Stock({
      productId: product._id,
      quantity: quantity || 0,
      unit: unit || 'pcs',
      expiry: expiry || null
    });

    await stock.save();

    res.status(201).json({
      _id: product._id,
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      image: product.image,
      stock: {
        _id: stock._id,
        quantity: stock.quantity,
        unit: stock.unit,
        expiry: stock.expiry,
        status: stock.status
      },
      createdAt: product.createdAt
    });
  } catch (error) {
    console.error('❌ Add inventory error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   PUT /api/inventory/:id
// @desc    Update product AND stock and optional image
router.put('/:id', auth, role('inventory', 'manager', 'admin'), upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, category, quantity, unit, expiry, status, removeImage } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Handle image update
    let imageUrl = product.image;

    // If user wants to remove image
    if (removeImage === 'true' && product.image) {
      await deleteImageFromDrive(product.image);
      imageUrl = '';
    }

    // If new image uploaded
    if (req.file) {
      // Delete old image if exists
      if (product.image) {
        await deleteImageFromDrive(product.image);
      }
      imageUrl = await uploadImageToDrive(req.file.buffer, req.file.originalname);
    }

    // Update product
    product.name = name;
    product.price = price;
    product.description = description;
    product.category = category;
    product.image = imageUrl;
    product.isActive = true;
    product.updatedAt = Date.now();

    await product.save();

    let stock = await Stock.findOne({ productId: req.params.id });

    if (stock) {
      stock.quantity = quantity;
      stock.unit = unit;
      stock.expiry = expiry;
      if (status) stock.status = status;
      await stock.save();
    } else {
      stock = new Stock({
        productId: req.params.id,
        quantity,
        unit,
        expiry
      });
      await stock.save();
    }

    res.json({
      _id: product._id,
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      image: product.image,
      stock: {
        _id: stock._id,
        quantity: stock.quantity,
        unit: stock.unit,
        expiry: stock.expiry,
        status: stock.status
      }
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   DELETE /api/inventory/:id
// @desc    Delete product AND its stock AND image
router.delete('/:id', auth, role('inventory', 'manager', 'admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    // Delete image if exists
    if (product && product.image) {
      await deleteImageFromDrive(product.image);
    }

    await Product.findByIdAndDelete(req.params.id);
    await Stock.findOneAndDelete({ productId: req.params.id });
    res.json({ message: 'Product and stock deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;