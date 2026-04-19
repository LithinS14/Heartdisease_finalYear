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
        
        // Get absolute path to the Python script using process.cwd()
        const path = require('path');
        const pythonScriptPath = path.resolve(__dirname, '../ml/ml_predict.py');
        const pythonScriptDir = path.dirname(pythonScriptPath);
        
        console.log('[v0] Python script path:', pythonScriptPath);
        console.log('[v0] Python script dir:', pythonScriptDir);
        console.log('[v0] Input values:', inputValues);
        console.log('[v0] String args:', stringArgs);
        
        // Verify Python script exists
        const fs = require('fs');
        if (!fs.existsSync(pythonScriptPath)) {
            console.error('[v0] Python script not found at:', pythonScriptPath);
            return res.status(500).json({
                success: false,
                error: `Python script not found at ${pythonScriptPath}`
            });
        }
        
        // Try python3 first, then python as fallback
        let pythonProcess;
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
        
        try {
            pythonProcess = spawn(pythonCmd, [pythonScriptPath, ...stringArgs], {
                timeout: 30000,
                cwd: pythonScriptDir
            });
        } catch (e) {
            console.log('[v0] First Python command failed, trying alternative');
            const fallbackCmd = pythonCmd === 'python3' ? 'python' : 'python3';
            pythonProcess = spawn(fallbackCmd, [pythonScriptPath, ...stringArgs], {
                timeout: 30000,
                cwd: pythonScriptDir
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
            const chunk = data.toString();
            result += chunk;
            console.log('[v0] Stdout chunk received:', JSON.stringify(chunk));
        });

        pythonProcess.stderr.on('data', (data) => {
            const chunk = data.toString();
            errorOutput += chunk;
            // Only log important errors, not TensorFlow warnings
            if (!chunk.includes('tensorflow') && !chunk.includes('oneDNN')) {
                console.log('[v0] Python stderr:', chunk);
            }
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
                // Parse prediction result - remove TensorFlow warnings from stderr
                let cleanResult = result.trim();
                
                // Filter out only TensorFlow log lines (keep actual error messages)
                const resultLines = cleanResult.split('\n').filter(line => {
                    const trimmed = line.trim();
                    // Keep lines that are actual predictions
                    if (trimmed.includes('Prediction:')) return true;
                    // Skip TensorFlow info logs
                    if (trimmed.startsWith('2026-04-19') && trimmed.includes('I tensorflow')) return false;
                    // Skip other TensorFlow logs
                    if (trimmed.includes('oneDNN') || trimmed.includes('cpu_feature_guard')) return false;
                    return true;
                });
                
                cleanResult = resultLines.join('\n').trim();
                console.log('[v0] Cleaned prediction text:', JSON.stringify(cleanResult));
                console.log('[v0] Full result was:', JSON.stringify(result));
                
                let prediction = 0;
                let confidence = 0;
                let riskLevel = 'Low';

                // Parse output format: "Prediction: X, Confidence: Y%"
                const predMatch = cleanResult.match(/Prediction:\s*(\d+)/);
                const confMatch = cleanResult.match(/Confidence:\s*([\d.]+)%?/);
                
                console.log('[v0] Regex matches - Pred:', predMatch, 'Conf:', confMatch);
                
                if (predMatch && confMatch) {
                    prediction = parseInt(predMatch[1]);
                    confidence = parseFloat(confMatch[1]);

                    // Determine risk level
                    if (prediction === 1) {
                        riskLevel = confidence > 80 ? 'High' : confidence > 50 ? 'Medium' : 'Low';
                    }
                    console.log('[v0] Successfully parsed - Prediction:', prediction, 'Confidence:', confidence);
                } else {
                    console.error('[v0] Failed to parse prediction from:', cleanResult);
                    throw new Error('Could not parse prediction output: ' + cleanResult);
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
