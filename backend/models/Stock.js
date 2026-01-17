const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  unit: {
    type: String,
    enum: ['pcs', 'kg', 'liters', 'packs'],
    default: 'pcs'
  },
  expiry: {
    type: Date,
    required: false
  },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    default: 'In Stock'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-update status based on quantity
stockSchema.pre('save', function(next) {
  if (this.quantity === 0) {
    this.status = 'Out of Stock';
  } else if (this.quantity < 10) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Stock', stockSchema);