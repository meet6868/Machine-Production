import mongoose from 'mongoose';

// Schema for defining field positions in screenshot images
const fieldMappingSchema = new mongoose.Schema({
  fieldName: {
    type: String,
    required: true,
    enum: [
      'machineName',
      'productionLength',
      'totalPick',
      'speed',
      'h1',
      'h2',
      'worph',
      'other'
    ]
  },
  // Bounding box coordinates (x, y, width, height) as percentages
  x: { type: Number, required: true, min: 0, max: 100 },
  y: { type: Number, required: true, min: 0, max: 100 },
  width: { type: Number, required: true, min: 0, max: 100 },
  height: { type: Number, required: true, min: 0, max: 100 },
  // OCR preprocessing hints
  preprocessingHint: {
    type: String,
    enum: ['text', 'number', 'time', 'mixed'],
    default: 'text'
  }
});

// Template for mapping screenshot fields
const screenshotMappingTemplateSchema = new mongoose.Schema({
  templateName: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  machineDisplayType: {
    type: String,
    required: true,
    default: 'standard'
  },
  // Sample screenshot for reference
  sampleImageUrl: String,
  // Field mappings
  fieldMappings: [fieldMappingSchema],
  // Is this the default template?
  isDefault: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Worker name mapping (display name -> system name)
const workerNameMappingSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: true,
    unique: true,
    uppercase: true, // Store in uppercase for case-insensitive matching
    trim: true
  },
  systemName: {
    type: String,
    required: true,
    trim: true
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker'
  },
  // Alternative display names (variations)
  aliases: [{
    type: String,
    uppercase: true,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
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

// Screenshot upload records
const screenshotRecordSchema = new mongoose.Schema({
  productionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Production'
  },
  date: {
    type: Date,
    required: true
  },
  shift: {
    type: String,
    enum: ['day', 'night'],
    required: true
  },
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  // Screenshot image
  imageUrl: {
    type: String,
    required: true
  },
  imageSize: Number,
  // Template used for extraction
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScreenshotMappingTemplate'
  },
  // Extracted data
  extractedData: {
    machineName: String,
    productionLength: String,
    totalPick: String,
    speed: String,
    h1: String,
    h2: String,
    worph: String,
    raw: Object // Raw OCR results
  },
  // Confidence scores for each field
  confidenceScores: {
    machineName: Number,
    productionLength: Number,
    totalPick: Number,
    speed: Number,
    h1: Number,
    h2: Number,
    worph: Number,
    overall: Number
  },
  // Processing status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'manual_review'],
    default: 'pending'
  },
  processingError: String,
  // Was the data manually verified/corrected?
  manuallyVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedBy: {
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

// Indexes
screenshotMappingTemplateSchema.index({ templateName: 1 });
screenshotMappingTemplateSchema.index({ isDefault: 1 });
workerNameMappingSchema.index({ displayName: 1 });
workerNameMappingSchema.index({ systemName: 1 });
workerNameMappingSchema.index({ workerId: 1 });
screenshotRecordSchema.index({ date: -1, shift: 1, machineId: 1 });
screenshotRecordSchema.index({ productionId: 1 });
screenshotRecordSchema.index({ status: 1 });

// Update timestamp on save
screenshotMappingTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

workerNameMappingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

screenshotRecordSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const ScreenshotMappingTemplate = mongoose.model('ScreenshotMappingTemplate', screenshotMappingTemplateSchema);
const WorkerNameMapping = mongoose.model('WorkerNameMapping', workerNameMappingSchema);
const ScreenshotRecord = mongoose.model('ScreenshotRecord', screenshotRecordSchema);

export { ScreenshotMappingTemplate, WorkerNameMapping, ScreenshotRecord };
