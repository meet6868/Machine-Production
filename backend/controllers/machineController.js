import { validationResult } from 'express-validator';
import Machine from '../models/Machine.js';

// @desc    Get all machines for company
// @route   GET /api/machines
// @access  Private
export const getMachines = async (req, res) => {
  try {
    const machines = await Machine.find({ 
      company: req.companyId,
      isActive: true 
    }).populate('createdBy', 'username email').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: machines.length,
      data: machines
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get single machine
// @route   GET /api/machines/:id
// @access  Private
export const getMachine = async (req, res) => {
  try {
    const machine = await Machine.findOne({
      _id: req.params.id,
      company: req.companyId
    }).populate('createdBy', 'username email');

    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machine not found' });
    }

    res.json({
      success: true,
      data: machine
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Create new machine
// @route   POST /api/machines
// @access  Private
export const createMachine = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { machineNumber, type, description } = req.body;

    // Check if machine number already exists for this company
    const existingMachine = await Machine.findOne({
      company: req.companyId,
      machineNumber
    });

    if (existingMachine) {
      return res.status(400).json({ 
        success: false, 
        message: 'Machine with this number already exists in your company' 
      });
    }

    const machine = await Machine.create({
      company: req.companyId,
      machineNumber,
      type,
      description,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: machine
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update machine
// @route   PUT /api/machines/:id
// @access  Private
export const updateMachine = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const machine = await Machine.findOne({
      _id: req.params.id,
      company: req.companyId
    });

    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machine not found' });
    }

    const { machineNumber, type, description } = req.body;

    // Check if new machine number conflicts
    if (machineNumber !== machine.machineNumber) {
      const existingMachine = await Machine.findOne({
        company: req.companyId,
        machineNumber,
        _id: { $ne: req.params.id }
      });

      if (existingMachine) {
        return res.status(400).json({ 
          success: false, 
          message: 'Machine with this number already exists' 
        });
      }
    }

    machine.machineNumber = machineNumber;
    machine.type = type;
    machine.description = description || machine.description;

    await machine.save();

    res.json({
      success: true,
      data: machine
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Delete machine (soft delete)
// @route   DELETE /api/machines/:id
// @access  Private
export const deleteMachine = async (req, res) => {
  try {
    const machine = await Machine.findOne({
      _id: req.params.id,
      company: req.companyId
    });

    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machine not found' });
    }

    machine.isActive = false;
    await machine.save();

    res.json({
      success: true,
      message: 'Machine deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
