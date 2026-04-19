import React from 'react';

function Result({ prediction, error }) {
if (error) {
return (
    <div className="error-message">
    <h3>Error</h3>
    <p>{error}</p>
    </div>
);
}

if (!prediction) {
return (
    <div className="empty-result">
    <div className="heart-icon-large">❤️</div>
    <p>Enter your health parameters and click "Predict" to get your heart health assessment.</p>
    </div>
);
}

// Handle both old string format and new object format
const hasHeartDisease = typeof prediction === 'string' 
  ? prediction.includes("Heart Disease Detected")
  : prediction.prediction === 1;

const resultMessage = typeof prediction === 'string'
  ? prediction
  : prediction.message || (prediction.prediction === 1 ? 'Heart Disease Detected' : 'No Heart Disease Detected');

const confidence = typeof prediction === 'object' ? prediction.confidence : null;
const riskLevel = typeof prediction === 'object' ? prediction.riskLevel : null;

return (
<div className="result-content">
    <div className={`prediction-box ${hasHeartDisease ? 'disease' : 'no-disease'}`}>
    <span className={`prediction-icon ${hasHeartDisease ? 'warning' : 'success'}`}>
        {hasHeartDisease ? '⚠️' : '✅'}
    </span>
    <p className="prediction-text">{resultMessage}</p>
    {confidence && (
        <div style={{ marginTop: '10px', fontSize: '14px', opacity: 0.8 }}>
        <p>Confidence: {confidence.toFixed(1)}%</p>
        {riskLevel && <p>Risk Level: <strong>{riskLevel}</strong></p>}
        </div>
    )}
    </div>

    {hasHeartDisease ? (
    <div className="recommendations">
        <h3>Recommendations</h3>
        <div className="recommendation-section">
        <h4>Diet Recommendations:</h4>
        <ul>
            <li>Reduce sodium intake to less than 2,300mg per day</li>
            <li>Increase consumption of fruits, vegetables, and whole grains</li>
            <li>Limit saturated fats and avoid trans fats</li>
            <li>Choose lean protein sources like fish, poultry, and legumes</li>
            <li>Reduce added sugars and refined carbohydrates</li>
        </ul>
        
        <h4>Lifestyle Changes:</h4>
        <ul>
            <li>Aim for at least 150 minutes of moderate exercise weekly</li>
            <li>Maintain a healthy weight</li>
            <li>Quit smoking and limit alcohol consumption</li>
            <li>Manage stress through meditation, yoga, or other relaxation techniques</li>
            <li>Get regular check-ups and monitor blood pressure</li>
        </ul>
        
        <p className="consult-doctor">
            Consult with a healthcare professional for personalized advice.
        </p>
        </div>
    </div>
    ) : (
    <div className="recommendations">
        <h3>Maintain Your Health</h3>
        <div className="recommendation-section">
        <p>
            Great news! Continue maintaining your healthy lifestyle with these tips:
        </p>
        <ul>
            <li>Regular exercise (150+ minutes per week)</li>
            <li>Balanced diet rich in fruits, vegetables, and whole grains</li>
            <li>Regular health check-ups</li>
            <li>Adequate sleep (7-9 hours per night)</li>
            <li>Stress management techniques</li>
        </ul>
        </div>
    </div>
    )}
</div>
);
}

export default Result;
