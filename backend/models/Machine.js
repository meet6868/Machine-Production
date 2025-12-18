import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  machineNumber: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['single', 'double'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Compound index to ensure unique machine number per company
machineSchema.index({ company: 1, machineNumber: 1 }, { unique: true });

machineSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Machine', machineSchema);
