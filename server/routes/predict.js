const express = require("express");
const { spawn } = require("child_process");
const Reading = require('../models/Reading');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Cache for model to avoid reloading
let pythonProcessPool = null;
let predictionCache = new Map();

// Helper to create hash of input for caching
const hashInputs = (inputs) => {
  return JSON.stringify(inputs);
};

// @route   POST /predict
// @desc    Predict heart disease
// @access  Private (if authenticated) or Public
router.post("/", async (req, res) => {
    try {
        const inputData = req.body;
        const token = req.headers.authorization?.split(' ')[1];
        let userId = null;

        // Check if user is authenticated (optional)
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
            } catch (err) {
                // Token invalid, continue as guest
            }
        }
        
        // Extract values in the correct order for the ML model
        const inputValues = [
            inputData.age,
            inputData.sex,
            inputData.cp,
            inputData.trestbps,
            inputData.chol,
            inputData.fbs,
            inputData.restecg,
            inputData.thalach,
            inputData.exang,
            inputData.oldpeak,
            inputData.slope,
            inputData.ca,
            inputData.thal
        ];

        // Check cache first
        const cacheKey = hashInputs(inputValues);
        if (predictionCache.has(cacheKey)) {
            console.log('[v0] Cache hit for prediction');
            return res.json(predictionCache.get(cacheKey));
        }

        // Validate all input values are present
        if (inputValues.some(val => val === undefined || val === null || val === '')) {
            return res.status(400).json({
                success: false,
                error: "All health parameters are required"
            });
        }

        // Convert all arguments to strings
        const stringArgs = inputValues.map(arg => arg.toString());
        
        // Get absolute path to the Python script
        const pythonScriptPath = require('path').join(__dirname, '../ml/ml_predict.py');
        
        console.log('[v0] Python script path:', pythonScriptPath);
        console.log('[v0] Input values:', inputValues);
        console.log('[v0] String args:', stringArgs);
        
        // Try python3 first, then python as fallback
        let pythonProcess;
        try {
            pythonProcess = spawn('python3', [pythonScriptPath, ...stringArgs], {
                timeout: 30000
            });
        } catch (e) {
            console.log('[v0] python3 failed, trying python');
            pythonProcess = spawn('python', [pythonScriptPath, ...stringArgs], {
                timeout: 30000
            });
        }
        
        let result = '';
        let errorOutput = '';
        let responseAlreadySent = false;

        // Handle process spawn errors
        pythonProcess.on('error', (err) => {
            console.error('[v0] Failed to spawn Python process:', err);
            if (!responseAlreadySent) {
                responseAlreadySent = true;
                return res.status(500).json({
                    success: false,
                    error: `Failed to start Python: ${err.message}. Make sure Python 3 is installed.`
                });
            }
        });

        // Set timeout for Python process (30 seconds max)
        const timeout = setTimeout(() => {
            pythonProcess.kill();
            if (!responseAlreadySent) {
                responseAlreadySent = true;
                return res.status(500).json({ 
                    success: false,
                    error: "Prediction took too long. Please try again." 
                });
            }
        }, 30000);

        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.log('[v0] Python stderr:', data.toString());
        });

        pythonProcess.on('close', async (code) => {
            clearTimeout(timeout);

            if (responseAlreadySent) {
                console.log('[v0] Response already sent, skipping close handler');
                return;
            }

            console.log('[v0] Python process closed with code:', code);
            console.log('[v0] Python stdout:', result);
            console.log('[v0] Python stderr:', errorOutput);

            if (code !== 0) {
                console.error(`[v0] Python script exited with code ${code}`);
                console.error(`[v0] Error output: ${errorOutput}`);
                responseAlreadySent = true;
                return res.status(500).json({ 
                    success: false,
                    error: `Python process failed: ${errorOutput || 'Unknown error'}` 
                });
            }
            
            try {
                // Parse prediction result
                const predictionText = result.trim();
                console.log('[v0] Prediction text to parse:', predictionText);
                
                let prediction = 0;
                let confidence = 0;
                let riskLevel = 'Low';

                // Parse output format: "Prediction: X, Confidence: Y%"
                if (predictionText.includes('Prediction:')) {
                    const predMatch = predictionText.match(/Prediction:\s*(\d+)/);
                    const confMatch = predictionText.match(/Confidence:\s*([\d.]+)%?/);
                    
                    console.log('[v0] Pred match:', predMatch);
                    console.log('[v0] Conf match:', confMatch);
                    
                    prediction = predMatch ? parseInt(predMatch[1]) : 0;
                    confidence = confMatch ? parseFloat(confMatch[1]) : 0;

                    // Determine risk level
                    if (prediction === 1) {
                        riskLevel = confidence > 80 ? 'High' : confidence > 50 ? 'Medium' : 'Low';
                    }
                }

                const responseData = { 
                    success: true,
                    prediction,
                    confidence,
                    riskLevel,
                    message: prediction === 1 
                        ? 'Heart disease detected. Please consult a doctor.'
                        : 'No heart disease detected. Stay healthy!'
                };

                console.log('[v0] Response data:', responseData);

                // Cache the result
                predictionCache.set(cacheKey, responseData);

                // Keep cache size manageable (max 1000 entries)
                if (predictionCache.size > 1000) {
                    const firstKey = predictionCache.keys().next().value;
                    predictionCache.delete(firstKey);
                }

                // If user is authenticated, save to database
                if (userId) {
                    try {
                        await Reading.create({
                            userId,
                            age: inputData.age,
                            sex: inputData.sex,
                            cp: inputData.cp,
                            trestbps: inputData.trestbps,
                            chol: inputData.chol,
                            fbs: inputData.fbs,
                            restecg: inputData.restecg,
                            thalach: inputData.thalach,
                            exang: inputData.exang,
                            oldpeak: inputData.oldpeak,
                            slope: inputData.slope,
                            ca: inputData.ca,
                            thal: inputData.thal,
                            prediction,
                            confidence,
                            riskLevel
                        });
                    } catch (dbError) {
                        console.error('[v0] Error saving to database:', dbError);
                        // Don't fail the response due to DB error
                    }
                }

                responseAlreadySent = true;
                res.json(responseData);
            } catch (error) {
                console.error('[v0] Predict Error:', error);
                res.status(500).json({ 
                    success: false,
                    error: "Error processing prediction" 
                });
            }
        });
    } catch (error) {
        console.error('[Predict Error]', error);
        res.status(500).json({ 
            success: false,
            error: "Prediction failed" 
        });
    }
});

module.exports = router;
