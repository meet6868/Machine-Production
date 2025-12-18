import mongoose from 'mongoose';

const productionSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  machine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  productionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  shift: {
    type: String,
    enum: ['day', 'night'],
    required: true
  },
  
  // Shift-specific fields (recorded per shift)
  runtime: {
    type: Number, // stored in minutes
    default: 0,
    min: 0
  },
  efficiency: {
    type: Number, // percentage
    default: 0,
    min: 0,
    max: 100
  },
  h1: {
    type: Number, // Hour 1 production
    default: 0,
    min: 0
  },
  h2: {
    type: Number, // Hour 2 production
    default: 0,
    min: 0
  },
  worph: {
    type: Number, // Work per hour
    default: 0,
    min: 0
  },
  meter: {
    type: Number, // Fabric meters
    default: 0,
    min: 0
  },
  totalPick: {
    type: Number,
    default: 0,
    min: 0
  },
  
  notes: {
    type: String,
    trim: true
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

// Daily Production Schema (fields that are same for whole 24 hours)
const dailyProductionSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  machine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  productionDate: {
    type: Date,
    required: true
  },
  
  // Daily fields (entered once for whole day)
  speed: {
    type: Number,
    default: 0,
    min: 0
  },
  cfm: {
    type: Number, // Cubic Feet per Minute (only day shift)
    default: 0,
    min: 0
  },
  pik: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Electricity readings (daily - whole 24 hours)
  previousReading: {
    type: Number, // Previous day's electricity meter reading
    default: 0,
    min: 0
  },
  currentReading: {
    type: Number, // Today's electricity meter reading
    default: 0,
    min: 0
  },
  unitsConsumed: {
    type: Number, // Calculated: currentReading - previousReading
    default: 0,
    min: 0
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

// Summary Schema (computed daily summaries)
const productionSummarySchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  date: {
    type: Date,
    required: true,
    unique: true
  },
  
  // Day shift summary
  dayEfficiency: { type: Number, default: 0 },
  dayMeter: { type: Number, default: 0 },
  dayPick: { type: Number, default: 0 },
  dayMachine: { type: Number, default: 0 },
  avgDayRuntime: { type: Number, default: 0 }, // in minutes
  
  // Night shift summary
  nightEfficiency: { type: Number, default: 0 },
  nightMeter: { type: Number, default: 0 },
  nightPick: { type: Number, default: 0 },
  nightMachine: { type: Number, default: 0 },
  avgNightRuntime: { type: Number, default: 0 }, // in minutes
  
  // Total summary
  totalEfficiency: { type: Number, default: 0 },
  totalMeter: { type: Number, default: 0 },
  totalPick: { type: Number, default: 0 },
  totalMachine: { type: Number, default: 0 },
  totalAvgRuntime: { type: Number, default: 0 }, // in minutes
  avgCFM: { type: Number, default: 0 },
  
  // Electricity summary
  totalUnitsConsumed: { type: Number, default: 0 }, // Total units consumed for the day
  unitsPerMeter: { type: Number, default: 0 }, // Units consumed per meter produced
  machinesReported: { type: Number, default: 0 }, // Number of machines with electricity data
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient querying
productionSchema.index({ company: 1, productionDate: -1 });
productionSchema.index({ company: 1, machine: 1, productionDate: 1, shift: 1 }, { unique: true });

dailyProductionSchema.index({ company: 1, machine: 1, productionDate: 1 }, { unique: true });

productionSummarySchema.index({ company: 1, date: -1 });

// Pre-save middleware
productionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

dailyProductionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

productionSummarySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const Production = mongoose.model('Production', productionSchema);
export const DailyProduction = mongoose.model('DailyProduction', dailyProductionSchema);
export const ProductionSummary = mongoose.model('ProductionSummary', productionSummarySchema);

export default Production;
