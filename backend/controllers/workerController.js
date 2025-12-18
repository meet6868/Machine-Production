import { validationResult } from 'express-validator';
import Worker from '../models/Worker.js';

// @desc    Get all workers for company
// @route   GET /api/workers
// @access  Private
export const getWorkers = async (req, res) => {
  try {
    const workers = await Worker.find({ 
      company: req.companyId,
      isActive: true 
    }).populate('createdBy', 'username email').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: workers.length,
      data: workers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get single worker
// @route   GET /api/workers/:id
// @access  Private
export const getWorker = async (req, res) => {
  try {
    const worker = await Worker.findOne({
      _id: req.params.id,
      company: req.companyId
    }).populate('createdBy', 'username email');

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    res.json({
      success: true,
      data: worker
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Create new worker
// @route   POST /api/workers
// @access  Private
export const createWorker = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, aadhaarNumber, phone } = req.body;

    const worker = await Worker.create({
      company: req.companyId,
      name,
      aadhaarNumber,
      phone,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: worker
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update worker
// @route   PUT /api/workers/:id
// @access  Private
export const updateWorker = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const worker = await Worker.findOne({
      _id: req.params.id,
      company: req.companyId
    });

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    const { name, aadhaarNumber, phone } = req.body;

    worker.name = name;
    worker.aadhaarNumber = aadhaarNumber || worker.aadhaarNumber;
    worker.phone = phone || worker.phone;

    await worker.save();

    res.json({
      success: true,
      data: worker
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Delete worker (soft delete)
// @route   DELETE /api/workers/:id
// @access  Private
export const deleteWorker = async (req, res) => {
  try {
    const worker = await Worker.findOne({
      _id: req.params.id,
      company: req.companyId
    });

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    worker.isActive = false;
    await worker.save();

    res.json({
      success: true,
      message: 'Worker deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
