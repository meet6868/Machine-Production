import { ScreenshotMappingTemplate, WorkerNameMapping, ScreenshotRecord } from '../models/ScreenshotMapping.js';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { Jimp } from 'jimp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============ SCREENSHOT MAPPING TEMPLATES ============

// Create a new mapping template
export const createMappingTemplate = async (req, res) => {
  try {
    const { templateName, description, machineDisplayType, fieldMappings, isDefault } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await ScreenshotMappingTemplate.updateMany({}, { isDefault: false });
    }

    const template = new ScreenshotMappingTemplate({
      templateName,
      description,
      machineDisplayType,
      fieldMappings,
      isDefault,
      createdBy: req.user.id
    });

    await template.save();

    res.status(201).json({
      success: true,
      message: 'Mapping template created successfully',
      data: template
    });
  } catch (error) {
    console.error('Error creating mapping template:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create mapping template'
    });
  }
};

// Get all mapping templates
export const getMappingTemplates = async (req, res) => {
  try {
    const templates = await ScreenshotMappingTemplate.find()
      .populate('createdBy', 'username')
      .sort({ isDefault: -1, createdAt: -1 });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching mapping templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mapping templates'
    });
  }
};

// Get a specific mapping template
export const getMappingTemplate = async (req, res) => {
  try {
    const template = await ScreenshotMappingTemplate.findById(req.params.id)
      .populate('createdBy', 'username');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Mapping template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching mapping template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mapping template'
    });
  }
};

// Get default template
export const getDefaultTemplate = async (req, res) => {
  try {
    const template = await ScreenshotMappingTemplate.findOne({ isDefault: true })
      .populate('createdBy', 'username');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'No default template found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching default template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch default template'
    });
  }
};

// Update mapping template
export const updateMappingTemplate = async (req, res) => {
  try {
    const { templateName, description, machineDisplayType, fieldMappings, isDefault } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await ScreenshotMappingTemplate.updateMany(
        { _id: { $ne: req.params.id } },
        { isDefault: false }
      );
    }

    const template = await ScreenshotMappingTemplate.findByIdAndUpdate(
      req.params.id,
      {
        templateName,
        description,
        machineDisplayType,
        fieldMappings,
        isDefault,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Mapping template not found'
      });
    }

    res.json({
      success: true,
      message: 'Mapping template updated successfully',
      data: template
    });
  } catch (error) {
    console.error('Error updating mapping template:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update mapping template'
    });
  }
};

// Delete mapping template
export const deleteMappingTemplate = async (req, res) => {
  try {
    const template = await ScreenshotMappingTemplate.findByIdAndDelete(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Mapping template not found'
      });
    }

    res.json({
      success: true,
      message: 'Mapping template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting mapping template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete mapping template'
    });
  }
};

// ============ WORKER NAME MAPPINGS ============

// Create worker name mapping
export const createWorkerNameMapping = async (req, res) => {
  try {
    const { displayName, systemName, workerId, aliases } = req.body;

    const mapping = new WorkerNameMapping({
      displayName: displayName.toUpperCase().trim(),
      systemName: systemName.trim(),
      workerId,
      aliases: aliases?.map(alias => alias.toUpperCase().trim()) || []
    });

    await mapping.save();

    res.status(201).json({
      success: true,
      message: 'Worker name mapping created successfully',
      data: mapping
    });
  } catch (error) {
    console.error('Error creating worker name mapping:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A mapping for this display name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create worker name mapping'
    });
  }
};

// Get all worker name mappings
export const getWorkerNameMappings = async (req, res) => {
  try {
    const mappings = await WorkerNameMapping.find({ isActive: true })
      .populate('workerId', 'name')
      .sort({ displayName: 1 });

    res.json({
      success: true,
      data: mappings
    });
  } catch (error) {
    console.error('Error fetching worker name mappings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch worker name mappings'
    });
  }
};

// Update worker name mapping
export const updateWorkerNameMapping = async (req, res) => {
  try {
    const { displayName, systemName, workerId, aliases, isActive } = req.body;

    const mapping = await WorkerNameMapping.findByIdAndUpdate(
      req.params.id,
      {
        displayName: displayName.toUpperCase().trim(),
        systemName: systemName.trim(),
        workerId,
        aliases: aliases?.map(alias => alias.toUpperCase().trim()) || [],
        isActive,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Worker name mapping not found'
      });
    }

    res.json({
      success: true,
      message: 'Worker name mapping updated successfully',
      data: mapping
    });
  } catch (error) {
    console.error('Error updating worker name mapping:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update worker name mapping'
    });
  }
};

// Delete worker name mapping
export const deleteWorkerNameMapping = async (req, res) => {
  try {
    const mapping = await WorkerNameMapping.findByIdAndDelete(req.params.id);

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Worker name mapping not found'
      });
    }

    res.json({
      success: true,
      message: 'Worker name mapping deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting worker name mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete worker name mapping'
    });
  }
};

// Resolve display name to system name
export const resolveWorkerName = async (displayNameRaw) => {
  try {
    const displayName = displayNameRaw.toUpperCase().trim();
    
    // Try exact match
    let mapping = await WorkerNameMapping.findOne({ 
      displayName, 
      isActive: true 
    });

    // Try aliases
    if (!mapping) {
      mapping = await WorkerNameMapping.findOne({
        aliases: displayName,
        isActive: true
      });
    }

    return mapping ? mapping.systemName : displayNameRaw;
  } catch (error) {
    console.error('Error resolving worker name:', error);
    return displayNameRaw;
  }
};

// ============ SCREENSHOT PROCESSING ============

// Extract text from image region
const extractTextFromRegion = async (imagePath, region, preprocessingHint) => {
  try {
    const image = await Jimp.read(imagePath);
    const imageWidth = image.bitmap.width;
    const imageHeight = image.bitmap.height;

    // Convert percentage coordinates to pixels
    const x = Math.round((region.x / 100) * imageWidth);
    const y = Math.round((region.y / 100) * imageHeight);
    const width = Math.round((region.width / 100) * imageWidth);
    const height = Math.round((region.height / 100) * imageHeight);

    // Crop the region
    const cropped = image.crop(x, y, width, height);

    // Preprocessing based on hint
    if (preprocessingHint === 'number' || preprocessingHint === 'time') {
      cropped.contrast(0.3).normalize();
    } else {
      cropped.normalize();
    }

    // Convert to grayscale
    cropped.greyscale();

    // Save temporary cropped image
    const tempPath = path.join(__dirname, `../temp/region_${Date.now()}.png`);
    await cropped.writeAsync(tempPath);

    // Perform OCR
    const { data: { text, confidence } } = await Tesseract.recognize(tempPath, 'eng', {
      logger: () => {} // Suppress logs
    });

    // Clean up temp file
    await fs.unlink(tempPath).catch(() => {});

    // Clean extracted text
    let cleanedText = text.trim();

    if (preprocessingHint === 'number') {
      // Extract only numbers and decimals
      cleanedText = cleanedText.replace(/[^\d.]/g, '');
    } else if (preprocessingHint === 'time') {
      // Extract time format (HH:MM or minutes)
      const timeMatch = cleanedText.match(/(\d{1,2}):(\d{2})|(\d+)/);
      if (timeMatch) {
        cleanedText = timeMatch[0];
      }
    }

    return { text: cleanedText, confidence };
  } catch (error) {
    console.error('Error extracting text from region:', error);
    return { text: '', confidence: 0 };
  }
};

// Process uploaded screenshot
export const processScreenshot = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No screenshot file uploaded'
      });
    }

    const { templateId, machineId, shift, date } = req.body;

    if (!templateId || !machineId || !shift || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: templateId, machineId, shift, date'
      });
    }

    // Get mapping template
    const template = await ScreenshotMappingTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Mapping template not found'
      });
    }

    // Create screenshot record
    const screenshotRecord = new ScreenshotRecord({
      date: new Date(date),
      shift,
      machineId,
      imageUrl: `/uploads/screenshots/${req.file.filename}`,
      imageSize: req.file.size,
      templateId,
      uploadedBy: req.user.id,
      status: 'processing'
    });

    await screenshotRecord.save();

    // Process image asynchronously
    processImageAsync(req.file.path, template, screenshotRecord._id);

    res.json({
      success: true,
      message: 'Screenshot uploaded and processing started',
      data: {
        recordId: screenshotRecord._id,
        status: 'processing'
      }
    });
  } catch (error) {
    console.error('Error processing screenshot:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process screenshot'
    });
  }
};

// Async image processing
const processImageAsync = async (imagePath, template, recordId) => {
  try {
    const extractedData = {};
    const confidenceScores = {};
    let totalConfidence = 0;
    let fieldCount = 0;

    // Extract each field
    for (const mapping of template.fieldMappings) {
      const region = {
        x: mapping.x,
        y: mapping.y,
        width: mapping.width,
        height: mapping.height
      };

      const result = await extractTextFromRegion(
        imagePath,
        region,
        mapping.preprocessingHint
      );

      extractedData[mapping.fieldName] = result.text;
      confidenceScores[mapping.fieldName] = result.confidence;
      totalConfidence += result.confidence;
      fieldCount++;
    }

    // Calculate overall confidence
    const overallConfidence = fieldCount > 0 ? totalConfidence / fieldCount : 0;
    confidenceScores.overall = overallConfidence;

    // Determine status based on confidence
    let status = 'completed';
    if (overallConfidence < 50) {
      status = 'manual_review';
    }

    // Update record
    await ScreenshotRecord.findByIdAndUpdate(recordId, {
      extractedData,
      confidenceScores,
      status,
      updatedAt: new Date()
    });

    console.log(`Screenshot processing completed for record ${recordId}`);
  } catch (error) {
    console.error('Error in async image processing:', error);
    await ScreenshotRecord.findByIdAndUpdate(recordId, {
      status: 'failed',
      processingError: error.message,
      updatedAt: new Date()
    });
  }
};

// Get screenshot processing status
export const getScreenshotStatus = async (req, res) => {
  try {
    const record = await ScreenshotRecord.findById(req.params.id)
      .populate('machineId', 'name')
      .populate('templateId', 'templateName')
      .populate('uploadedBy', 'username');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Screenshot record not found'
      });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error fetching screenshot status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch screenshot status'
    });
  }
};

// Get screenshot records for a specific date/shift/machine
export const getScreenshotRecords = async (req, res) => {
  try {
    const { date, shift, machineId, status } = req.query;

    const query = {};
    if (date) query.date = new Date(date);
    if (shift) query.shift = shift;
    if (machineId) query.machineId = machineId;
    if (status) query.status = status;

    const records = await ScreenshotRecord.find(query)
      .populate('machineId', 'name')
      .populate('templateId', 'templateName')
      .populate('uploadedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Error fetching screenshot records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch screenshot records'
    });
  }
};

// Verify/correct extracted data manually
export const verifyScreenshotData = async (req, res) => {
  try {
    const { extractedData } = req.body;

    const record = await ScreenshotRecord.findByIdAndUpdate(
      req.params.id,
      {
        extractedData,
        manuallyVerified: true,
        verifiedBy: req.user.id,
        status: 'completed',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Screenshot record not found'
      });
    }

    res.json({
      success: true,
      message: 'Screenshot data verified successfully',
      data: record
    });
  } catch (error) {
    console.error('Error verifying screenshot data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify screenshot data'
    });
  }
};

// Delete screenshot record
export const deleteScreenshotRecord = async (req, res) => {
  try {
    const record = await ScreenshotRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Screenshot record not found'
      });
    }

    // Delete image file
    const imagePath = path.join(__dirname, '../public', record.imageUrl);
    await fs.unlink(imagePath).catch(() => {});

    // Delete record
    await ScreenshotRecord.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Screenshot record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting screenshot record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete screenshot record'
    });
  }
};
