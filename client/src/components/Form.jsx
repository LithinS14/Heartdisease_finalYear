import React, { useState } from 'react';
import axios from 'axios';

function Form({ setPrediction, setLoading, setError }) {
const [formData, setFormData] = useState({
age: 45,
sex: 1,
cp: 0,
trestbps: 120,
chol: 200,
fbs: 0,
restecg: 0,
thalach: 150,
exang: 0,
oldpeak: 0,
slope: 0,
ca: 0,
thal: 1
});

const handleChange = (e) => {
const { name, value } = e.target;
setFormData({
    ...formData,
    [name]: name === 'oldpeak' ? parseFloat(value) : parseInt(value)
});
};

const handleSubmit = async (e) => {
e.preventDefault();
setLoading(true);
setPrediction(null);
setError(null);

try {
    const token = localStorage.getItem('token');
    const headers = {};
    
    // Add token to headers if available
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.post('http://localhost:5000/api/predict', formData, { headers });
    
    if (response.data.success) {
        setPrediction(response.data);
    } else {
        setError(response.data.message || 'Prediction failed. Please try again.');
    }
} catch (error) {
    console.error('[v0] Error in prediction:', error);
    console.error('[v0] Error response:', error.response?.data);
    const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to process your data. Please try again.';
    setError(errorMessage);
} finally {
    setLoading(false);
}
};

// Helper function to create form field descriptions
const getFieldDescription = (field) => {
const descriptions = {
    age: 'Your age in years',
    sex: 'Gender (1 = male, 0 = female)',
    cp: 'Chest pain type (0 = typical angina, 1 = atypical angina, 2 = non-anginal pain, 3 = asymptomatic)',
    trestbps: 'Resting blood pressure in mm Hg',
    chol: 'Serum cholesterol in mg/dl',
    fbs: 'Fasting blood sugar > 120 mg/dl (1 = true, 0 = false)',
    restecg: 'Resting electrocardiographic results (0 = normal, 1 = ST-T wave abnormality, 2 = left ventricular hypertrophy)',
    thalach: 'Maximum heart rate achieved',
    exang: 'Exercise induced angina (1 = yes, 0 = no)',
    oldpeak: 'ST depression induced by exercise relative to rest',
    slope: 'Slope of the peak exercise ST segment (0 = upsloping, 1 = flat, 2 = downsloping)',
    ca: 'Number of major vessels colored by fluoroscopy (0-4)',
    thal: 'Thalassemia (0 = normal, 1 = fixed defect, 2 = reversible defect, 3 = unknown)'
};
return descriptions[field] || '';
};

return (
<form className="heart-form" onSubmit={handleSubmit}>
    <div className="form-grid">
    <div className="form-group">
        <label htmlFor="age">
        Age
        <span className="tooltip" data-tooltip={getFieldDescription('age')}>ⓘ</span>
        </label>
        <input
        type="number"
        id="age"
        name="age"
        value={formData.age}
        onChange={handleChange}
        min="1"
        max="120"
        required
        />
    </div>

    <div className="form-group">
        <label htmlFor="sex">
        Sex
        <span className="tooltip" data-tooltip={getFieldDescription('sex')}>ⓘ</span>
        </label>
        <select
        id="sex"
        name="sex"
        value={formData.sex}
        onChange={handleChange}
        required
        >
        <option value="0">Female</option>
        <option value="1">Male</option>
        </select>
    </div>

    <div className="form-group">
        <label htmlFor="cp">
        Chest Pain Type
        <span className="tooltip" data-tooltip={getFieldDescription('cp')}>ⓘ</span>
        </label>
        <select
        id="cp"
        name="cp"
        value={formData.cp}
        onChange={handleChange}
        required
        >
        <option value="0">Typical Angina</option>
        <option value="1">Atypical Angina</option>
        <option value="2">Non-anginal Pain</option>
        <option value="3">Asymptomatic</option>
        </select>
    </div>

    <div className="form-group">
        <label htmlFor="trestbps">
        Resting Blood Pressure
        <span className="tooltip" data-tooltip={getFieldDescription('trestbps')}>ⓘ</span>
        </label>
        <input
        type="number"
        id="trestbps"
        name="trestbps"
        value={formData.trestbps}
        onChange={handleChange}
        min="50"
        max="300"
        required
        />
    </div>

    <div className="form-group">
        <label htmlFor="chol">
        Cholesterol
        <span className="tooltip" data-tooltip={getFieldDescription('chol')}>ⓘ</span>
        </label>
        <input
        type="number"
        id="chol"
        name="chol"
        value={formData.chol}
        onChange={handleChange}
        min="100"
        max="600"
        required
        />
    </div>

    <div className="form-group">
        <label htmlFor="fbs">
        Fasting Blood Sugar
        <span className="tooltip" data-tooltip={getFieldDescription('fbs')}>ⓘ</span>
        </label>
        <select
        id="fbs"
        name="fbs"
        value={formData.fbs}
        onChange={handleChange}
        required
        >
        <option value="0">False</option>
        <option value="1">True</option>
        </select>
    </div>

    <div className="form-group">
        <label htmlFor="restecg">
        Resting ECG
        <span className="tooltip" data-tooltip={getFieldDescription('restecg')}>ⓘ</span>
        </label>
        <select
        id="restecg"
        name="restecg"
        value={formData.restecg}
        onChange={handleChange}
        required
        >
        <option value="0">Normal</option>
        <option value="1">ST-T Wave Abnormality</option>
        <option value="2">Left Ventricular Hypertrophy</option>
        </select>
    </div>

    <div className="form-group">
        <label htmlFor="thalach">
        Max Heart Rate
        <span className="tooltip" data-tooltip={getFieldDescription('thalach')}>ⓘ</span>
        </label>
        <input
        type="number"
        id="thalach"
        name="thalach"
        value={formData.thalach}
        onChange={handleChange}
        min="50"
        max="250"
        required
        />
    </div>

    <div className="form-group">
        <label htmlFor="exang">
        Exercise Induced Angina
        <span className="tooltip" data-tooltip={getFieldDescription('exang')}>ⓘ</span>
        </label>
        <select
        id="exang"
        name="exang"
        value={formData.exang}
        onChange={handleChange}
        required
        >
        <option value="0">No</option>
        <option value="1">Yes</option>
        </select>
    </div>

    <div className="form-group">
        <label htmlFor="oldpeak">
        ST Depression
        <span className="tooltip" data-tooltip={getFieldDescription('oldpeak')}>ⓘ</span>
        </label>
        <input
        type="number"
        id="oldpeak"
        name="oldpeak"
        value={formData.oldpeak}
        onChange={handleChange}
        min="0"
        max="10"
        step="0.1"
        required
        />
    </div>

    <div className="form-group">
        <label htmlFor="slope">
        Slope
        <span className="tooltip" data-tooltip={getFieldDescription('slope')}>ⓘ</span>
        </label>
        <select
        id="slope"
        name="slope"
        value={formData.slope}
        onChange={handleChange}
        required
        >
        <option value="0">Upsloping</option>
        <option value="1">Flat</option>
        <option value="2">Downsloping</option>
        </select>
    </div>

    <div className="form-group">
        <label htmlFor="ca">
        Number of Major Vessels
        <span className="tooltip" data-tooltip={getFieldDescription('ca')}>ⓘ</span>
        </label>
        <select
        id="ca"
        name="ca"
        value={formData.ca}
        onChange={handleChange}
        required
        >
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        </select>
    </div>

    <div className="form-group">
        <label htmlFor="thal">
        Thalassemia
        <span className="tooltip" data-tooltip={getFieldDescription('thal')}>ⓘ</span>
        </label>
        <select
        id="thal"
        name="thal"
        value={formData.thal}
        onChange={handleChange}
        required
        >
        <option value="0">Normal</option>
        <option value="1">Fixed Defect</option>
        <option value="2">Reversible Defect</option>
        <option value="3">Unknown</option>
        </select>
    </div>
    </div>

    <button type="submit" className="submit-button">
    Predict Heart Disease
    </button>
</form>
);
}

export default Form;
