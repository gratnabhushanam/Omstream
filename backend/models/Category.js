const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  icon: { type: String },
  module: { type: String, enum: ['divine', 'sloka', 'mentor', 'kids', 'other'], default: 'divine' }
}, {
  timestamps: true
});

module.exports = mongoose.models.Category || mongoose.model('Category', CategorySchema);
