const express = require('express');
const OCRData = require('../models/OCRData');
const { protect } = require('../middleware/auth');
const { processOCRDocument } = require('../utils/ocrProcessor');
const multer = require('multer');

const router = express.Router();

// Setup multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPG, PNG, GIF) and PDFs are allowed.'));
    }
  }
});

// @route   POST /ocr/process
// @desc    Process image or PDF and extract medical parameters using OCR.space API
// @access  Private
router.post('/process', protect, upload.single('file'), async (req, res) => {
  try {
    console.log('[OCR Route] Request received');
    console.log('[OCR Route] User:', req.user?.id);
    console.log('[OCR Route] File:', req.file?.originalname, 'Size:', req.file?.size);
    
    if (!req.file) {
      console.error('[OCR Route] No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';
    console.log(`[OCR Route] Processing ${fileType} file: ${req.file.originalname}`);
    console.log(`[OCR Route] File size: ${req.file.size} bytes, MIME type: ${req.file.mimetype}`);

    // Process the document
    console.log('[OCR Route] Calling processOCRDocument...');
    const result = await processOCRDocument(req.file.buffer, fileType);
    
    console.log('[OCR Route] Processing result:', result.success ? 'Success' : 'Failed');
    console.log('[OCR Route] Result message:', result.message);

    if (!result.success) {
      console.error('[OCR Route] Processing failed:', result.message);
      return res.status(400).json(result);
    }

    // Save to database
    try {
      const ocrRecord = await OCRData.create({
        userId: req.user.id,
        fileName: req.file.originalname,
        fileType,
        extractedText: result.extractedText,
        extractedData: result.extractedData,
        confidence: result.confidence
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          _id: ocrRecord._id,
          fileName: ocrRecord.fileName,
          fileType: ocrRecord.fileType,
          extractedText: result.extractedText,
          extractedData: result.extractedData,
          confidence: result.confidence,
          validation: result.validation,
          createdAt: ocrRecord.createdAt
        }
      });
    } catch (dbError) {
      console.error('[OCR DB Error]', dbError);
      // Return success anyway if processing worked but DB save failed
      res.status(200).json({
        success: true,
        message: 'Processing successful (DB save skipped)',
        data: {
          fileName: req.file.originalname,
          fileType,
          extractedText: result.extractedText,
          extractedData: result.extractedData,
          confidence: result.confidence,
          validation: result.validation
        }
      });
    }
  } catch (error) {
    console.error('[OCR Route Error]', error.message);
    console.error('[OCR Route Error Stack]', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error processing file: ' + error.message,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

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
