#!/usr/bin/env node

/**
 * Test script to verify the ML prediction pipeline
 * Run with: node test_prediction.js
 */

const axios = require('axios');

async function testPrediction() {
    const testData = {
        age: 45,
        sex: 1,
        cp: 3,
        trestbps: 130,
        chol: 250,
        fbs: 0,
        restecg: 1,
        thalach: 187,
        exang: 0,
        oldpeak: 3.5,
        slope: 3,
        ca: 0,
        thal: 2
    };

    console.log('\n=== Testing Heart Disease Prediction ===\n');
    console.log('Test Data:', testData);
    console.log('\nSending request to http://localhost:5000/api/predict...\n');

    try {
        const response = await axios.post(
            'http://localhost:5000/api/predict',
            testData,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );

        console.log('✅ SUCCESS! Response received:');
        console.log(JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('\n✅ Prediction Results:');
            console.log(`   Prediction: ${response.data.prediction === 1 ? 'DISEASE DETECTED' : 'HEALTHY'}`);
            console.log(`   Confidence: ${response.data.confidence}%`);
            console.log(`   Risk Level: ${response.data.riskLevel}`);
            console.log(`   Message: ${response.data.message}`);
        }
    } catch (error) {
        console.error('❌ ERROR in prediction:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
        process.exit(1);
    }
}

// Check if server is running
const checkServer = async () => {
    try {
        await axios.get('http://localhost:5000/api/health', { timeout: 5000 });
        return true;
    } catch (err) {
        return false;
    }
};

(async () => {
    const serverRunning = await checkServer();
    if (!serverRunning) {
        console.error('❌ Server is not running on http://localhost:5000');
        console.error('Please start the server first with: npm run dev (in server directory)');
        process.exit(1);
    }

    await testPrediction();
})();