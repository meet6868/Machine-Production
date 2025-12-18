import { validationResult } from 'express-validator';
import { Production, DailyProduction, ProductionSummary } from '../models/Production.js';
import Machine from '../models/Machine.js';
import Worker from '../models/Worker.js';

// @desc    Get all production records for company
// @route   GET /api/production
// @access  Private
export const getProductions = async (req, res) => {
  try {
    const { startDate, endDate, machineId, workerId, shift } = req.query;
    
    let filter = { company: req.companyId };

    if (startDate || endDate) {
      filter.productionDate = {};
      if (startDate) filter.productionDate.$gte = new Date(startDate);
      if (endDate) filter.productionDate.$lte = new Date(endDate);
    }

    if (machineId) filter.machine = machineId;
    if (workerId) filter.worker = workerId;
    if (shift) filter.shift = shift;

    const productions = await Production.find(filter)
      .populate('machine', 'machineNumber type description')
      .populate('worker', 'name aadhaarNumber phone')
      .populate('createdBy', 'username')
      .sort({ productionDate: -1, shift: 1 });

    res.json({
      success: true,
      count: productions.length,
      data: productions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get single production record
// @route   GET /api/production/:id
// @access  Private
export const getProduction = async (req, res) => {
  try {
    const production = await Production.findOne({
      _id: req.params.id,
      company: req.companyId
    })
      .populate('machine', 'machineNumber type description')
      .populate('worker', 'name aadhaarNumber phone')
      .populate('createdBy', 'username email');

    if (!production) {
      return res.status(404).json({ success: false, message: 'Production record not found' });
    }

    // Get daily production data
    const dailyData = await DailyProduction.findOne({
      company: req.companyId,
      machine: production.machine._id,
      productionDate: production.productionDate
    });

    res.json({
      success: true,
      data: {
        ...production.toObject(),
        dailyData
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Create new production record
// @route   POST /api/production
// @access  Private
export const createProduction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { 
      machine, 
      worker, 
      productionDate, 
      shift,
      runtime,
      efficiency,
      h1,
      h2,
      worph,
      meter,
      totalPick,
      speed,
      cfm,
      pik,
      notes 
    } = req.body;

    // Verify machine belongs to company
    const machineExists = await Machine.findOne({
      _id: machine,
      company: req.companyId,
      isActive: true
    });

    if (!machineExists) {
      return res.status(404).json({ success: false, message: 'Machine not found' });
    }

    // Verify worker belongs to company
    const workerExists = await Worker.findOne({
      _id: worker,
      company: req.companyId
    });

    if (!workerExists) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    const date = productionDate ? new Date(productionDate) : new Date();
    date.setHours(0, 0, 0, 0); // Normalize to start of day

    // Create or update shift production record
    const production = await Production.findOneAndUpdate(
      {
        company: req.companyId,
        machine,
        productionDate: date,
        shift
      },
      {
        company: req.companyId,
        machine,
        worker,
        productionDate: date,
        shift,
        runtime: runtime || 0,
        efficiency: efficiency || 0,
        h1: h1 || 0,
        h2: h2 || 0,
        worph: worph || 0,
        meter: meter || 0,
        totalPick: totalPick || 0,
        notes,
        createdBy: req.userId
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    ).populate('machine worker');

    // Create or update daily production fields (speed, cfm, pik)
    if (speed !== undefined || cfm !== undefined || pik !== undefined) {
      // Get previous day's electricity reading if available
      let previousReading = req.body.previousReading !== undefined && req.body.previousReading !== null 
        ? parseFloat(req.body.previousReading) 
        : undefined;
      let currentReading = req.body.currentReading !== undefined && req.body.currentReading !== null 
        ? parseFloat(req.body.currentReading) 
        : undefined;
      let unitsConsumed = 0;

      // If current reading provided but not previous, try to get from yesterday
      if (currentReading !== undefined && previousReading === undefined) {
        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const yesterdayData = await DailyProduction.findOne({
          company: req.companyId,
          machine,
          productionDate: {
            $gte: new Date(yesterday.setHours(0, 0, 0, 0)),
            $lt: new Date(yesterday.setHours(23, 59, 59, 999))
          }
        });
        
        if (yesterdayData && yesterdayData.currentReading !== undefined) {
          previousReading = yesterdayData.currentReading;
        }
      }

      // Calculate units consumed
      if (currentReading !== undefined && previousReading !== undefined) {
        unitsConsumed = Math.max(0, currentReading - previousReading);
      }

      // Build update object - only include electricity fields if provided
      const updateData = {
        company: req.companyId,
        machine,
        productionDate: date,
        speed: speed || 0,
        cfm: cfm || 0,
        pik: pik || 0,
        createdBy: req.userId
      };

      // Only add electricity fields if they were provided in the request
      if (currentReading !== undefined) {
        updateData.previousReading = previousReading !== undefined ? previousReading : 0;
        updateData.currentReading = currentReading;
        updateData.unitsConsumed = unitsConsumed;
      }

      await DailyProduction.findOneAndUpdate(
        {
          company: req.companyId,
          machine,
          productionDate: date
        },
        updateData,
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );
    }

    // Compute and store summary
    await computeAndStoreSummary(req.companyId, date);

    res.status(201).json({
      success: true,
      data: production
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Production record already exists for this machine, date, and shift' 
      });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update production record
// @route   PUT /api/production/:id
// @access  Private
export const updateProduction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const production = await Production.findOne({
      _id: req.params.id,
      company: req.companyId
    });

    if (!production) {
      return res.status(404).json({ success: false, message: 'Production record not found' });
    }

    const { 
      worker,
      runtime,
      efficiency,
      h1,
      h2,
      worph,
      meter,
      totalPick,
      speed,
      cfm,
      pik,
      notes 
    } = req.body;

    // Update shift-specific fields
    if (worker !== undefined) production.worker = worker;
    if (runtime !== undefined) production.runtime = runtime;
    if (efficiency !== undefined) production.efficiency = efficiency;
    if (h1 !== undefined) production.h1 = h1;
    if (h2 !== undefined) production.h2 = h2;
    if (worph !== undefined) production.worph = worph;
    if (meter !== undefined) production.meter = meter;
    if (totalPick !== undefined) production.totalPick = totalPick;
    if (notes !== undefined) production.notes = notes;

    await production.save();

    // Update daily production fields
    if (speed !== undefined || cfm !== undefined || pik !== undefined) {
      await DailyProduction.findOneAndUpdate(
        {
          company: req.companyId,
          machine: production.machine,
          productionDate: production.productionDate
        },
        {
          ...(speed !== undefined && { speed }),
          ...(cfm !== undefined && { cfm }),
          ...(pik !== undefined && { pik })
        },
        { upsert: true }
      );
    }

    // Recompute summary
    await computeAndStoreSummary(req.companyId, production.productionDate);

    const updatedProduction = await Production.findById(req.params.id)
      .populate('machine worker createdBy');

    res.json({
      success: true,
      data: updatedProduction
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Delete production record
// @route   DELETE /api/production/:id
// @access  Private
export const deleteProduction = async (req, res) => {
  try {
    const production = await Production.findOne({
      _id: req.params.id,
      company: req.companyId
    });

    if (!production) {
      return res.status(404).json({ success: false, message: 'Production record not found' });
    }

    const date = production.productionDate;
    await production.deleteOne();

    // Recompute summary
    await computeAndStoreSummary(req.companyId, date);

    res.json({
      success: true,
      message: 'Production record deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get production statistics
// @route   GET /api/production/stats
// @access  Private
export const getProductionStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Production.aggregate([
      {
        $match: {
          company: req.companyId,
          productionDate: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          totalMeter: { $sum: '$meter' },
          totalPick: { $sum: '$totalPick' },
          avgEfficiency: { $avg: '$efficiency' },
          recordCount: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalMeter: 0,
        totalPick: 0,
        avgEfficiency: 0,
        recordCount: 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get daily summary
// @route   GET /api/production/summary/daily
// @access  Private
export const getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    const summary = await ProductionSummary.findOne({
      company: req.companyId,
      date: queryDate
    });

    if (!summary) {
      return res.json({
        success: true,
        data: null,
        message: 'No summary available for this date'
      });
    }

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get summary for specific date
// @route   GET /api/production/summary/:date
// @access  Private
export const getDateSummary = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    const summary = await ProductionSummary.findOne({
      company: req.companyId,
      date
    });

    const productions = await Production.find({
      company: req.companyId,
      productionDate: date
    }).populate('machine worker');

    const dailyProductions = await DailyProduction.find({
      company: req.companyId,
      productionDate: date
    }).populate('machine');

    res.json({
      success: true,
      data: {
        summary,
        productions,
        dailyProductions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Helper function to compute and store summary
async function computeAndStoreSummary(companyId, date) {
  try {
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    // Get all productions for the date
    const dayProductions = await Production.find({
      company: companyId,
      productionDate: queryDate,
      shift: 'day'
    }).populate('machine');

    const nightProductions = await Production.find({
      company: companyId,
      productionDate: queryDate,
      shift: 'night'
    }).populate('machine');

    // Get daily production data (CFM)
    const dailyData = await DailyProduction.find({
      company: companyId,
      productionDate: queryDate
    });

    // Compute day summary
    const daySummary = computeShiftSummary(dayProductions);
    
    // Compute night summary
    const nightSummary = computeShiftSummary(nightProductions);

    // Compute average CFM
    const totalCFM = dailyData.reduce((sum, d) => sum + (d.cfm || 0), 0);
    const avgCFM = dailyData.length > 0 ? totalCFM / dailyData.length : 0;

    // Compute total summary (calculate totals first)
    const totalMeter = daySummary.totalMeter + nightSummary.totalMeter;
    const totalPick = daySummary.totalPick + nightSummary.totalPick;
    const totalMachine = (daySummary.machineCount + nightSummary.machineCount) / 2;
    const totalAvgRuntime = daySummary.avgRuntime + nightSummary.avgRuntime;
    // Weighted efficiency by shift hours: 14 hours day + 10 hours night = 24 hours total
    const totalEfficiency = (14 * daySummary.avgEfficiency + 10 * nightSummary.avgEfficiency) / 24;

    // Compute electricity summary (after totalMeter is calculated)
    const totalUnitsConsumed = dailyData.reduce((sum, d) => sum + (d.unitsConsumed || 0), 0);
    const machinesWithElectricity = dailyData.filter(d => d.unitsConsumed > 0).length;
    const unitsPerMeter = totalMeter > 0 ? totalUnitsConsumed / totalMeter : 0;

    // Store summary
    await ProductionSummary.findOneAndUpdate(
      {
        company: companyId,
        date: queryDate
      },
      {
        company: companyId,
        date: queryDate,
        dayEfficiency: daySummary.avgEfficiency,
        dayMeter: daySummary.totalMeter,
        dayPick: daySummary.totalPick,
        dayMachine: daySummary.machineCount,
        avgDayRuntime: daySummary.avgRuntime,
        nightEfficiency: nightSummary.avgEfficiency,
        nightMeter: nightSummary.totalMeter,
        nightPick: nightSummary.totalPick,
        nightMachine: nightSummary.machineCount,
        avgNightRuntime: nightSummary.avgRuntime,
        totalEfficiency,
        totalMeter,
        totalPick,
        totalMachine,
        totalAvgRuntime,
        avgCFM,
        totalUnitsConsumed,
        unitsPerMeter,
        machinesReported: machinesWithElectricity
      },
      {
        upsert: true,
        new: true
      }
    );

    return true;
  } catch (error) {
    console.error('Error computing summary:', error);
    return false;
  }
}

// Helper function to compute shift summary
function computeShiftSummary(productions) {
  if (productions.length === 0) {
    return {
      avgEfficiency: 0,
      totalMeter: 0,
      totalPick: 0,
      machineCount: 0,
      avgRuntime: 0
    };
  }

  let totalEfficiency = 0;
  let totalMeter = 0;
  let totalPick = 0;
  let totalRuntime = 0;
  let efficiencyCount = 0;

  productions.forEach(prod => {
    // Efficiency
    if (prod.efficiency > 0) {
      totalEfficiency += prod.efficiency;
      efficiencyCount++;
    }

    // Meter - multiply by machine type (double = 2x)
    const multiplier = prod.machine && prod.machine.type === 'double' ? 2 : 1;
    totalMeter += (prod.meter || 0) * multiplier;
    totalPick += (prod.totalPick || 0) * multiplier;

    // Runtime
    totalRuntime += prod.runtime || 0;
  });

  const avgEfficiency = efficiencyCount > 0 ? totalEfficiency / efficiencyCount : 0;
  const avgRuntime = productions.length > 0 ? totalRuntime / productions.length : 0;

  return {
    avgEfficiency,
    totalMeter,
    totalPick,
    machineCount: efficiencyCount,
    avgRuntime
  };
}

// @desc    Get worker-wise production analytics
// @route   GET /api/production/analytics/worker/:workerId
// @access  Private
export const getWorkerAnalytics = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { startDate, endDate, days = 7 } = req.query;

    // Calculate date range
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate ? new Date(startDate) : new Date(endDateObj.getTime() - days * 24 * 60 * 60 * 1000);

    // Get productions for this worker
    const productions = await Production.find({
      company: req.companyId,
      worker: workerId,
      productionDate: {
        $gte: startDateObj,
        $lte: endDateObj
      }
    })
      .populate('machine', 'machineNumber type')
      .sort({ productionDate: 1 });

    // Get daily summaries
    const summaries = await ProductionSummary.find({
      company: req.companyId,
      date: {
        $gte: startDateObj,
        $lte: endDateObj
      }
    }).sort({ date: 1 });

    // Group by date for charts
    const dailyData = {};
    productions.forEach(prod => {
      const dateKey = prod.productionDate.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          dayShift: { efficiency: 0, meter: 0, pick: 0, runtime: 0, count: 0 },
          nightShift: { efficiency: 0, meter: 0, pick: 0, runtime: 0, count: 0 }
        };
      }

      const shift = prod.shift === 'day' ? 'dayShift' : 'nightShift';
      const multiplier = prod.machine && prod.machine.type === 'double' ? 2 : 1;

      dailyData[dateKey][shift].efficiency += prod.efficiency || 0;
      dailyData[dateKey][shift].meter += (prod.meter || 0) * multiplier;
      dailyData[dateKey][shift].pick += (prod.totalPick || 0) * multiplier;
      dailyData[dateKey][shift].runtime += prod.runtime || 0;
      dailyData[dateKey][shift].count += 1;
    });

    // Calculate averages
    Object.values(dailyData).forEach(day => {
      ['dayShift', 'nightShift'].forEach(shift => {
        if (day[shift].count > 0) {
          day[shift].avgEfficiency = day[shift].efficiency / day[shift].count;
          day[shift].avgRuntime = day[shift].runtime / day[shift].count;
        }
      });
    });

    // Overall statistics
    let totalEfficiency = 0, totalMeter = 0, totalPick = 0, totalRuntime = 0, effCount = 0;
    productions.forEach(prod => {
      if (prod.efficiency > 0) {
        totalEfficiency += prod.efficiency;
        effCount++;
      }
      const multiplier = prod.machine && prod.machine.type === 'double' ? 2 : 1;
      totalMeter += (prod.meter || 0) * multiplier;
      totalPick += (prod.totalPick || 0) * multiplier;
      totalRuntime += prod.runtime || 0;
    });

    res.json({
      success: true,
      data: {
        dailyData: Object.values(dailyData),
        overall: {
          avgEfficiency: effCount > 0 ? totalEfficiency / effCount : 0,
          totalMeter,
          totalPick,
          totalRuntime,
          avgRuntime: productions.length > 0 ? totalRuntime / productions.length : 0,
          totalShifts: productions.length,
          dateRange: { start: startDateObj, end: endDateObj }
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get machine-wise production analytics
// @route   GET /api/production/analytics/machine/:machineId
// @access  Private
export const getMachineAnalytics = async (req, res) => {
  try {
    const { machineId } = req.params;
    const { startDate, endDate, days = 7 } = req.query;

    // Calculate date range
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate ? new Date(startDate) : new Date(endDateObj.getTime() - days * 24 * 60 * 60 * 1000);

    // Get machine details
    const machine = await Machine.findOne({ _id: machineId, company: req.companyId });
    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machine not found' });
    }

    // Get productions for this machine
    const productions = await Production.find({
      company: req.companyId,
      machine: machineId,
      productionDate: {
        $gte: startDateObj,
        $lte: endDateObj
      }
    })
      .populate('worker', 'name')
      .sort({ productionDate: 1 });

    // Group by date for charts
    const dailyData = {};
    const workerPerformance = {};

    productions.forEach(prod => {
      const dateKey = prod.productionDate.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          dayShift: { efficiency: 0, meter: 0, pick: 0, runtime: 0, count: 0, machineCount: 0 },
          nightShift: { efficiency: 0, meter: 0, pick: 0, runtime: 0, count: 0, machineCount: 0 }
        };
      }

      const shift = prod.shift === 'day' ? 'dayShift' : 'nightShift';
      const multiplier = machine.type === 'double' ? 2 : 1;

      dailyData[dateKey][shift].efficiency += prod.efficiency || 0;
      dailyData[dateKey][shift].meter += (prod.meter || 0) * multiplier;
      dailyData[dateKey][shift].pick += (prod.totalPick || 0) * multiplier;
      dailyData[dateKey][shift].runtime += prod.runtime || 0;
      dailyData[dateKey][shift].count += 1;
      dailyData[dateKey][shift].machineCount += multiplier; // Count machines with multiplier

      // Worker performance tracking
      const workerId = prod.worker?._id?.toString() || 'Unknown';
      const workerName = prod.worker?.name || 'Unknown';
      if (!workerPerformance[workerId]) {
        workerPerformance[workerId] = {
          workerName,
          efficiency: 0,
          meter: 0,
          pick: 0,
          runtime: 0,
          count: 0,
          effCount: 0,
          machineCount: 0
        };
      }

      if (prod.efficiency > 0) {
        workerPerformance[workerId].efficiency += prod.efficiency;
        workerPerformance[workerId].effCount += 1;
      }
      workerPerformance[workerId].meter += (prod.meter || 0) * multiplier;
      workerPerformance[workerId].pick += (prod.totalPick || 0) * multiplier;
      workerPerformance[workerId].runtime += prod.runtime || 0;
      workerPerformance[workerId].count += multiplier; // Count with multiplier
      workerPerformance[workerId].machineCount += multiplier;
    });

    // Calculate averages and m/hr (day shift = 14 hours, night shift = 10 hours)
    Object.values(dailyData).forEach(day => {
      // Day Shift calculations (14 hours)
      if (day.dayShift.count > 0) {
        day.dayShift.avgEfficiency = day.dayShift.efficiency / day.dayShift.count;
        day.dayShift.avgRuntime = day.dayShift.runtime / day.dayShift.count;
        // m/hr = total meter / (14 hours * number of machines counted)
        day.dayShift.meterPerHour = day.dayShift.machineCount > 0 
          ? day.dayShift.meter / (14 * day.dayShift.count) 
          : 0;
      }
      
      // Night Shift calculations (10 hours)
      if (day.nightShift.count > 0) {
        day.nightShift.avgEfficiency = day.nightShift.efficiency / day.nightShift.count;
        day.nightShift.avgRuntime = day.nightShift.runtime / day.nightShift.count;
        // m/hr = total meter / (10 hours * number of machines counted)
        day.nightShift.meterPerHour = day.nightShift.machineCount > 0 
          ? day.nightShift.meter / (10 * day.nightShift.count) 
          : 0;
      }

      // Total (24 hours)
      const totalMeter = day.dayShift.meter + day.nightShift.meter;
      const totalMachineHours = (14 * day.dayShift.count) + (10 * day.nightShift.count);
      day.totalMeterPerHour = totalMachineHours > 0 ? totalMeter / totalMachineHours : 0;
    });

    // Calculate worker averages
    Object.values(workerPerformance).forEach(worker => {
      if (worker.effCount > 0) {
        worker.avgEfficiency = worker.efficiency / worker.effCount;
      }
      if (worker.count > 0) {
        worker.avgRuntime = worker.runtime / worker.count;
      }
    });

    // Overall statistics with proper multiplier handling
    let totalEfficiency = 0, totalMeter = 0, totalPick = 0, totalRuntime = 0, effCount = 0;
    let totalDayShifts = 0, totalNightShifts = 0;
    let totalDayMeter = 0, totalNightMeter = 0;
    let totalDayMachineCount = 0, totalNightMachineCount = 0;
    const multiplier = machine.type === 'double' ? 2 : 1;
    
    productions.forEach(prod => {
      if (prod.efficiency > 0) {
        totalEfficiency += prod.efficiency;
        effCount++;
      }
      const meter = (prod.meter || 0) * multiplier;
      const pick = (prod.totalPick || 0) * multiplier;
      
      totalMeter += meter;
      totalPick += pick;
      totalRuntime += prod.runtime || 0;

      // Track shift-specific totals
      if (prod.shift === 'day') {
        totalDayShifts++;
        totalDayMeter += meter;
        totalDayMachineCount += multiplier;
      } else {
        totalNightShifts++;
        totalNightMeter += meter;
        totalNightMachineCount += multiplier;
      }
    });

    // Calculate m/hr for summary (day = 14 hrs, night = 10 hrs)
    const dayMeterPerHour = totalDayMachineCount > 0 ? totalDayMeter / (14 * totalDayShifts) : 0;
    const nightMeterPerHour = totalNightMachineCount > 0 ? totalNightMeter / (10 * totalNightShifts) : 0;
    const totalMachineHours = (14 * totalDayShifts) + (10 * totalNightShifts);
    const overallMeterPerHour = totalMachineHours > 0 ? totalMeter / totalMachineHours : 0;

    res.json({
      success: true,
      data: {
        machine: {
          id: machine._id,
          machineNumber: machine.machineNumber,
          type: machine.type
        },
        dailyData: Object.values(dailyData),
        workerPerformance: Object.values(workerPerformance),
        overall: {
          avgEfficiency: effCount > 0 ? totalEfficiency / effCount : 0,
          totalMeter,
          totalPick,
          totalRuntime,
          avgRuntime: productions.length > 0 ? totalRuntime / productions.length : 0,
          totalShifts: productions.length,
          dayShifts: totalDayShifts,
          nightShifts: totalNightShifts,
          dayMeterPerHour,
          nightMeterPerHour,
          overallMeterPerHour,
          dateRange: { start: startDateObj, end: endDateObj }
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get electricity consumption analytics
// @route   GET /api/production/analytics/electricity
// @access  Private
export const getElectricityAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, days = 30 } = req.query;

    // Calculate date range
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate ? new Date(startDate) : new Date(endDateObj.getTime() - days * 24 * 60 * 60 * 1000);

    // Get summaries for the period (electricity is stored in summary)
    const summaries = await ProductionSummary.find({
      company: req.companyId,
      date: {
        $gte: startDateObj,
        $lte: endDateObj
      }
    }).sort({ date: 1 });

    // Build date-wise data from summaries
    const dateWiseData = summaries.map(summary => ({
      date: summary.date.toISOString().split('T')[0],
      totalUnits: summary.totalUnitsConsumed || 0,
      totalMeter: summary.totalMeter || 0,
      unitsPerMeter: summary.unitsPerMeter || 0,
      machinesReported: summary.machinesReported || 0
    }));

    // Overall statistics
    const totalUnits = summaries.reduce((sum, s) => sum + (s.totalUnitsConsumed || 0), 0);
    const totalMeter = summaries.reduce((sum, s) => sum + (s.totalMeter || 0), 0);
    const avgUnitsPerMeter = totalMeter > 0 ? totalUnits / totalMeter : 0;
    const daysWithData = summaries.filter(s => s.totalUnitsConsumed > 0).length;
    const avgDailyUnits = daysWithData > 0 ? totalUnits / daysWithData : 0;

    res.json({
      success: true,
      data: {
        dateWiseData,
        overall: {
          totalUnits,
          totalMeter,
          avgUnitsPerMeter,
          avgDailyUnits,
          daysTracked: summaries.length,
          dateRange: { start: startDateObj, end: endDateObj }
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get production summaries for date range
// @route   GET /api/production/summaries
// @access  Private
export const getSummaries = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build filter
    let filter = { company: req.companyId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const summaries = await ProductionSummary.find(filter)
      .sort({ date: -1 });

    res.json(summaries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
