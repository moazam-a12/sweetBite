const mongoose = require('mongoose');

const purchaseStatsSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true
  },
  totalPurchases: {
    type: Number,
    default: 0
  },
  lastMonthPurchases: {
    type: Number,
    default: 0
  },
  lastPurchaseDate: {
    type: Date
  },
  lastMonthReset: {
    type: Date,
    default: Date.now
  }
});

// Method to increment purchase count
purchaseStatsSchema.methods.recordPurchase = async function(quantity) {
  // Check if we need to reset monthly counter
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  if (this.lastMonthReset < oneMonthAgo) {
    this.lastMonthPurchases = 0;
    this.lastMonthReset = new Date();
  }
  
  this.totalPurchases += quantity;
  this.lastMonthPurchases += quantity;
  this.lastPurchaseDate = new Date();
  
  await this.save();
};

module.exports = mongoose.model('PurchaseStats', purchaseStatsSchema);