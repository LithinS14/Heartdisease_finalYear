const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Health parameters
    age: {
      type: Number,
      required: true
    },
    sex: {
      type: Number,
      required: true,
      description: '1 = Male, 0 = Female'
    },
    cp: {
      type: Number,
      required: true,
      description: 'Chest pain type (0-3)'
    },
    trestbps: {
      type: Number,
      required: true,
      description: 'Resting blood pressure'
    },
    chol: {
      type: Number,
      required: true,
      description: 'Serum cholesterol in mg/dl'
    },
    fbs: {
      type: Number,
      required: true,
      description: 'Fasting blood sugar > 120 mg/dl'
    },
    restecg: {
      type: Number,
      required: true,
      description: 'Resting electrocardiographic results'
    },
    thalach: {
      type: Number,
      required: true,
      description: 'Maximum heart rate achieved'
    },
    exang: {
      type: Number,
      required: true,
      description: 'Exercise induced angina'
    },
    oldpeak: {
      type: Number,
      required: true,
      description: 'ST depression induced by exercise'
    },
    slope: {
      type: Number,
      required: true,
      description: 'Slope of the ST segment'
    },
    ca: {
      type: Number,
      required: true,
      description: 'Number of major vessels colored by fluoroscopy'
    },
    thal: {
      type: Number,
      required: true,
      description: 'Thalassemia'
    },
    // Prediction results
    prediction: {
      type: Number,
      required: true,
      description: '0 = No disease, 1 = Disease present'
    },
    confidence: {
      type: Number,
      required: true,
      description: 'Confidence percentage (0-100)'
    },
    // Risk level
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      required: true
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
readingSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Reading', readingSchema);
