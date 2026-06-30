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

    const [ocrFile, setOcrFile] = useState(null);
    const [ocrProcessing, setOcrProcessing] = useState(false);
    const [ocrPreview, setOcrPreview] = useState(null);

    const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
        ...formData,
        [name]: name === 'oldpeak' ? parseFloat(value) : parseInt(value)
    });
    };

    const handleOCRFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
        // Validate file type - PDF only
        if (selectedFile.type !== 'application/pdf') {
            setError('Please upload a PDF file only');
            return;
        }
        
        setOcrFile(selectedFile);
        setError(null);
        setOcrPreview(null); // PDFs don't have preview
    }
    };

    const handleProcessOCR = async () => {
    if (!ocrFile) {
        setError('Please select a file first');
        return;
    }

    setOcrProcessing(true);
    setError(null);

    try {
        const token = localStorage.getItem('token');
        const formDataRequest = new FormData();
        formDataRequest.append('file', ocrFile);

        console.log('[v0] Processing file with backend:', ocrFile.name, 'Type:', ocrFile.type);

        const response = await axios.post(
            'http://localhost:5000/api/ocr/process',
            formDataRequest,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            }
        );

        if (response.data.success) {
            console.log('[v0] OCR processing successful:', response.data.data);
            const extractedData = response.data.data.extractedData;
            
            // Map extracted data to form fields
            const updates = {};
            const fieldMapping = {
                'Age': 'age', 'age': 'age',
                'Sex': 'sex', 'sex': 'sex',
                'CP': 'cp', 'Chest Pain Type': 'cp', 'cp': 'cp',
                'Trestbps': 'trestbps', 'Blood Pressure': 'trestbps', 'trestbps': 'trestbps',
                'Chol': 'chol', 'Cholesterol': 'chol', 'chol': 'chol',
                'FBS': 'fbs', 'Fasting Blood Sugar': 'fbs', 'fbs': 'fbs',
                'Restecg': 'restecg', 'Resting ECG': 'restecg', 'restecg': 'restecg',
                'Thalach': 'thalach', 'Max Heart Rate': 'thalach', 'thalach': 'thalach',
                'Exang': 'exang', 'Exercise Angina': 'exang', 'exang': 'exang',
                'Oldpeak': 'oldpeak', 'ST Depression': 'oldpeak', 'oldpeak': 'oldpeak',
                'Slope': 'slope', 'slope': 'slope',
                'CA': 'ca', 'Coronary Vessels': 'ca', 'ca': 'ca',
                'Thal': 'thal', 'Thalassemia': 'thal', 'thal': 'thal'
            };

            Object.entries(extractedData).forEach(([key, value]) => {
                const formField = fieldMapping[key] || fieldMapping[key.toLowerCase()];
                if (formField) {
                    try {
                        if (formField === 'oldpeak') {
                            updates[formField] = parseFloat(value);
                        } else {
                            updates[formField] = parseInt(value) || value;
                        }
                        console.log(`[v0] Mapped ${key} to ${formField}: ${updates[formField]}`);
                    } catch (err) {
                        console.error(`[v0] Error converting ${key}:`, err);
                    }
                }
            });

            if (Object.keys(updates).length > 0) {
                setFormData(prev => ({ ...prev, ...updates }));
                console.log(`[v0] Successfully extracted ${Object.keys(updates).length} fields`);
            }

            // Clear OCR section after extraction
            setOcrFile(null);
            setOcrPreview(null);
            setError(null);
        } else {
            setError(response.data.message || 'Failed to process file');
        }
    } catch (err) {
        console.error('[v0] OCR error full:', err);
        console.error('[v0] Error response status:', err.response?.status);
        console.error('[v0] Error response data:', err.response?.data);
        console.error('[v0] Error message:', err.message);
        console.error('[v0] Error config:', err.config);
        
        let errorMessage = 'OCR processing failed: ';
        if (err.response?.data?.message) {
            errorMessage += err.response.data.message;
        } else if (err.response?.status === 401) {
            errorMessage += 'Please login first';
        } else if (err.response?.status === 413) {
            errorMessage += 'File is too large';
        } else if (err.response?.status === 400) {
            errorMessage += 'Invalid file type or format';
        } else if (err.response?.status === 500) {
            errorMessage += 'Server error processing file';
        } else {
            errorMessage += err.message || 'Unknown error. Please try again.';
        }
        
        setError(errorMessage);
    } finally {
        setOcrProcessing(false);
    }
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
        <div className="ocr-upload-section">
        <div className="ocr-header">
            <h3>Extract Data from PDF Report</h3>
            <p>Upload a PDF medical report to auto-fill the form</p>
        </div>
        
        <div className="ocr-input-wrapper">
            <input
            type="file"
            id="ocr-file-input"
            onChange={handleOCRFileSelect}
            accept=".pdf"
            style={{ display: 'none' }}
            />
            <label htmlFor="ocr-file-input" className="ocr-file-label">
            {ocrFile ? (
                <div className="ocr-file-preview">
                {ocrPreview ? (
                    <>
                    <img src={ocrPreview} alt="preview" className="ocr-preview-img" />
                    <span className="ocr-file-name">{ocrFile.name}</span>
                    </>
                ) : (
                    <>
                    <span className="ocr-pdf-icon">📋</span>
                    <span className="ocr-file-name">{ocrFile.name}</span>
                    <small className="ocr-file-size">{(ocrFile.size / 1024).toFixed(1)} KB</small>
                    </>
                )}
                </div>
            ) : (
                <div className="ocr-upload-placeholder">
                <span className="ocr-upload-icon">📄</span>
                <span>Click to upload report or drag and drop</span>
                <small>PNG, JPG, GIF or PDF</small>
                </div>
            )}
            </label>
            
            {ocrFile && (
            <div className="ocr-actions">
                <button
                type="button"
                className="ocr-extract-btn"
                onClick={handleProcessOCR}
                disabled={ocrProcessing}
                >
                {ocrProcessing ? 'Extracting...' : 'Extract Data'}
                </button>
                <button
                type="button"
                className="ocr-cancel-btn"
                onClick={() => {
                    setOcrFile(null);
                    setOcrPreview(null);
                }}
                disabled={ocrProcessing}
                >
                Cancel
                </button>
            </div>
            )}
        </div>
        </div>

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
