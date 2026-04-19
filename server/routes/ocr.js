const express = require('express');
const OCRData = require('../models/OCRData');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /ocr/history
// @desc    Get all OCR extractions for current user
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const ocrData = await OCRData.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: ocrData.length,
      data: ocrData
    });
  } catch (error) {
    console.error('[OCR Error]', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching OCR history',
      error: error.message
    });
  }
});

// @route   GET /ocr/:id
// @desc    Get specific OCR data by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const ocrData = await OCRData.findById(req.params.id);

    if (!ocrData) {
      return res.status(404).json({
        success: false,
        message: 'OCR data not found'
      });
    }

    // Check if user owns this OCR data
    if (ocrData.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view this data'
      });
    }

    res.status(200).json({
      success: true,
      data: ocrData
    });
  } catch (error) {
    console.error('[OCR Error]', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching OCR data',
      error: error.message
    });
  }
});

// @route   POST /ocr/save
// @desc    Save OCR extraction results
// @access  Private
router.post('/save', protect, async (req, res) => {
  try {
    const { fileName, fileType, extractedText, extractedData, imageData, confidence } = req.body;

    if (!fileName || !extractedText) {
      return res.status(400).json({
        success: false,
        message: 'fileName and extractedText are required'
      });
    }

    const ocrRecord = await OCRData.create({
      userId: req.user.id,
      fileName,
      fileType: fileType || 'image',
      extractedText,
      extractedData: extractedData || new Map(),
      imageData: imageData || null,
      confidence: confidence || 0
    });

    res.status(201).json({
      success: true,
      message: 'OCR data saved successfully',
      data: ocrRecord
    });
  } catch (error) {
    console.error('[OCR Error]', error);
    res.status(500).json({
      success: false,
      message: 'Error saving OCR data',
      error: error.message
    });
  }
});

// @route   DELETE /ocr/:id
// @desc    Delete OCR data
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const ocrData = await OCRData.findById(req.params.id);

    if (!ocrData) {
      return res.status(404).json({
        success: false,
        message: 'OCR data not found'
      });
    }

    // Check if user owns this OCR data
    if (ocrData.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this data'
      });
    }

    await OCRData.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'OCR data deleted successfully'
    });
  } catch (error) {
    console.error('[OCR Error]', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting OCR data',
      error: error.message
    });
  }
});

module.exports = router;
