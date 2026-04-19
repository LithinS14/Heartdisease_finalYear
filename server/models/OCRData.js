const mongoose = require('mongoose');

const ocrDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      enum: ['image', 'pdf'],
      required: true
    },
    extractedText: {
      type: String,
      required: true
    },
    extractedData: {
      type: Map,
      of: String,
      default: new Map()
    },
    imageData: {
      type: String, // Base64 encoded image
      default: null
    },
    confidence: {
      type: Number,
      default: 0,
      description: 'OCR confidence percentage'
    },
    processedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Index for faster queries
ocrDataSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('OCRData', ocrDataSchema);
