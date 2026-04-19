const express = require('express');
const Reading = require('../models/Reading');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /readings
// @desc    Get all readings for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const readings = await Reading.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);

    // Calculate statistics
    const totalReadings = readings.length;
    const diseaseReadings = readings.filter(r => r.prediction === 1).length;
    const healthyReadings = readings.filter(r => r.prediction === 0).length;
    const avgConfidence = readings.length > 0
      ? (readings.reduce((sum, r) => sum + r.confidence, 0) / readings.length).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        readings,
        statistics: {
          totalReadings,
          diseaseReadings,
          healthyReadings,
          avgConfidence
        }
      }
    });
  } catch (error) {
    console.error('[Readings Error]', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching readings',
      error: error.message
    });
  }
});

// @route   GET /readings/:id
// @desc    Get specific reading by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const reading = await Reading.findById(req.params.id);

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found'
      });
    }

    // Check if user owns this reading
    if (reading.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view this reading'
      });
    }

    res.status(200).json({
      success: true,
      data: reading
    });
  } catch (error) {
    console.error('[Readings Error]', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reading',
      error: error.message
    });
  }
});

// @route   POST /readings/save
// @desc    Save a new reading
// @access  Private
router.post('/save', protect, async (req, res) => {
  try {
    const { age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal, prediction, confidence, notes } = req.body;

    // Determine risk level based on confidence and prediction
    let riskLevel = 'Low';
    if (prediction === 1) {
      if (confidence > 80) riskLevel = 'High';
      else if (confidence > 50) riskLevel = 'Medium';
      else riskLevel = 'Low';
    }

    const reading = await Reading.create({
      userId: req.user.id,
      age,
      sex,
      cp,
      trestbps,
      chol,
      fbs,
      restecg,
      thalach,
      exang,
      oldpeak,
      slope,
      ca,
      thal,
      prediction,
      confidence,
      riskLevel,
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Reading saved successfully',
      data: reading
    });
  } catch (error) {
    console.error('[Readings Error]', error);
    res.status(500).json({
      success: false,
      message: 'Error saving reading',
      error: error.message
    });
  }
});

// @route   DELETE /readings/:id
// @desc    Delete a reading
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const reading = await Reading.findById(req.params.id);

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found'
      });
    }

    // Check if user owns this reading
    if (reading.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this reading'
      });
    }

    await Reading.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Reading deleted successfully'
    });
  } catch (error) {
    console.error('[Readings Error]', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting reading',
      error: error.message
    });
  }
});

module.exports = router;
