const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['translation', 'subtitle', 'dubbing', 'chaptering', 'all'], 
    required: true 
  },
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  contentType: { 
    type: String, 
    enum: ['Movie', 'Video', 'Sloka', 'Story'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'], 
    default: 'pending' 
  },
  progress: { type: Number, default: 0 },
  result: { type: mongoose.Schema.Types.Mixed },
  error: { type: String },
  targetLanguages: { type: [String], default: [] }
}, {
  timestamps: true
});

module.exports = mongoose.models.Job || mongoose.model('Job', JobSchema);
